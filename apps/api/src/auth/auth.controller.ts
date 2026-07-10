import {
  type LoginInput,
  LoginSchema,
  type MeResponse,
  type SignupInput,
  SignupSchema,
} from "@ft/core";

import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { toPublicUser } from "../users/public-user.js";
import { AuthService } from "./auth.service.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(LoginSchema)) input: LoginInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const user = await this.auth.validateCredentials(input);

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    this.auth.setSessionCookie(res, user);

    return { user: toPublicUser(user) };
  }

  @Post("signup")
  @HttpCode(201)
  async signup(
    @Body(new ZodValidationPipe(SignupSchema)) input: SignupInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const parsed = SignupSchema.safeParse(body);

    if (!parsed.success) {
      throw new UnauthorizedException("Invalid signup data");
    }

    const user = await this.auth.signup(input);

    this.auth.setSessionCookie(res, user);

    return { user: toPublicUser(user) };
  }

  @Get("me")
  @Header("Cache-Control", "no-store")
  async me(@Req() req: Request): Promise<MeResponse> {
    const user = await this.auth.userFromCookieHeader(req.headers.cookie);
    return { user: user ? toPublicUser(user) : null };
  }

  @Post("logout")
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response): void {
    this.auth.clearSessionCookie(res);
  }
}
