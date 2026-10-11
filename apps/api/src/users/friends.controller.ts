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

  /** Your contact list, with who is online right now.  200 list · 401 guest */
  @Get()
  list(@CurrentUser() user: User): Promise<Friend[]> {
    return this.friends.list(user.id);
  }

  /** Add somebody by display name.  201 friend · 400 yourself · 404 · 409 already there */
  @Post()
  add(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(AddFriendSchema)) input: AddFriend,
  ): Promise<Friend> {
    return this.friends.add(user.id, input.displayName);
  }

  /** Remove somebody from your list.  204 · 401 guest · 404 not on the list */
  @Delete(":id")
  @HttpCode(204)
  remove(@CurrentUser() user: User, @Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.friends.remove(user.id, id);
  }
}
