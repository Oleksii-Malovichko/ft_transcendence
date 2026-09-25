import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { MatchesModule } from "../matches/matches.module.js";
import { TournamentsModule } from "../tournaments/tournaments.module.js";
import { UsersModule } from "../users/users.module.js";
import { GameRoomsService } from "./game-rooms.service.js";
import { GameGateway } from "./game.gateway.js";
import { MatchmakingService } from "./matchmaking.service.js";

@Module({
  // AuthModule gives us AuthService, which turns a cookie into a user.
  imports: [AuthModule, MatchesModule, TournamentsModule, UsersModule],
  providers: [GameGateway, GameRoomsService, MatchmakingService],
})
export class GameModule {}
