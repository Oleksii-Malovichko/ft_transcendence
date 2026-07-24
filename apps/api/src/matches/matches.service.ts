import type { MatchMode, MatchSummary, Side } from "@ft/core";
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

export interface MatchResult {
  roomId: string;
  mode: MatchMode;
  leftUserId?: number | undefined;
  rightUserId?: number | undefined;
  leftScore: number;
  rightScore: number;
  winner: Side;
}

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);
  private readonly recorded = new Set<string>();

  async record(result: MatchResult): Promise<void> {
    if (this.recorded.has(result.roomId)) return;
    this.recorded.add(result.roomId);
    try {
      await this.prisma.match.create({
        data: {
          mode: result.mode,
          leftUserId: result.leftUserId ?? null,
          rightUserId: result.rightUserId ?? null,
          leftScore: result.leftScore,
          rightScore: result.rightScore,
          winner: result.winner,
        },
      });
    } catch (error) {
      this.logger.error(
        `Could not save match ${result.roomId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  constructor(private readonly prisma: PrismaService) {}

  async historyFor(userId: number, take = 10): Promise<MatchSummary[]> {
    const rows = await this.prisma.match.findMany({
      where: { OR: [{ leftUserId: userId }, { rightUserId: userId }] },
      orderBy: { playedAt: "desc" },
      take,
      include: {
        leftUser: { select: { displayName: true } },
        rightUser: { select: { displayName: true } },
      },
    });
    return rows.map((row) => toSummary(row, userId));
  }

  /** How many games this player finished, and how many they won. */
  async statsFor(userId: number): Promise<{ played: number; won: number }> {
    const [played, wonLeft, wonRight] = await Promise.all([
      this.prisma.match.count({ where: { OR: [{ leftUserId: userId }, { rightUserId: userId }] } }),
      this.prisma.match.count({ where: { leftUserId: userId, winner: "left" } }),
      this.prisma.match.count({ where: { rightUserId: userId, winner: "right" } }),
    ]);
    return { played, won: wonLeft + wonRight };
  }
}

interface MatchRow {
  id: number;
  mode: string;
  leftUserId: number | null;
  leftScore: number;
  rightScore: number;
  winner: string;
  playedAt: Date;
  leftUser: { displayName: string | null } | null;
  rightUser: { displayName: string | null } | null;
}

/** Turns a stored row into the view of the player who is looking at it. */
function toSummary(row: MatchRow, userId: number): MatchSummary {
  const onLeft = row.leftUserId === userId;
  const other = onLeft ? row.rightUser : row.leftUser;
  const mode = row.mode as MatchMode;
  return {
    id: row.id,
    mode,
    opponent: opponentName(mode, other?.displayName ?? null),
    yourScore: onLeft ? row.leftScore : row.rightScore,
    theirScore: onLeft ? row.rightScore : row.leftScore,
    won: row.winner === (onLeft ? "left" : "right"),
    playedAt: row.playedAt.toISOString(),
  };
}

function opponentName(mode: MatchMode, displayName: string | null): string {
  if (mode === "ai") return "AI";
  if (mode === "local") return "Local player";
  return displayName ?? "Guest";
}
