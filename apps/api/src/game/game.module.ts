import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { GameRoomsService } from "./game-rooms.service.js";
import { GameGateway } from "./game.gateway.js";

Module({
  providers: [GameGateway, GameRoomsService],
  imports: [AuthModule],
})
export class GameModule {}