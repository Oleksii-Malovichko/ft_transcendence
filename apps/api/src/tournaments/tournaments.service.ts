import {
  buildBracket,
  championOf,
  type CreateTournament,
  nextMatch,
  type TournamentDetail,
  type TournamentStatus,
  type TournamentSummary,
} from "@ft/core";
import { Injectable } from "@nestjs/common";
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
