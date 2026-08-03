import { forwardRef, Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { TournamentsController } from "./tournaments.controller.js";
import { TournamentsService } from "./tournaments.service.js";

@Module({
  // forwardRef: AuthModule reaches UsersModule, which reaches back here later.
  imports: [forwardRef(() => AuthModule)],
  controllers: [TournamentsController],
  providers: [TournamentsService],
  exports: [TournamentsService],
})
export class TournamentsModule {}
