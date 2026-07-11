import { randomUUID } from "node:crypto";
import type { PaddleInput, Side } from "@ft/core";
import { Injectable, type OnModuleDestroy } from "@nestjs/common";
import { GameRoom } from "./game-room.js";

@Injectable()
export class GameRoomsService implements OnModuleDestroy {
  private readonly rooms = new Map<string, GameRoom>(); // roomId → room
  private readonly roomOf = new Map<string, string>(); // clientId → roomId

  createLocal(clientId: string): GameRoom {
    this.leave(clientId);
    const room = new GameRoom(randomUUID());
    this.rooms.set(room.id, room);
    this.roomOf.set(clientId, room.id);
    room.start();
    return room;
  }

  input(clientId: string, side: Side, input: PaddleInput): void {
    this.roomFor(clientId)?.setInput(side, input);
  }

  leave(clientId: string): void {
    const room = this.roomFor(clientId);
    if (!room) return;
    room.stop();
    this.rooms.delete(room.id);
    this.roomOf.delete(clientId);
  }

  onModuleDestroy(): void {
    for (const room of this.rooms.values()) room.stop();
    this.rooms.clear();
    this.roomOf.clear();
  }

  private roomFor(clientId: string): GameRoom | undefined {
    const roomId = this.roomOf.get(clientId);
    return roomId === undefined ? undefined : this.rooms.get(roomId);
  }
}