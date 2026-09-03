import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module.js";
import { EnvModule } from "./config/env.module.js";
import { GameModule } from "./game/game.module.js";
import { HealthController } from "./health/health.controller.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { TournamentsModule } from "./tournaments/tournaments.module.js";
import { PresenceModule } from "./users/presence.module.js";
import { UsersModule } from "./users/users.module.js";

@Module({
  imports: [
    EnvModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    GameModule,
    TournamentsModule,
    PresenceModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}