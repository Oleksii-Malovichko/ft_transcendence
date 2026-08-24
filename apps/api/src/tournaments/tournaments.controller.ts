import {
  CreateTournamentSchema,
  JoinTournamentSchema,
  ReportResultSchema,
  type CreateTournament,
  type ReportResult,
  type JoinTournament,
  type TournamentDetail,
  type TournamentSummary,
} from "@ft/core";
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { User } from "../generated/prisma/client.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { TournamentsService } from "./tournaments.service.js";

@Controller("tournaments")
export class TournamentsController {
  constructor(private readonly tournaments: TournamentsService) {}
  /** Every tournament, newest first.  200 list */
  @Get()
  list(): Promise<TournamentSummary[]> {
    return this.tournaments.list();
  }

  /** One tournament with its bracket and the match to play next.  200 · 404 */
  @Get(":id")
  async detail(@Param("id", ParseIntPipe) id: number): Promise<TournamentDetail> {
    const tournament = await this.tournaments.detail(id);
    if (!tournament) {
      throw new NotFoundException("No such tournament");
    }
    return tournament;
  }

  /** Open a tournament for 4 or 8 players.  201 summary · 400 invalid · 401 guest */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body(new ZodValidationPipe(CreateTournamentSchema)) input: CreateTournament,
  ): Promise<TournamentSummary> {
    return this.tournaments.create(input);
  }
  /**
   * Take a seat.  201 bracket · 400 invalid alias · 401 guest · 404 · 409 full or taken
   *
   * 201, not 200: joining creates something (the seat), and the answer is the
   * tournament as it now stands, bracket included.
   */
  @Post(":id/players")
  @UseGuards(JwtAuthGuard)
  join(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(JoinTournamentSchema)) input: JoinTournament,
  ): Promise<TournamentDetail> {
    return this.tournaments.join(id, input.alias, user.id);
  }

  /** Give your seat back, while registration is open.  200 · 401 · 404 · 409 started */
  @Delete(":id/players/me")
  @UseGuards(JwtAuthGuard)
  leave(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<TournamentDetail> {
    return this.tournaments.leave(id, user.id);
  }
  /**
   * Report who won the match being played.  201 bracket · 400 wrong winner ·
   * 401 guest · 404 · 409 not the match that is due
   *
   * The players report it themselves for now; when the game rooms know they
   * belong to a tournament, the server will report it instead.
   */
  @Post(":id/results")
  @UseGuards(JwtAuthGuard)
  report(
    @Param("id", ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(ReportResultSchema)) result: ReportResult,
  ): Promise<TournamentDetail> {
    return this.tournaments.recordResult(id, result);
  }
}
