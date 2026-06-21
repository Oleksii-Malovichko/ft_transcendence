import type { SignupInput } from "@ft/core";
import { ConflictException, Injectable } from "@nestjs/common";
import { Prisma, type User } from "../generated/prisma/client.js";
import { UsersService } from "../users/users.service.js";
import { PasswordService } from "./password.service.js";

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
}