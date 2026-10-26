import { BadRequestException, NotFoundException } from "@nestjs/common";
import type { PrismaService } from "../prisma/prisma.service.js";
import { describe, expect, it, vi } from "vitest";
import { ChatService } from "./chat.service.js";

const now = new Date("2026-10-24T08:00:00.000Z");

const conversation = {
  id: 12,
  userLowId: 2,
  userHighId: 9,
  createdAt: now,
  updatedAt: now,
  userLow: { id: 2, displayName: "two" },
  userHigh: { id: 9, displayName: "nine" },
  messages: [],
};

function chatService(prisma: unknown): ChatService {
  return new ChatService(prisma as PrismaService);
}

describe("ChatService.getOrCreateConversation", () => {
  it("stores the same user pair in canonical ID order", async () => {
    const upsert = vi.fn().mockResolvedValue(conversation);
    const service = chatService({
      user: { findUnique: vi.fn().mockResolvedValue({ id: 2 }) },
      userBlock: { findFirst: vi.fn().mockResolvedValue(null) },
      conversation: { upsert },
    });

    const result = await service.getOrCreateConversation(9, 2);

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userLowId_userHighId: { userLowId: 2, userHighId: 9 } },
        create: { userLowId: 2, userHighId: 9 },
      }),
    );
    expect(result.otherUser).toMatchObject({ id: 2, displayName: "two" });
  });

  it("does not let a user start a conversation with themselves", async () => {
    const service = chatService({});
    await expect(service.getOrCreateConversation(2, 2)).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects a recipient that does not exist", async () => {
    const service = chatService({
      user: { findUnique: vi.fn().mockResolvedValue(null) },
      userBlock: { findFirst: vi.fn().mockResolvedValue(null) },
    });
    await expect(service.getOrCreateConversation(2, 99)).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe("ChatService messages", () => {
  it("only returns messages to a conversation participant, in chronological order", async () => {
    const older = { id: 1, conversationId: 12, senderId: 2, body: "first", createdAt: now };
    const newer = {
      id: 2,
      conversationId: 12,
      senderId: 9,
      body: "second",
      createdAt: new Date(now.getTime() + 1000),
    };
    const findMany = vi.fn().mockResolvedValue([newer, older]);
    const service = chatService({
      conversation: {
        findFirst: vi.fn().mockResolvedValue({ userLowId: 2, userHighId: 9 }),
      },
      userBlock: { findFirst: vi.fn().mockResolvedValue(null) },
      message: { findMany },
    });

    await expect(service.listMessages(2, 12)).resolves.toEqual([
      expect.objectContaining({ id: 1, body: "first" }),
      expect.objectContaining({ id: 2, body: "second" }),
    ]);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { conversationId: 12 }, take: 50 }),
    );
  });

  it("does not expose another user's conversation", async () => {
    const createMessage = vi.fn();
    const transaction = {
      conversation: { findFirst: vi.fn().mockResolvedValue(null) },
      userBlock: { findFirst: vi.fn().mockResolvedValue(null) },
      message: { create: createMessage },
      $transaction: undefined,
    };
    const service = chatService({
      $transaction: (work: (tx: typeof transaction) => Promise<unknown>) => work(transaction),
    });

    await expect(service.sendMessage(3, 12, "private")).rejects.toBeInstanceOf(NotFoundException);
    expect(createMessage).not.toHaveBeenCalled();
  });

  it("takes the sender from the authenticated user and persists the message", async () => {
    const create = vi.fn().mockResolvedValue({
      id: 3,
      conversationId: 12,
      senderId: 2,
      body: "hello",
      createdAt: now,
    });
    const update = vi.fn().mockResolvedValue({});
    const transaction = {
      conversation: {
        findFirst: vi.fn().mockResolvedValue({ userLowId: 2, userHighId: 9 }),
        update,
      },
      userBlock: { findFirst: vi.fn().mockResolvedValue(null) },
      message: { create },
    };
    const service = chatService({
      $transaction: (work: (tx: typeof transaction) => Promise<unknown>) => work(transaction),
    });

    await expect(service.sendMessage(2, 12, "hello")).resolves.toMatchObject({
      senderId: 2,
      body: "hello",
    });
    expect(create).toHaveBeenCalledWith({
      data: { conversationId: 12, senderId: 2, body: "hello" },
    });
    expect(update).toHaveBeenCalled();
  });

  it("does not allow messages after either player blocks the other", async () => {
    const create = vi.fn();
    const transaction = {
      conversation: { findFirst: vi.fn().mockResolvedValue({ userLowId: 2, userHighId: 9 }) },
      userBlock: { findFirst: vi.fn().mockResolvedValue({ id: 1 }) },
      message: { create },
    };
    const service = chatService({
      $transaction: (work: (tx: typeof transaction) => Promise<unknown>) => work(transaction),
    });

    await expect(service.sendMessage(2, 12, "hello")).rejects.toThrow(
      "Messaging is unavailable because one player is blocked",
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("stores a user's block idempotently", async () => {
    const upsert = vi.fn().mockResolvedValue({});
    const service = chatService({
      user: { findUnique: vi.fn().mockResolvedValue({ id: 9 }) },
      userBlock: { upsert },
    });

    await service.blockUser(2, 9);

    expect(upsert).toHaveBeenCalledWith({
      where: { blockerId_blockedId: { blockerId: 2, blockedId: 9 } },
      create: { blockerId: 2, blockedId: 9 },
      update: {},
    });
  });
});
