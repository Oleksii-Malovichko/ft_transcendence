import { GAME_EVENTS, InputMessageSchema, type JoinReply, JoinRequestSchema } from "@ft/core";
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from "@nestjs/websockets";
import type { Socket } from "socket.io";
import { GameRoomsService } from "./game-rooms.service.js";

@WebSocketGateway()
export class GameGateway implements OnGatewayDisconnect {
  constructor(private readonly rooms: GameRoomsService) {}

  @SubscribeMessage(GAME_EVENTS.join)
  join(@ConnectedSocket() client: Socket, @MessageBody() body: unknown): JoinReply {
    if (!JoinRequestSchema.safeParse(body).success) {
      return { error: "Invalid join request" };
    }
    const room = this.rooms.createLocal(client.id);
    return { roomId: room.id };
  }

  @SubscribeMessage(GAME_EVENTS.input)
  input(@ConnectedSocket() client: Socket, @MessageBody() body: unknown): void {
    const message = InputMessageSchema.safeParse(body);
    if (message.success) {
      this.rooms.input(client.id, message.data.side, message.data.input);
    }
  }

  @SubscribeMessage(GAME_EVENTS.leave)
  leave(@ConnectedSocket() client: Socket): void {
    this.rooms.leave(client.id);
  }

  handleDisconnect(client: Socket): void {
    this.rooms.leave(client.id);
  }
}