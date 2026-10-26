import { Injectable } from "@nestjs/common";

export interface WaitingPlayer {
  clientId: string;
  userId?: number | undefined;
  label: string;
}

@Injectable()
export class MatchmakingService {
  private readonly queue: WaitingPlayer[] = [];
  private joinTail: Promise<void> = Promise.resolve();
  private readonly departed = new Set<string>();
  private readonly joining = new Map<string, number>();

  async join(
    player: WaitingPlayer,
    areBlocked: (firstUserId: number, secondUserId: number) => Promise<boolean>,
  ): Promise<[WaitingPlayer, WaitingPlayer] | null> {
    this.departed.delete(player.clientId);
    this.joining.set(player.clientId, (this.joining.get(player.clientId) ?? 0) + 1);
    let release!: () => void;
    const currentJoin = new Promise<void>((resolve) => {
      release = resolve;
    });
    const previousJoin = this.joinTail;
    this.joinTail = currentJoin;
    await previousJoin;
    try {
      const existingIndex = this.queue.findIndex((waiting) => waiting.clientId === player.clientId);
      if (existingIndex >= 0) this.queue.splice(existingIndex, 1);
      this.removePerson(player);
      for (let index = 0; index < this.queue.length; index++) {
        const waiting = this.queue[index]!;
        if (this.departed.has(waiting.clientId)) {
          this.queue.splice(index--, 1);
          continue;
        }
        if (samePerson(waiting, player)) continue;
        if (
          waiting.userId !== undefined &&
          player.userId !== undefined &&
          (await areBlocked(waiting.userId, player.userId))
        ) {
          continue;
        }
        if (this.departed.has(player.clientId)) return null;
        this.queue.splice(index, 1);
        return [waiting, player];
      }
      if (this.departed.has(player.clientId)) return null;
      this.queue.push(player);
      return null;
    } finally {
      release();
      const activeJoins = this.joining.get(player.clientId);
      if (activeJoins === 1) {
        this.joining.delete(player.clientId);
        this.departed.delete(player.clientId);
      } else if (activeJoins !== undefined) {
        this.joining.set(player.clientId, activeJoins - 1);
      }
    }
  }

  leave(clientId: string): void {
    if (this.joining.has(clientId)) this.departed.add(clientId);
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
