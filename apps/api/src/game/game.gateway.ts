import {
  GAME_EVENTS,
  type GameState,
  InputMessageSchema,
  type JoinReply,
  JoinRequestSchema,
  MATCH_EVENTS,
  PlayTournamentMatchSchema,
  TOURNAMENT_EVENTS,
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
import { PresenceService } from "../users/presence.service.js";
import { TournamentsService } from "../tournaments/tournaments.service.js";
import { MatchmakingService, type WaitingPlayer } from "./matchmaking.service.js";

/** The player behind a connection, once handleConnection has looked. */
export function playerOf(client: Socket): User | undefined {
  return client.data.user as User | undefined;
}

@WebSocketGateway()
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  /** The rooms can now speak to their players through the socket server. */
  afterInit(): void {
    this.rooms.onEvent((roomId, event, payload) => this.server.to(roomId).emit(event, payload));
  }

  // The Socket.IO server, set by Nest: used to send to everyone in a room.
  @WebSocketServer() private readonly server!: Server;

  constructor(
    private readonly rooms: GameRoomsService,
    private readonly auth: AuthService,
    private readonly matchmaking: MatchmakingService,
    private readonly tournaments: TournamentsService,
    private readonly presence: PresenceService,
  ) {}

  /** Players who said they are ready, keyed by the bracket match they are in. */
  private readonly readyForMatch = new Map<string, ReadyPlayer>();

  /**
   * A browser connected. The session cookie travels with the handshake, so
   * the same check as an HTTP request tells us who this is. Guests are
   * allowed: they can still play locally or against the AI, they just don't
   * appear in anyone's match history.
   */
  async handleConnection(client: Socket): Promise<void> {
    const user = await this.auth.userFromCookieHeader(client.handshake.headers.cookie);
    client.data.user = user ?? undefined;
    if (!user) return;
    // A page is open: their friends can see them as online.
    this.presence.arrived(user.id);
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

  /** Answers immediately: the browser measures how long the round trip took. */
  @SubscribeMessage(GAME_EVENTS.ping)
  ping(): true {
    return true;
  }

  /**
   * "I am ready to play my tournament match."
   *
   * The first of the two to say it waits; the second starts the game. The
   * server checks against the bracket that this player really is in the match
   * that is due, so nobody can jump the queue or play somebody else's match.
   */
  /**
   * "I am ready to play my tournament match."
   *
   * The first of the two to say it waits; the second starts the game. The
   * bracket is checked first, so nobody can jump the queue or play in
   * somebody else's match.
   */
  @SubscribeMessage(TOURNAMENT_EVENTS.play)
  async playTournamentMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<void> {
    const seat = await this.bracketSeatOf(client, body);
    if (!seat) return;
    const key = `${seat.tournamentId}:${seat.round}:${seat.slot}`;
    const waiting = this.readyForMatch.get(key);
    if (!waiting || waiting.userId === seat.me.userId) {
      this.readyForMatch.set(key, seat.me);
      client.emit(TOURNAMENT_EVENTS.waiting);
      return;
    }
    this.readyForMatch.delete(key);
    // The bracket decides the sides: its first player takes the left paddle.
    const [left, right] =
      seat.firstPlayer === waiting.alias ? [waiting, seat.me] : [seat.me, waiting];
    this.startTournamentGame(seat.tournamentId, seat.round, seat.slot, left, right);
  }

  /** Where this player sits in the match that is due, or nothing if they don't. */
  private async bracketSeatOf(client: Socket, body: unknown) {
    const user = playerOf(client);
    const request = PlayTournamentMatchSchema.safeParse(body);
    if (!user || !request.success) return null;
    const tournament = await this.tournaments.detail(request.data.tournamentId, user.id);
    const due = tournament?.nextMatch;
    const alias = tournament?.youAre;
    if (!tournament || !due || !alias || !due.players.includes(alias)) return null;
    return {
      tournamentId: tournament.id,
      round: due.round,
      slot: due.slot,
      firstPlayer: due.players[0],
      me: { clientId: client.id, userId: user.id, alias } satisfies ReadyPlayer,
    };
  }

  private startTournamentGame(
    tournamentId: number,
    round: number,
    slot: number,
    left: ReadyPlayer,
    right: ReadyPlayer,
  ): void {
    const room = this.rooms.createRemote(
      left,
      right,
      (roomId, state) => this.server.to(roomId).emit(GAME_EVENTS.state, state),
      { tournamentId, round, slot, leftAlias: left.alias, rightAlias: right.alias },
    );
    const seats = [
      { player: left, side: "left", opponent: right.alias },
      { player: right, side: "right", opponent: left.alias },
    ] as const;
    for (const seat of seats) {
      const socket = this.server.sockets.sockets.get(seat.player.clientId);
      void socket?.join(room.id);
      const found: MatchFound = { roomId: room.id, side: seat.side, opponent: seat.opponent };
      socket?.emit(MATCH_EVENTS.found, found);
    }
  }

  @SubscribeMessage(MATCH_EVENTS.cancel)
  cancelSearch(@ConnectedSocket() client: Socket): void {
    this.matchmaking.leave(client.id);
  }

  @SubscribeMessage(GAME_EVENTS.leave)
  leave(@ConnectedSocket() client: Socket): void {
    this.rooms.leave(client.id);
  }

  /** Closed tab or lost connection: leave the queue and end the game. */
  handleDisconnect(client: Socket): void {
    const user = playerOf(client);
    if (user) this.presence.left(user.id);
    this.matchmaking.leave(client.id);
    this.rooms.disconnect(client.id);
  }

  // Starts the room, then tells each player which paddle is theirs.
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

/** Somebody waiting for the other player of their bracket match. */
interface ReadyPlayer {
  clientId: string;
  userId: number;
  alias: string;
}
