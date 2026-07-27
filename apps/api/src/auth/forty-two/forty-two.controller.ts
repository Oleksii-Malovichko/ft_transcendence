import { randomUUID } from "node:crypto";
import {
  Controller,
  Get,
  Inject,
  Query,
  Req,
  Res,
  ServiceUnavailableException,
} from "@nestjs/common";
import { parseCookie } from "cookie";
import type { Request, Response } from "express";
import type { Env } from "../../config/env.js";
import { ENV } from "../../config/env.module.js";
import { AuthService } from "../auth.service.js";
import { setSessionCookie } from "../session.js";
import { authorizeUrl } from "./authorize-url.js";
import { exchangeCode, fetchProfile } from "./forty-two.client.js";
import { FortyTwoService } from "./forty-two.service.js";

const STATE_COOKIE = "oauth_state";
const STATE_TTL_MS = 10 * 60 * 1000;
const STATE_PATH = "/api/auth/42";

@Controller("auth/42")
export class FortyTwoController {
  constructor(
    private readonly fortyTwo: FortyTwoService,
    private readonly auth: AuthService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  @Get()
  start(@Res() response: Response): void {
    const settings = this.fortyTwo.settings;
    if (!settings) {
      throw new ServiceUnavailableException("Signing in with 42 is not set up here");
    }
    const state = randomUUID();
    response.cookie(STATE_COOKIE, state, {
      httpOnly: true,
      secure: true,
      sameSite: "lax", // must survive the redirect back from 42
      maxAge: STATE_TTL_MS,
      path: STATE_PATH,
    });
    response.redirect(authorizeUrl(settings, state));
  }

  @Get("callback")
  async callback(
    @Query("code") code: string | undefined,
    @Query("state") state: string | undefined,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const settings = this.fortyTwo.settings;
    const expected = parseCookie(request.headers.cookie ?? "")[STATE_COOKIE];
    response.clearCookie(STATE_COOKIE, { path: STATE_PATH });
    if (!settings || !code || !state || state !== expected) {
      response.redirect(`${this.env.WEB_ORIGIN}/login?oauth=failed`);
      return;
    }
    const token = await exchangeCode(settings, code);
    const user = await this.fortyTwo.accountFor(await fetchProfile(settings, token));
    setSessionCookie(response, await this.auth.createSessionToken(user));
    response.redirect(this.env.WEB_ORIGIN);
  }
}