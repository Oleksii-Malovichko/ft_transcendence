import type { SignupInput } from "@ft/core";
import { ConflictException, Injectable } from "@nestjs/common";
import { parseCookie } from "cookie";
import { Prisma, type User } from "../generated/prisma/client.js";
import { UsersService } from "../users/users.service.js";
import { PasswordService } from "./password.service.js";
import { SESSION_COOKIE } from "./session.js";

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly passwords: PasswordService,
  ) {}


  async signup(input: SignupInput): Promise<User> {
    const passwordHash = await this.passwords.hash(input.password);
    try {
      return await this.users.create({ email: input.email, passwordHash });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException("An account with this email already exists");
      }
      throw error;
    }
  }
  async userFromCookieHeader(header: string | undefined): Promise<User | null> {
    const token = header ? parseCookie(header)[SESSION_COOKIE] : undefined;
    const userId = token ? await this.userIdFromToken(token) : null;
    return userId === null ? null : this.users.findById(userId);
  }

  private async userIdFromToken(token: string): Promise<number | null> {
    try {
      const payload = await this.jwt.verifyAsync<{ sub?: string }>(token);
      const id = Number(payload.sub);
      return Number.isInteger(id) && id > 0 ? id : null;
    } catch {
      return null; // expired, edited, or signed with another secret
    }
  }
}