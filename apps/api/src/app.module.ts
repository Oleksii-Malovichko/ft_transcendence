import { Module } from "@nestjs/common";
import { HealthController } from "./health/health.controller.js";
import { UsersModule } from "./users/users.module.js";
@Module({
  imports: [EnvModule, PrismaModule, UsersModule],
  controllers: [HealthController],
})
export class AppModule {}
