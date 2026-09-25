import type { Friend } from "@ft/core";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { PresenceService } from "./presence.service.js";
import { avatarUrlFor } from "./public-user.js";

@Injectable()
export class FriendsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly presence: PresenceService,
  ) {}

  async list(userId: number): Promise<Friend[]> {
    const rows = await this.prisma.friendship.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: { friend: { select: { id: true, displayName: true } } },
    });
    return rows.map((row) => this.toFriend(row.friend));
  }

  /**
   * Adds somebody by the name everyone sees. Players without a display name
   * cannot be added, which is fine: nobody knows them by anything else.
   */
  async add(userId: number, displayName: string): Promise<Friend> {
    const friend = await this.prisma.user.findUnique({ where: { displayName } });
    if (!friend) throw new NotFoundException("No player goes by that name");
    if (friend.id === userId) throw new BadRequestException("You are already yourself");
    try {
      await this.prisma.friendship.create({ data: { userId, friendId: friend.id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("They are already on your list");
      }
      throw error;
    }
    return this.toFriend(friend);
  }

  /** Takes somebody off your list. Their own list is untouched. */
  async remove(userId: number, friendId: number): Promise<void> {
    const { count } = await this.prisma.friendship.deleteMany({ where: { userId, friendId } });
    if (count === 0) throw new NotFoundException("They are not on your list");
  }

  private toFriend(user: { id: number; displayName: string | null }): Friend {
    return {
      id: user.id,
      displayName: user.displayName,
      avatarUrl: avatarUrlFor(user.id),
      online: this.presence.isOnline(user.id),
    };
  }
}