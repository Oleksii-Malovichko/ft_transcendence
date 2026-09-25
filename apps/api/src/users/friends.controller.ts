import { type AddFriend, AddFriendSchema, type Friend } from "@ft/core";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import type { User } from "../generated/prisma/client.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { FriendsService } from "./friends.service.js";

@Controller("users/me/friends")
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friends: FriendsService) {}

  @Get()
  list(@CurrentUser() user: User): Promise<Friend[]> {
    return this.friends.list(user.id);
  }

  @Post()
  add(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(AddFriendSchema)) input: AddFriend,
  ): Promise<Friend> {
    return this.friends.add(user.id, input.displayName);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@CurrentUser() user: User, @Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.friends.remove(user.id, id);
  }
}
