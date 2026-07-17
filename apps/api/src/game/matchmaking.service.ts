import { Injectable } from "@nestjs/common";

export interface WaitingPlayer {
  clientId: string;
  userId?: number | undefined;
  label: string;
}

@Injectable()
export class MatchmakingService {
  private readonly queue: WaitingPlayer[] = [];

  join(player: WaitingPlayer): [WaitingPlayer, WaitingPlayer] | null {
    this.leave(player.clientId);
    const first = this.queue.shift();
    if (!first) {
      this.queue.push(player);
      return null;
    }
    return [first, player];
  }

  leave(clientId: string): void {
    const index = this.queue.findIndex((player) => player.clientId === clientId);
    if (index >= 0) this.queue.splice(index, 1);
  }

  get size(): number {
    return this.queue.length;
  }
}