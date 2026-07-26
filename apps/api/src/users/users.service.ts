import type { ProfileUpdate } from "@ft/core";
import { ConflictException, Injectable } from "@nestjs/common";
import { Prisma, type User } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";

/** What it takes to create a user: the password HASH, never the password. */
export interface NewUser {
  email: string;
  passwordHash: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Throws Prisma error P2002 when the email is already taken (unique index). */
  create(data: NewUser): Promise<User> {
    return this.prisma.user.create({ data });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * Changes what other players see. Display names are unique, so two people
   * cannot be mistaken for each other; the database decides, which also
   * covers two players picking the same name at the same moment.
   */
  async updateProfile(id: number, update: ProfileUpdate): Promise<User> {
    try {
      return await this.prisma.user.update({ where: { id }, data: update });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("That name is already taken");
      }
      throw error;
    }
  }

  /** Remembers that this user has an avatar of their own. */
  markAvatar(id: number, hasAvatar: boolean): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { hasAvatar } });
  }

  findByFortyTwoId(fortyTwoId: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { fortyTwoId } });
  }

  /** Attaches a 42 account to an account that already exists here. */
  linkFortyTwo(id: number, fortyTwoId: number): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { fortyTwoId } });
  }

  /**
   * Creates an account for somebody arriving from 42. It has no password at
   * all, which is why passwordHash is nullable: there is nothing to check,
   * and an empty string would look like a password that could be guessed.
   * Their 42 login becomes their display name when nobody has taken it.
   */
  async createFromFortyTwo(email: string, fortyTwoId: number, login: string): Promise<User> {
    const taken = await this.prisma.user.findUnique({ where: { displayName: login } });
    return this.prisma.user.create({
      data: { email, fortyTwoId, displayName: taken ? null : login },
    });
  }
}
