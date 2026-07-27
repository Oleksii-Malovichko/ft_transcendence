import { Inject, Injectable } from "@nestjs/common";
import type { Env } from "../../config/env.js";
import { ENV } from "../../config/env.module.js";
import type { User } from "../../generated/prisma/client.js";
import { UsersService } from "../../users/users.service.js";
import type { TokenSettings } from "./forty-two.client.js";
import type { FortyTwoProfile } from "./forty-two.client.js";

@Injectable()
export class FortyTwoService {
  constructor(
    private readonly users: UsersService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  get settings(): TokenSettings | null {
    const { FORTY_TWO_CLIENT_ID, FORTY_TWO_CLIENT_SECRET, FORTY_TWO_REDIRECT_URI } = this.env;
    if (!FORTY_TWO_CLIENT_ID || !FORTY_TWO_CLIENT_SECRET || !FORTY_TWO_REDIRECT_URI) return null;
    return {
      clientId: FORTY_TWO_CLIENT_ID,
      clientSecret: FORTY_TWO_CLIENT_SECRET,
      redirectUri: FORTY_TWO_REDIRECT_URI,
      apiUrl: this.env.FORTY_TWO_API_URL,
    };
  }

  async accountFor(profile: FortyTwoProfile): Promise<User> {
    const linked = await this.users.findByFortyTwoId(profile.id);
    if (linked) return linked;
    const sameEmail = await this.users.findByEmail(profile.email);
    if (sameEmail) return this.users.linkFortyTwo(sameEmail.id, profile.id);
    return this.users.createFromFortyTwo(profile.email, profile.id, profile.login);
  }
}
