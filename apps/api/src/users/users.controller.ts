import {
  type ProfileUpdate,
  ProfileUpdateSchema,
  type PublicProfile,
  type PublicUser,
} from "@ft/core";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import type { User } from "../generated/prisma/client.js";
import { MatchesService } from "../matches/matches.service.js";
import { AvatarsService, detectImage } from "./avatars.service.js";
import { defaultAvatar } from "./default-avatar.js";
import { avatarUrlFor, toPublicUser } from "./public-user.js";
import { UsersService } from "./users.service.js";

const MAX_AVATAR_BYTES = 1024 * 1024; // 1 MB is plenty for a 256-pixel picture

/**
 * What the upload interceptor hands us. Multer types this itself, but it is
 * a dependency of @nestjs/platform-express, not ours: describing the three
 * fields we touch keeps the dependency list honest.
 */
interface UploadedImage {
  buffer: Buffer;
  size: number;
  mimetype: string;
}

@Controller("users")
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly matches: MatchesService,
    private readonly avatars: AvatarsService,
  ) {}

  /** Change your own profile.  200 { user } · 400 invalid · 401 guest · 409 name taken */
  @Patch("me")
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(ProfileUpdateSchema)) update: ProfileUpdate,
  ): Promise<{ user: PublicUser }> {
    return { user: toPublicUser(await this.users.updateProfile(user.id, update)) };
  }

  /**
   * Upload your avatar.  200 { user } · 400 not an image · 401 guest · 413 too big
   *
   * The size limit is enforced by the interceptor (a 10 MB photo never even
   * reaches us), and the type by the file's own first bytes.
   */
  @Post("me/avatar")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("avatar", { limits: { fileSize: MAX_AVATAR_BYTES } }))
  async uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile() file: UploadedImage | undefined,
  ): Promise<{ user: PublicUser }> {
    if (!file) {
      throw new BadRequestException("No image was sent");
    }
    const kind = detectImage(file.buffer);
    if (!kind) {
      throw new BadRequestException("Upload a PNG, JPEG or WebP image");
    }
    await this.avatars.save(user.id, file.buffer, kind);
    return { user: toPublicUser(await this.users.markAvatar(user.id, true)) };
  }

  /**
   * A player's picture. Always answers with an image: players who never
   * uploaded one get a generated avatar, so no page ever shows a broken
   * image and the frontend needs no fallback of its own.
   */
  @Get(":id/avatar")
  async avatar(@Param("id", ParseIntPipe) id: number, @Res() response: Response): Promise<void> {
    // A player can change their picture at any moment, so browsers must ask.
    response.set("Cache-Control", "no-cache");
    const stored = await this.avatars.read(id);
    if (stored) {
      response.type(stored.contentType).send(stored.bytes);
      return;
    }
    const user = await this.users.findById(id);
    response.type("image/svg+xml").send(defaultAvatar(user?.displayName ?? null, id));
  }

  /** A player's public page.  200 profile · 404 no such player */
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
