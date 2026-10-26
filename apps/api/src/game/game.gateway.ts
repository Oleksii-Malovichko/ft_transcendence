import {
  GAME_EVENTS,
  GAME_INVITE_EVENTS,
  GameChatMessageSchema,
  GameInviteRequestSchema,
  GameInviteResponseSchema,
  type GameState,
  InputMessageSchema,
  type JoinReply,
  JoinRequestSchema,
  MATCH_EVENTS,
  PlayTournamentMatchSchema,
  TOURNAMENT_EVENTS,
  type MatchFound,
} from "@ft/core";
import { randomUUID } from "node:crypto";
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
import { ChatService } from "../chat/chat.service.js";

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
    private readonly chat: ChatService,
  ) {}

  /** Players who said they are ready, keyed by the bracket match they are in. */
  private readonly readyForMatch = new Map<string, ReadyPlayer>();

  /**
   * A browser connected. The session cookie travels with the handshake, so
   * the same check as an HTTP request tells us who this is. Guests are
   * allowed: they can still play locally or against the AI, they just don't
   * appear in anyone's match history.
   */
  handleConnection(client: Socket): Promise<void> {
    const initialized = this.initializeConnection(client);
    client.data.initialized = initialized;
    return initialized;
  }

  private async initializeConnection(client: Socket): Promise<void> {
    const user = await this.auth.userFromCookieHeader(client.handshake.headers.cookie);
    client.data.user = user ?? undefined;
    if (!user) return;
    // A page is open: their friends can see them as online.
    this.presence.arrived(user.id);
    // Were they in the middle of a game when the connection dropped?
    const seat = this.rooms.rejoin(user.id, client.id);
    if (seat) {
      void client.join(seat.roomId);
      client.data.rejoinedMatch = {
        roomId: seat.roomId,
        side: seat.side,
        opponent: "Opponent",
      } satisfies MatchFound;
    }
  }

  @SubscribeMessage(GAME_EVENTS.ready)
  async ready(@ConnectedSocket() client: Socket): Promise<{ rejoined: MatchFound | null }> {
    await this.connectionInitialized(client);
    const rejoined = client.data.rejoinedMatch as MatchFound | undefined;
    delete client.data.rejoinedMatch;
    return { rejoined: rejoined ?? null };
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
  async find(@ConnectedSocket() client: Socket): Promise<void> {
    await this.connectionInitialized(client);
    const user = playerOf(client);
    const player = {
      clientId: client.id,
      userId: user?.id,
      // Never the email: opponents see the display name, or nothing at all.
      label: user?.displayName ?? (user ? "Player" : "Guest"),
    };
    const pair = await this.matchmaking.join(
      player,
      (firstUserId, secondUserId) => this.chat.areBlocked(firstUserId, secondUserId),
    );
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

  @SubscribeMessage(GAME_EVENTS.chatSend)
  async sendGameChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<void> {
    await this.connectionInitialized(client);
    const parsed = GameChatMessageSchema.safeParse(body);
    const roomId = this.rooms.remoteRoomId(client.id);
    if (!parsed.success || !roomId || !client.rooms.has(roomId)) {
      client.emit(GAME_EVENTS.chatError, { message: "In-game chat is not available" });
      return;
    }
    const user = playerOf(client);
    const opponentId = this.rooms.remoteOpponentUserId(client.id);
    if (
      user &&
      opponentId !== undefined &&
      (await this.chat.areBlocked(user.id, opponentId))
    ) {
      client.emit(GAME_EVENTS.chatError, {
        message: "In-game messaging is unavailable because one player is blocked",
      });
      return;
    }
    this.server.to(roomId).emit(GAME_EVENTS.chatMessage, {
      sender: user?.displayName ?? (user ? "Player" : "Guest"),
      body: parsed.data.body,
      createdAt: new Date().toISOString(),
    });
  }

  @SubscribeMessage(GAME_INVITE_EVENTS.send)
  async sendGameInvite(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<void> {
    await this.connectionInitialized(client);
    const inviter = playerOf(client);
    const request = GameInviteRequestSchema.safeParse(body);
    if (!inviter || !request.success || request.data.recipientId === inviter.id) {
      this.inviteError(client, "Could not send game invitation");
      return;
    }
    const recipient = [...this.server.sockets.sockets.values()].find(
      (socket) => playerOf(socket)?.id === request.data.recipientId,
    );
    if (!recipient) {
      this.inviteError(client, "That player is not online");
      return;
    }
    if (await this.chat.areBlocked(inviter.id, request.data.recipientId)) {
      this.inviteError(client, "Game invitations are unavailable because one player is blocked");
      return;
    }
    const inviteId = randomUUID();
    const timer = setTimeout(() => {
      const invite = this.pendingInvites.get(inviteId);
      if (!invite) return;
      this.pendingInvites.delete(inviteId);
      this.server.sockets.sockets.get(invite.inviterClientId)?.emit(GAME_INVITE_EVENTS.error, {
        inviteId,
        message: "Game invitation expired",
      });
      this.notifyInviteParticipant(invite.recipientId, inviteId, "Game invitation expired");
    }, 60_000);
    this.pendingInvites.set(inviteId, {
      inviterClientId: client.id,
      inviterId: inviter.id,
      recipientId: request.data.recipientId,
      timer,
    });
    recipient.emit(GAME_INVITE_EVENTS.incoming, {
      inviteId,
      inviter: inviter.displayName ?? "Player",
    });
  }

  @SubscribeMessage(GAME_INVITE_EVENTS.accept)
  async acceptGameInvite(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<void> {
    await this.connectionInitialized(client);
    const recipient = playerOf(client);
    const request = GameInviteResponseSchema.safeParse(body);
    const inviteId = request.success ? request.data.inviteId : undefined;
    const invite = inviteId ? this.pendingInvites.get(inviteId) : undefined;
    if (!recipient || !inviteId || !invite || invite.recipientId !== recipient.id) {
      this.inviteError(client, "This game invitation is no longer available");
      return;
    }
    const inviterSocket = this.server.sockets.sockets.get(invite.inviterClientId);
    if (!inviterSocket || await this.chat.areBlocked(invite.inviterId, recipient.id)) {
      this.finishInvite(inviteId);
      this.inviteError(client, "This game invitation is no longer available");
      return;
    }
    this.finishInvite(inviteId);
    this.startOnlineGame(
      {
        clientId: inviterSocket.id,
        userId: invite.inviterId,
        label: playerOf(inviterSocket)?.displayName ?? "Player",
      },
      {
        clientId: client.id,
        userId: recipient.id,
        label: recipient.displayName ?? "Player",
      },
    );
  }

  @SubscribeMessage(GAME_INVITE_EVENTS.decline)
  async declineGameInvite(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<void> {
    await this.connectionInitialized(client);
    const recipient = playerOf(client);
    const request = GameInviteResponseSchema.safeParse(body);
    const inviteId = request.success ? request.data.inviteId : undefined;
    const invite = inviteId ? this.pendingInvites.get(inviteId) : undefined;
    if (!recipient || !inviteId || !invite || invite.recipientId !== recipient.id) return;
    this.finishInvite(inviteId);
    this.server.sockets.sockets.get(invite.inviterClientId)?.emit(GAME_INVITE_EVENTS.error, {
      inviteId,
      message: "Game invitation declined",
    });
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
    for (const [inviteId, invite] of this.pendingInvites) {
      if (invite.inviterClientId === client.id) {
        this.finishInvite(inviteId);
        this.notifyInviteParticipant(invite.recipientId, inviteId, "Game invitation cancelled");
      }
    }
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

    private readonly pendingInvites = new Map<
      string,
      { inviterClientId: string; inviterId: number; recipientId: number; timer: ReturnType<typeof setTimeout> }
    >();

    private inviteError(client: Socket, message: string): void {
      client.emit(GAME_INVITE_EVENTS.error, { message });
    }

    private notifyInviteParticipant(userId: number, inviteId: string, message: string): void {
      for (const socket of this.server.sockets.sockets.values()) {
        if (playerOf(socket)?.id === userId) {
          socket.emit(GAME_INVITE_EVENTS.error, { inviteId, message });
        }
      }
    }

    private async connectionInitialized(client: Socket): Promise<void> {
      await (client.data.initialized as Promise<void> | undefined);
    }

    private finishInvite(inviteId: string): void {
      const invite = this.pendingInvites.get(inviteId);
      if (!invite) return;
      clearTimeout(invite.timer);
      this.pendingInvites.delete(inviteId);
    }
  }
}

/** Somebody waiting for the other player of their bracket match. */
interface ReadyPlayer {
  clientId: string;
  userId: number;
  alias: string;
}
