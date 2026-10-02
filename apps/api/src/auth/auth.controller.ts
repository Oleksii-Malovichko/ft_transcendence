import {
  type LoginInput,
  LoginSchema,
  type MeResponse,
  type PublicUser,
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
import type { User } from "../generated/prisma/client.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { toPublicUser } from "../users/public-user.js";
import { AuthService } from "./auth.service.js";
import { clearSessionCookie, setSessionCookie } from "./session.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Create an account and log in.  201 { user } + cookie · 400 invalid · 409 email taken */
  @Post("signup")
  async signup(
    @Body(new ZodValidationPipe(SignupSchema)) input: SignupInput,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: PublicUser }> {
    const user = await this.auth.signup(input);
    await this.startSession(res, user);
    return { user: toPublicUser(user) };
  }

  /** Log in.  200 { user } + cookie · 400 invalid input · 401 wrong email or password */
  @Post("login")
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(LoginSchema)) input: LoginInput,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: PublicUser }> {
    const user = await this.auth.validateCredentials(input);
    if (!user) {
      // One message for "unknown email" and "wrong password": no hints.
      throw new UnauthorizedException("Wrong email or password");
    }
    await this.startSession(res, user);
    return { user: toPublicUser(user) };
  }

  @Get("me")
  @Header("Cache-Control", "no-store") // the answer depends on the cookie
  async me(@Req() req: Request): Promise<MeResponse> {
    const user = await this.auth.userFromCookieHeader(req.headers.cookie);
    return { user: user ? toPublicUser(user) : null };
  }

  @Post("logout")
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response): void {
    clearSessionCookie(res);
  }

  private async startSession(res: Response, user: User): Promise<void> {
    setSessionCookie(res, await this.auth.createSessionToken(user));
  }
}
