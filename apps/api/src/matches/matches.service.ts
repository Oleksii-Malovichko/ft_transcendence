import type { MatchMode, Side } from "@ft/core";
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
}