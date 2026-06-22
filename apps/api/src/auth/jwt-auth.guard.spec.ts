import { type ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import type { User } from "../generated/prisma/client.js";
import type { AuthService } from "./auth.service.js";
import { type AuthenticatedRequest, JwtAuthGuard } from "./jwt-auth.guard.js";

const USER = { id: 7, email: "ada@example.com" } as User;

function contextFor(request: Partial<AuthenticatedRequest>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

function guardFindingUser(user: User | null): JwtAuthGuard {
  const auth = { userFromCookieHeader: () => Promise.resolve(user) } as unknown as AuthService;
  return new JwtAuthGuard(auth);
}

describe("JwtAuthGuard", () => {
  it("lets a logged-in user through and attaches them to the request", async () => {
    const request: Partial<AuthenticatedRequest> = { headers: { cookie: "session=token" } };
    await expect(guardFindingUser(USER).canActivate(contextFor(request))).resolves.toBe(true);
    expect(request.user).toBe(USER);
  });

  it("answers 401 when there is no valid session", async () => {
    const request: Partial<AuthenticatedRequest> = { headers: {} };
    await expect(guardFindingUser(null).canActivate(contextFor(request))).rejects.toThrow(
      UnauthorizedException,
    );
  });
});