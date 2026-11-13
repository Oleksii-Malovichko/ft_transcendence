import { CHAT_EVENTS, SendChatMessageSchema, type ChatSendResult } from "@ft/core";
import { HttpException, Injectable } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import type { User } from "../generated/prisma/client.js";
import { AuthService } from "../auth/auth.service.js";
import { ChatService } from "./chat.service.js";

function userRoom(userId: number): string {
  return `chat:user:${userId}`;
}

function exceptionMessage(error: HttpException): string {
  const response = error.getResponse();
  if (typeof response === "string") return response;
  if (typeof response === "object" && response !== null && "message" in response) {
    const message = response.message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(", ");
  }
  return error.message;
}

@Injectable()
@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer() private readonly server!: Server;

  private readonly connections = new WeakMap<Socket, Promise<User | null>>();

  constructor(
    private readonly auth: AuthService,
    private readonly chat: ChatService,
  ) {}

  handleConnection(client: Socket): Promise<void> {
    const user = this.auth
      .userFromCookieHeader(client.handshake.headers.cookie)
      .then(async (authenticatedUser) => {
        if (authenticatedUser) await client.join(userRoom(authenticatedUser.id));
        return authenticatedUser;
      });
    this.connections.set(client, user);
    return user.then(() => undefined);
  }

  @SubscribeMessage(CHAT_EVENTS.send)
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<ChatSendResult> {
    const user = await this.connections.get(client);
    if (!user) return { ok: false, error: "You must be signed in to send messages" };

    const parsed = SendChatMessageSchema.safeParse(body);
    if (!parsed.success) return { ok: false, error: "Invalid direct message" };

    try {
      const { message, recipientId } = await this.chat.sendMessageWithRecipient(
        user.id,
        parsed.data.conversationId,
        parsed.data.body,
      );
      this.server
        .to(userRoom(user.id))
        .to(userRoom(recipientId))
        .emit(CHAT_EVENTS.message, message);
      return { ok: true };
    } catch (error) {
      if (error instanceof HttpException) {
        return { ok: false, error: exceptionMessage(error) };
      }
      throw error;
    }
  }
}
