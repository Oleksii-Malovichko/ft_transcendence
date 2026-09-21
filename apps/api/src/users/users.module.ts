import { forwardRef, Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { MatchesModule } from "../matches/matches.module.js";
import { AvatarsService } from "./avatars.service.js";
import { FriendsController } from "./friends.controller.js";
import { FriendsService } from "./friends.service.js";
import { UsersController } from "./users.controller.js";
import { UsersService } from "./users.service.js";

@Module({
  // forwardRef: AuthModule needs UsersService and we need its guard.
  imports: [MatchesModule, forwardRef(() => AuthModule)],
  controllers: [FriendsController, UsersController],
  providers: [UsersService, AvatarsService, FriendsService],
  exports: [UsersService],
})
export class UsersModule {}
