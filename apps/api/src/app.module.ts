import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module.js";
import { HealthController } from "./health/health.controller.js";
import { UsersModule } from "./users/users.module.js";
@Module({
  imports: [EnvModule, PrismaModule, UsersModule, AuthModule, GameModule],
  controllers: [HealthController],
})
export class AppModule {}
