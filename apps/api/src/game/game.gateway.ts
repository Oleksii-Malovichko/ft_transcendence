import {
  GAME_EVENTS,
  type GameState,
  InputMessageSchema,
  type JoinReply,
  JoinRequestSchema,
  MATCH_EVENTS,
  type MatchFound,
} from "@ft/core";
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayConnection,
  type OnGatewayInit,
  type OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import { AuthService } from "../auth/auth.service.js";
import type { User } from "../generated/prisma/client.js";
import { GameRoomsService } from "./game-rooms.service.js";
import { MatchmakingService, type WaitingPlayer } from "./matchmaking.service.js";

/** The player behind a connection, once handleConnection has looked. */
export function playerOf(client: Socket): User | undefined {
  return client.data.user as User | undefined;
}

@WebSocketGateway()
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  afterInit(): void {
    this.rooms.onEvent((roomId, event, payload) => this.server.to(roomId).emit(event, payload));
  }

  // The Socket.IO server, set by Nest: used to send to everyone in a room.
  @WebSocketServer() private readonly server!: Server;

  constructor(
    private readonly rooms: GameRoomsService,
    private readonly auth: AuthService,
    private readonly matchmaking: MatchmakingService,
  ) {}

  
  async handleConnection(client: Socket): Promise<void> {
    const user = await this.auth.userFromCookieHeader(client.handshake.headers.cookie);
    client.data.user = user ?? undefined;
    if (!user) return;
    // Were they in the middle of a game when the connection dropped?
    const seat = this.rooms.rejoin(user.id, client.id);
    if (seat) {
      void client.join(seat.roomId);
    }
  }

  /** Starts a game (local or against the AI) for this browser. The return value is the ack. */
  @SubscribeMessage(GAME_EVENTS.join)
  join(@ConnectedSocket() client: Socket, @MessageBody() body: unknown): JoinReply {
    const request = JoinRequestSchema.safeParse(body);
    if (!request.success) {
      return { error: "Invalid join request" };
    }
    const publish = (roomId: string, state: GameState) => {
      this.server.to(roomId).emit(GAME_EVENTS.state, state);
    };
    const room =
      request.data.mode === "ai"
        ? this.rooms.createAi(
            client.id,
            request.data.difficulty,
            publish,
            playerOf(client)?.id,
            request.data.settings,
          )
        : this.rooms.createLocal(client.id, publish, playerOf(client)?.id, request.data.settings);
    // Socket.IO rooms group the connections that receive the room's states.
    void client.join(room.id);
    return { roomId: room.id };
  }

  /** A key changed. Malformed messages are dropped without an answer. */
  @SubscribeMessage(GAME_EVENTS.input)
  input(@ConnectedSocket() client: Socket, @MessageBody() body: unknown): void {
    const message = InputMessageSchema.safeParse(body);
    if (message.success) {
      this.rooms.input(client.id, message.data.side, message.data.input);
    }
  }

  /** Look for an opponent: either we wait, or a game starts right away. */
  @SubscribeMessage(MATCH_EVENTS.find)
  find(@ConnectedSocket() client: Socket): void {
    const user = playerOf(client);
    const pair = this.matchmaking.join({
      clientId: client.id,
      userId: user?.id,
      // Never the email: opponents see the display name, or nothing at all.
      label: user?.displayName ?? (user ? "Player" : "Guest"),
    });
    if (!pair) {
      client.emit(MATCH_EVENTS.waiting);
      return;
    }
    this.startOnlineGame(pair[0], pair[1]);
  }

  @SubscribeMessage(GAME_EVENTS.ping)
  ping(): true {
    return true;
  }

  @SubscribeMessage(MATCH_EVENTS.cancel)
  cancelSearch(@ConnectedSocket() client: Socket): void {
    this.matchmaking.leave(client.id);
  }

  @SubscribeMessage(GAME_EVENTS.leave)
  leave(@ConnectedSocket() client: Socket): void {
    this.rooms.leave(client.id);
  }

  handleDisconnect(client: Socket): void {
    this.matchmaking.leave(client.id);
    this.rooms.disconnect(client.id);
  }

  private startOnlineGame(left: WaitingPlayer, right: WaitingPlayer): void {
    const room = this.rooms.createRemote(left, right, (roomId, state) =>
      this.server.to(roomId).emit(GAME_EVENTS.state, state),
    );
    const seats = [
      { player: left, side: "left", opponent: right.label },
      { player: right, side: "right", opponent: left.label },
    ] as const;
    for (const seat of seats) {
      const socket = this.server.sockets.sockets.get(seat.player.clientId);
      void socket?.join(room.id);
      const found: MatchFound = { roomId: room.id, side: seat.side, opponent: seat.opponent };
      socket?.emit(MATCH_EVENTS.found, found);
    }
  }
}
