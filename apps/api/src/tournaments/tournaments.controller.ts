import { CreateTournamentSchema, type CreateTournament, type TournamentSummary } from "@ft/core";
import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { TournamentsService } from "./tournaments.service.js";

@Controller("tournaments")
export class TournamentsController {
  constructor(private readonly tournaments: TournamentsService) {}

  /** Open a tournament for 4 or 8 players.  201 summary · 400 invalid · 401 guest */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body(new ZodValidationPipe(CreateTournamentSchema)) input: CreateTournament,
  ): Promise<TournamentSummary> {
    return this.tournaments.create(input);
  }
}
