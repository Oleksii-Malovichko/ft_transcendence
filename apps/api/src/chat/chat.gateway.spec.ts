import { CHAT_EVENTS, type ChatMessage } from "@ft/core";
import { describe, expect, it, vi } from "vitest";
import type { AuthService } from "../auth/auth.service.js";
import type { User } from "../generated/prisma/client.js";
import type { ChatService } from "./chat.service.js";
import { ChatGateway } from "./chat.gateway.js";
import type { Server, Socket } from "socket.io";

const message: ChatMessage = {
  id: 21,
  conversationId: 12,
  senderId: 2,
  body: "hello",
  createdAt: "2026-11-10T19:00:00.000Z",
};

function connectedClient(): Socket {
  return {
    handshake: { headers: { cookie: "session=valid" } },
    join: vi.fn().mockResolvedValue(undefined),
  } as unknown as Socket;
}

describe("ChatGateway", () => {
  it("persists and broadcasts a message to both conversation participants", async () => {
    const user = { id: 2 } as User;
    const auth = { userFromCookieHeader: vi.fn().mockResolvedValue(user) };
    const chat = {
      sendMessageWithRecipient: vi.fn().mockResolvedValue({ message, recipientId: 9 }),
    };
    const gateway = new ChatGateway(auth as unknown as AuthService, chat as unknown as ChatService);
    const emit = vi.fn();
    const broadcast = { to: vi.fn().mockReturnThis(), emit };
    const server = { to: vi.fn().mockReturnValue(broadcast) };
    Object.defineProperty(gateway, "server", { value: server as unknown as Server });
    const client = connectedClient();

    await gateway.handleConnection(client);
    await expect(
      gateway.sendMessage(client, { conversationId: 12, body: " hello " }),
    ).resolves.toEqual({ ok: true });

    expect(client.join).toHaveBeenCalledWith("chat:user:2");
    expect(chat.sendMessageWithRecipient).toHaveBeenCalledWith(2, 12, "hello");
    expect(server.to).toHaveBeenCalledWith("chat:user:2");
    expect(broadcast.to).toHaveBeenCalledWith("chat:user:9");
    expect(emit).toHaveBeenCalledWith(CHAT_EVENTS.message, message);
  });

  it("does not allow unauthenticated sockets to send messages", async () => {
    const auth = { userFromCookieHeader: vi.fn().mockResolvedValue(null) };
    const chat = { sendMessageWithRecipient: vi.fn() };
    const gateway = new ChatGateway(auth as unknown as AuthService, chat as unknown as ChatService);
    const client = connectedClient();

    await gateway.handleConnection(client);
    await expect(
      gateway.sendMessage(client, { conversationId: 12, body: "hello" }),
    ).resolves.toEqual({ ok: false, error: "You must be signed in to send messages" });
    expect(chat.sendMessageWithRecipient).not.toHaveBeenCalled();
  });
});
