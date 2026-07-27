import { describe, expect, it } from "vitest";
import type { Env } from "../../config/env.js";
import type { User } from "../../generated/prisma/client.js";
import type { UsersService } from "../../users/users.service.js";
import { FortyTwoService } from "./forty-two.service.js";

const PROFILE = { id: 4242, login: "ada", email: "ada@student.42.fr" };
const EXISTING = { id: 7, email: PROFILE.email } as User;

function serviceWith(users: Partial<UsersService>): FortyTwoService {
  return new FortyTwoService(users as UsersService, {} as Env);
}

describe("FortyTwoService.accountFor", () => {
  it("returns the account already linked to that 42 id", async () => {
    const service = serviceWith({ findByFortyTwoId: () => Promise.resolve(EXISTING) });
    await expect(service.accountFor(PROFILE)).resolves.toEqual(EXISTING);
  });

  it("links 42 to an account that already has this email", async () => {
    let linked: [number, number] | null = null;
    const service = serviceWith({
      findByFortyTwoId: () => Promise.resolve(null),
      findByEmail: () => Promise.resolve(EXISTING),
      linkFortyTwo: (id, fortyTwoId) => {
        linked = [id, fortyTwoId];
        return Promise.resolve(EXISTING);
      },
    });
    await service.accountFor(PROFILE);
    expect(linked).toEqual([EXISTING.id, PROFILE.id]);
  });

  it("creates an account when nobody here matches", async () => {
    let created: unknown;
    const service = serviceWith({
      findByFortyTwoId: () => Promise.resolve(null),
      findByEmail: () => Promise.resolve(null),
      createFromFortyTwo: (email, fortyTwoId, login) => {
        created = { email, fortyTwoId, login };
        return Promise.resolve(EXISTING);
      },
    });
    await service.accountFor(PROFILE);
    expect(created).toEqual({ email: PROFILE.email, fortyTwoId: PROFILE.id, login: PROFILE.login });
  });
});

describe("FortyTwoService.settings", () => {
  it("is nothing until all three values are set", () => {
    const partial = { FORTY_TWO_CLIENT_ID: "id", FORTY_TWO_API_URL: "https://x" } as Env;
    expect(new FortyTwoService({} as UsersService, partial).settings).toBeNull();
  });
});
