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
    this.removePerson(player);
    const index = this.queue.findIndex((waiting) => !samePerson(waiting, player));
    const [first] = index < 0 ? [] : this.queue.splice(index, 1);
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

  private removePerson(player: WaitingPlayer): void {
    for (let i = this.queue.length - 1; i >= 0; i--) {
      if (samePerson(this.queue[i]!, player)) this.queue.splice(i, 1);
    }
  }

  get size(): number {
    return this.queue.length;
  }
}

function samePerson(a: WaitingPlayer, b: WaitingPlayer): boolean {
  return a.userId !== undefined && a.userId === b.userId;
}
