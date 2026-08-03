import {
  buildBracket,
  drawSeats,
  championOf,
  type CreateTournament,
  nextMatch,
  type TournamentDetail,
  type TournamentStatus,
  type TournamentSummary,
} from "@ft/core";
import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class TournamentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateTournament): Promise<TournamentSummary> {
    const created = await this.prisma.tournament.create({ data: input });
    return { ...toSummary(created), registered: 0 };
  }

  async list(): Promise<TournamentSummary[]> {
    const rows = await this.prisma.tournament.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { _count: { select: { players: true } } },
    });
    return rows.map((row) => ({ ...toSummary(row), registered: row._count.players }));
  }

  async join(tournamentId: number, alias: string, userId: number): Promise<TournamentDetail> {
    await this.prisma
      .$transaction(async (tx) => {
        const tournament = await tx.tournament.findUnique({
          where: { id: tournamentId },
          include: { players: { select: { id: true } } },
        });
        if (!tournament) throw new NotFoundException("No such tournament");
        if (tournament.status !== "open") throw new ConflictException("Registration is closed");
        const taken = tournament.players.length;
        if (taken >= tournament.size) throw new ConflictException("This tournament is full");

        await tx.tournamentPlayer.create({
          data: { tournamentId, userId, alias, seat: taken },
        });
        if (taken + 1 === tournament.size) {
          await this.drawAndStart(tx, tournamentId, tournament.size);
        }
      })
      .catch((error: unknown) => {
        throw asJoinError(error);
      });
    return (await this.detail(tournamentId))!;
  }

  /** Shuffles the seats and opens the bracket. */
  private async drawAndStart(
    tx: Prisma.TransactionClient,
    tournamentId: number,
    size: number,
  ): Promise<void> {
    const players = await tx.tournamentPlayer.findMany({
      where: { tournamentId },
      orderBy: { id: "asc" },
    });
    const seats = drawSeats(size);
    // Seats are unique per tournament, so they cannot be swapped in place:
    // park them out of the way first, then write the drawn ones.
    for (const [index, player] of players.entries()) {
      await tx.tournamentPlayer.update({ where: { id: player.id }, data: { seat: -1 - index } });
    }
    for (const [index, player] of players.entries()) {
      await tx.tournamentPlayer.update({ where: { id: player.id }, data: { seat: seats[index]! } });
    }
    await tx.tournament.update({ where: { id: tournamentId }, data: { status: "running" } });
  }

  /** One tournament with its bracket, or null when there is no such id. */
  async detail(id: number): Promise<TournamentDetail | null> {
    const row = await this.prisma.tournament.findUnique({
      where: { id },
      include: { players: { orderBy: { seat: "asc" } } },
    });
    if (!row) return null;
    const aliasesBySeat = Array.from({ length: row.size }, (_, seat) => {
      return row.players.find((player) => player.seat === seat)?.alias ?? null;
    });
    const bracket = buildBracket(aliasesBySeat);
    return {
      ...toSummary(row),
      registered: row.players.length,
      players: row.players.map((player) => ({ alias: player.alias, seat: player.seat })),
      bracket,
      nextMatch: nextMatch(bracket),
      champion: championOf(bracket),
    };
  }
}

function toSummary(row: {
  id: number;
  name: string;
  size: number;
  status: string;
}): TournamentSummary {
  return {
    id: row.id,
    name: row.name,
    size: row.size,
    status: row.status as TournamentStatus,
    registered: 0,
  };
}

/** Turns a refused insert into the reason a player will understand. */
function asJoinError(error: unknown): unknown {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const fields = String(error.meta?.["target"] ?? "");
    return new ConflictException(
      fields.includes("alias") ? "That alias is taken" : "You already have a seat",
    );
  }
  return error;
}
