import { randomUUID } from "node:crypto";
import {
  AI_PRESETS,
  AiPlayer,
  type Difficulty,
  type GameState,
  type GameSettings,
  type MatchMode,
  type PaddleInput,
  type Side,
} from "@ft/core";
import { Injectable, type OnModuleDestroy } from "@nestjs/common";
import { MatchesService } from "../matches/matches.service.js";
import { GAME_EVENTS } from "@ft/core";
import { GameRoom } from "./game-room.js";

/** Sends a room's new state to whoever is watching it (the gateway does the sending). */
type Publish = (roomId: string, state: GameState) => void;

/** How the service talks to the players of a room (set by the gateway). */
type Notify = (roomId: string, event: string, payload: unknown) => void;

/** A player who dropped out, and the seat waiting for them. */
interface AwaySeat {
  roomId: string;
  side: Side;
  /** The socket that dropped, so its seat can be handed over. */
  clientId: string;
  timer: ReturnType<typeof setTimeout>;
}

/** How long a player has to come back before they lose the game. */
export const GRACE_SECONDS = 30;

interface RoomPlayers {
  mode: MatchMode;
  leftUserId?: number | undefined;
  rightUserId?: number | undefined;
}

@Injectable()
export class GameRoomsService implements OnModuleDestroy {
  private readonly rooms = new Map<string, GameRoom>(); // roomId → room
  private readonly roomOf = new Map<string, string>(); // clientId → roomId
  private readonly players = new Map<string, RoomPlayers>(); // roomId → who plays
  /** Seats kept warm while their player is away: userId → seat. */
  private readonly away = new Map<number, AwaySeat>();
  private notify: Notify = () => {};

  constructor(private readonly matches: MatchesService) {}

  createLocal(
    clientId: string,
    publish: Publish,
    userId?: number,
    settings?: GameSettings,
  ): GameRoom {
    // Both paddles belong to the same person, so the row says "local game"
    // rather than a win over somebody else.
    const room = this.createRoom(
      clientId,
      publish,
      ["left", "right"],
      { mode: "local", leftUserId: userId, rightUserId: userId },
      settings,
    );
    room.start();
    return room;
  }

  /** A game against the AI: the browser plays the left paddle, the AI the right one. */
  createAi(
    clientId: string,
    difficulty: Difficulty,
    publish: Publish,
    userId?: number,
    settings?: GameSettings,
  ): GameRoom {
    const room = this.createRoom(
      clientId,
      publish,
      ["left"],
      { mode: "ai", leftUserId: userId },
      settings,
    );
    const player = new AiPlayer("right", AI_PRESETS[difficulty]);
    // The AI is a controller like any other: its keys go through setInput too.
    room.addBot({
      controllerId: "ai",
      side: "right",
      update: (state, dt) => player.update(state, dt),
    });
    room.start();
    return room;
  }

  createRemote(
    left: { clientId: string; userId?: number | undefined },
    right: { clientId: string; userId?: number | undefined },
    publish: Publish,
  ): GameRoom {
    this.leave(right.clientId);
    const room = this.createRoom(left.clientId, publish, ["left"], {
      mode: "remote",
      leftUserId: left.userId,
      rightUserId: right.userId,
    });
    room.assign(right.clientId, ["right"]);
    this.roomOf.set(right.clientId, room.id);
    room.start();
    return room;
  }

  input(clientId: string, side: Side, input: PaddleInput): void {
    this.roomFor(clientId)?.setInput(clientId, side, input);
  }

  /** Ends the client's game, if it has one: the loop stops, the room is forgotten. */
  leave(clientId: string): void {
    const room = this.roomFor(clientId);
    if (!room) return;
    room.stop();
    this.rooms.delete(room.id);
    this.players.delete(room.id);
    // An online room has two players: when one leaves, the game is over for
    // both, so neither is left pointing at a room that no longer runs.
    for (const [id, roomId] of this.roomOf) {
      if (roomId === room.id) this.roomOf.delete(id);
    }
  }

  /** Server shutdown: stop every loop, or their timers would keep the process alive. */
  onModuleDestroy(): void {
    for (const room of this.rooms.values()) room.stop();
    this.rooms.clear();
    this.roomOf.clear();
    this.players.clear();
  }

  /** Builds an empty room for this client and gives them the paddles in `sides`. */
  private createRoom(
    clientId: string,
    publish: Publish,
    sides: readonly Side[],
    players: RoomPlayers,
    settings?: GameSettings,
  ): GameRoom {
    this.leave(clientId);
    const roomId = randomUUID();
    const room = new GameRoom(
      roomId,
      (state) => {
        publish(roomId, state);
        this.saveIfFinished(roomId, state);
      },
      settings,
    );
    room.assign(clientId, sides);
    this.rooms.set(roomId, room);
    this.roomOf.set(clientId, roomId);
    this.players.set(roomId, players);
    return room;
  }

  private roomFor(clientId: string): GameRoom | undefined {
    const roomId = this.roomOf.get(clientId);
    return roomId === undefined ? undefined : this.rooms.get(roomId);
  }

  
  disconnect(clientId: string): void {
    const room = this.roomFor(clientId);
    const players = room ? this.players.get(room.id) : undefined;
    const side = room?.sidesOf(clientId)[0];
    const userId = seatOwner(players, side);
    if (!room || !side || userId === undefined || players?.mode !== "remote") {
      this.leave(clientId);
      return;
    }
    room.pause();
    this.away.set(userId, {
      roomId: room.id,
      side,
      clientId,
      timer: setTimeout(() => this.forfeit(userId), GRACE_SECONDS * 1000),
    });
    this.notify(room.id, GAME_EVENTS.paused, { away: side, seconds: GRACE_SECONDS });
  }

  rejoin(userId: number, clientId: string): { roomId: string; side: Side } | null {
    const seat = this.away.get(userId);
    const room = seat ? this.rooms.get(seat.roomId) : undefined;
    if (!seat || !room) return null;
    clearTimeout(seat.timer);
    this.away.delete(userId);
    room.reassign(seat.clientId, clientId);
    this.roomOf.delete(seat.clientId);
    this.roomOf.set(clientId, room.id);
    room.resume();
    this.notify(room.id, GAME_EVENTS.resumed, { side: seat.side });
    return { roomId: room.id, side: seat.side };
  }

  /** Nobody came back: the player who stayed at the table wins. */
  private forfeit(userId: number): void {
    const seat = this.away.get(userId);
    const room = seat ? this.rooms.get(seat.roomId) : undefined;
    this.away.delete(userId);
    if (!seat || !room) return;
    const winner: Side = seat.side === "left" ? "right" : "left";
    this.notify(room.id, GAME_EVENTS.forfeited, { winner });
    // A forfeit is a real result: it belongs in the match history like any other.
    this.saveIfFinished(room.id, { ...room.current, winner });
    this.close(room);
  }

  onEvent(notify: Notify): void {
    this.notify = notify;
  }

  private close(room: GameRoom): void {
    room.stop();
    this.rooms.delete(room.id);
    this.players.delete(room.id);
    for (const [id, roomId] of this.roomOf) {
      if (roomId === room.id) this.roomOf.delete(id);
    }
  }

  private saveIfFinished(roomId: string, state: GameState): void {
    const players = this.players.get(roomId);
    if (state.winner === null || !players) return;
    const room = this.rooms.get(roomId);
    if (room) setTimeout(() => this.close(room), 0);
    void this.matches.record({
      roomId,
      mode: players.mode,
      leftUserId: players.leftUserId,
      rightUserId: players.rightUserId,
      leftScore: state.score.left,
      rightScore: state.score.right,
      winner: state.winner,
    });
  }
}

function seatOwner(players: RoomPlayers | undefined, side: Side | undefined): number | undefined {
  if (!players || !side) return undefined;
  return side === "left" ? players.leftUserId : players.rightUserId;
}
