import { Module } from "@nestjs/common";
import { GameRoomsService } from "./game-rooms.service.js";
import { GameGateway } from "./game.gateway.js";

@Module({
  providers: [GameGateway, GameRoomsService],
})
export class GameModule {}