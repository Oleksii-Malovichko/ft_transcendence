import type { PublicProfile } from "@ft/core";
import { Controller, Get, NotFoundException, Param, ParseIntPipe } from "@nestjs/common";
import { MatchesService } from "../matches/matches.service.js";
import { avatarUrlFor } from "./public-user.js";
import { UsersService } from "./users.service.js";

@Controller("users")
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly matches: MatchesService,
  ) {}

  @Get(":id")
  async profile(@Param("id", ParseIntPipe) id: number): Promise<PublicProfile> {
    const user = await this.users.findById(id);
    if (!user) {
      throw new NotFoundException("No such player");
    }
    const [stats, matches] = await Promise.all([
      this.matches.statsFor(id),
      this.matches.historyFor(id),
    ]);
    return {
      id: user.id,
      displayName: user.displayName,
      avatarUrl: avatarUrlFor(user.id),
      played: stats.played,
      won: stats.won,
      matches,
    };
  }
}