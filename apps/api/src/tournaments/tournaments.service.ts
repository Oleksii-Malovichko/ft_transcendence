import {
  buildBracket,
  championOf as findChampion,
  drawSeats,
  type CreateTournament,
  type ReportResult,
  nextMatch,
  reportWinner,
  type TournamentDetail,
  type TournamentStatus,
  type TournamentSummary,
} from "@ft/core";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
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

  /**
   * Takes a seat. Everything happens in one transaction: two players pressing
   * "join" at the same instant must not both get the last seat, and the
   * database's unique indexes refuse a second alias or a second seat even if
   * they do. When the last seat is taken, the seats are drawn again — the
   * bracket must not reward whoever registered first — and the tournament
   * starts.
   */
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

  /**
   * Gives a seat back. Only while registration is open: once the draw has
   * happened, leaving would take a player out of a bracket other people are
   * already playing in. The remaining seats are closed up, so they stay
   * 0, 1, 2 … and the next player to arrive lands on the free one.
   */
  async leave(tournamentId: number, userId: number): Promise<TournamentDetail> {
    await this.prisma.$transaction(async (tx) => {
      const tournament = await tx.tournament.findUnique({ where: { id: tournamentId } });
      if (!tournament) throw new NotFoundException("No such tournament");
      if (tournament.status !== "open") {
        throw new ConflictException("The tournament has already started");
      }
      const { count } = await tx.tournamentPlayer.deleteMany({ where: { tournamentId, userId } });
      if (count === 0) throw new NotFoundException("You have no seat here");
      const left = await tx.tournamentPlayer.findMany({
        where: { tournamentId },
        orderBy: { seat: "asc" },
      });
      for (const [index, player] of left.entries()) {
        if (player.seat !== index) {
          await tx.tournamentPlayer.update({ where: { id: player.id }, data: { seat: index } });
        }
      }
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

  /**
   * Records who won one match, which moves them into the next round (the
   * bracket is rebuilt from the results, so nothing else has to be updated).
   * Only the match that is actually due can be reported, and only with one of
   * its two players as the winner: a wrong report would break the bracket for
   * everybody, and the unique index makes sure a match is decided once.
   */
  async recordResult(tournamentId: number, result: ReportResult): Promise<TournamentDetail> {
    const before = await this.detail(tournamentId);
    if (!before) throw new NotFoundException("No such tournament");
    if (before.status !== "running") throw new ConflictException("This tournament is not running");
    const due = before.nextMatch;
    if (!due || due.round !== result.round || due.slot !== result.slot) {
      throw new ConflictException("That is not the match being played");
    }
    if (!due.players.includes(result.winner)) {
      throw new BadRequestException("The winner must be one of the two players");
    }
    await this.prisma.tournamentResult.create({
      data: {
        tournamentId,
        round: result.round,
        slot: result.slot,
        winnerAlias: result.winner,
      },
    });
    const after = (await this.detail(tournamentId))!;
    return after.champion ? this.finish(tournamentId) : after;
  }

  /** The final is over: nothing more will be played here. */
  private async finish(tournamentId: number): Promise<TournamentDetail> {
    await this.prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: "finished" },
    });
    return (await this.detail(tournamentId))!;
  }

  /** One tournament with its bracket, or null when there is no such id. */
  async detail(id: number, userId?: number): Promise<TournamentDetail | null> {
    const row = await this.prisma.tournament.findUnique({
      where: { id },
      include: {
        players: { orderBy: { seat: "asc" } },
        results: { orderBy: [{ round: "asc" }, { slot: "asc" }] },
      },
    });
    if (!row) return null;
    const aliasesBySeat = Array.from({ length: row.size }, (_, seat) => {
      return row.players.find((player) => player.seat === seat)?.alias ?? null;
    });
    // The bracket comes from the seats; the stored results move the winners up.
    const bracket = row.results.reduce(
      (current, result) => reportWinner(current, result.round, result.slot, result.winnerAlias),
      buildBracket(aliasesBySeat),
    );
    return {
      ...toSummary(row),
      registered: row.players.length,
      players: row.players.map((player) => ({ alias: player.alias, seat: player.seat })),
      bracket,
      nextMatch: nextMatch(bracket),
      youAre: row.players.find((player) => player.userId === userId)?.alias ?? null,
      champion: findChampion(bracket),
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
