import { type PublicUser, SignupSchema } from "@ft/core";
import { Body, Controller, Post } from "@nestjs/common";
import { toPublicUser } from "../users/public-user.js";
import { AuthService } from "./auth.service.js";
import { parseBody } from "./parse-body.js";
import { clearSessionCookie, setSessionCookie } from "./session.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("signup")
  async signup(@Body() body: unknown): Promise<{ user: PublicUser }> {
    const user = await this.auth.signup(parseBody(SignupSchema, body));
    return { user: toPublicUser(user) };
  }
  @Post("logout")
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response): void {
    clearSessionCookie(res);
 }
}