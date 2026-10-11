import { ConflictException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { Prisma, type User } from "../generated/prisma/client.js";
import type { PrismaService } from "../prisma/prisma.service.js";
import { UsersService } from "./users.service.js";

const ADA = { id: 1, email: "ada@example.com", displayName: "ada" } as User;

function serviceWhereUpdate(update: () => Promise<User>): UsersService {
  return new UsersService({ user: { update } } as unknown as PrismaService);
}

/** What Prisma throws when a unique index refuses a value. */
function duplicateName(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
  });
}

describe("UsersService.updateProfile", () => {
  it("returns the user as it is after the change", async () => {
    const service = serviceWhereUpdate(() => Promise.resolve(ADA));
    await expect(service.updateProfile(1, { displayName: "ada" })).resolves.toEqual(ADA);
  });

  it("turns a name already taken into a conflict, not a 500", async () => {
    const service = serviceWhereUpdate(() => Promise.reject(duplicateName()));
    await expect(service.updateProfile(1, { displayName: "ada" })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it("lets any other database error through untouched", async () => {
    const service = serviceWhereUpdate(() => Promise.reject(new Error("connection lost")));
    await expect(service.updateProfile(1, { displayName: "ada" })).rejects.toThrow(
      "connection lost",
    );
  });
});

describe("UsersService.markAvatar", () => {
  it("records that the user now has a picture", async () => {
    let received: unknown;
    const service = new UsersService({
      user: {
        update: (args: unknown) => {
          received = args;
          return Promise.resolve(ADA);
        },
      },
    } as unknown as PrismaService);
    await service.markAvatar(1, true);
    expect(received).toEqual({ where: { id: 1 }, data: { hasAvatar: true } });
  });
});
