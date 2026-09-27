import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { Prisma } from "../generated/prisma/client.js";
import type { PrismaService } from "../prisma/prisma.service.js";
import { FriendsService } from "./friends.service.js";
import { PresenceService } from "./presence.service.js";

const ADA = { id: 7, displayName: "ada" };

function serviceWith(prisma: unknown, online: number[] = []): FriendsService {
  const presence = new PresenceService();
  for (const id of online) presence.arrived(id);
  return new FriendsService(prisma as PrismaService, presence);
}

describe("FriendsService.list", () => {
  it("says who is online and who is not", async () => {
    const service = serviceWith(
      {
        friendship: {
          findMany: () =>
            Promise.resolve([{ friend: ADA }, { friend: { id: 9, displayName: "bob" } }]),
        },
      },
      [7],
    );
    const friends = await service.list(1);
    expect(friends.map((friend) => [friend.displayName, friend.online])).toEqual([
      ["ada", true],
      ["bob", false],
    ]);
    expect(friends[0]?.avatarUrl).toBe("/api/users/7/avatar");
  });
});

describe("FriendsService.add", () => {
  const duplicate = new Prisma.PrismaClientKnownRequestError("dup", {
    code: "P2002",
    clientVersion: "test",
  });

  it("refuses a name nobody goes by", async () => {
    const service = serviceWith({ user: { findUnique: () => Promise.resolve(null) } });
    await expect(service.add(1, "nobody")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("refuses to add yourself", async () => {
    const service = serviceWith({ user: { findUnique: () => Promise.resolve(ADA) } });
    await expect(service.add(ADA.id, "ada")).rejects.toBeInstanceOf(BadRequestException);
  });

  it("refuses somebody already on the list", async () => {
    const service = serviceWith({
      user: { findUnique: () => Promise.resolve(ADA) },
      friendship: { create: () => Promise.reject(duplicate) },
    });
    await expect(service.add(1, "ada")).rejects.toBeInstanceOf(ConflictException);
  });

  it("returns the friend it added", async () => {
    const service = serviceWith(
      {
        user: { findUnique: () => Promise.resolve(ADA) },
        friendship: { create: () => Promise.resolve({}) },
      },
      [ADA.id],
    );
    await expect(service.add(1, "ada")).resolves.toMatchObject({ id: 7, online: true });
  });
});

describe("FriendsService.remove", () => {
  it("complains when they were not on the list", async () => {
    const service = serviceWith({
      friendship: { deleteMany: () => Promise.resolve({ count: 0 }) },
    });
    await expect(service.remove(1, 2)).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe("PresenceService", () => {
  it("keeps somebody online until their last tab closes", () => {
    const presence = new PresenceService();
    presence.arrived(1);
    presence.arrived(1);
    presence.left(1);
    expect(presence.isOnline(1)).toBe(true);
    presence.left(1);
    expect(presence.isOnline(1)).toBe(false);
    expect(presence.count).toBe(0);
  });
});