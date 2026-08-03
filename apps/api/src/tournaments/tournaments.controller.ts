import {
  CreateTournamentSchema,
  type CreateTournament,
  type JoinTournament,
  JoinTournamentSchema,
  type TournamentDetail,
  type TournamentSummary,
} from "@ft/core";
import {
  Body,
  Controller,
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
  /** Take a seat.  200 bracket · 400 invalid alias · 401 guest · 404 · 409 full or taken */
  @Post(":id/players")
  @UseGuards(JwtAuthGuard)
  join(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(JoinTournamentSchema)) input: JoinTournament,
  ): Promise<TournamentDetail> {
    return this.tournaments.join(id, input.alias, user.id);
  }
}
