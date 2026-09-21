import { Injectable } from "@nestjs/common";

const RECENT_MS = 2 * 60 * 1000;

@Injectable()
export class PresenceService {
  private readonly connections = new Map<number, number>();
  /** The last time each user made a request, for pages without a socket. */
  private readonly lastSeen = new Map<number, number>();

  arrived(userId: number): void {
    this.connections.set(userId, (this.connections.get(userId) ?? 0) + 1);
  }

  left(userId: number): void {
    const open = (this.connections.get(userId) ?? 0) - 1;
    if (open > 0) this.connections.set(userId, open);
    else this.connections.delete(userId);
  }

  /**
   * Someone made a request. The game socket only exists on the play page, so
   * without this a player reading their profile would look offline to their
   * friends. A request is a weaker signal than an open socket, so it only
   * counts for a couple of minutes.
   */
  seen(userId: number): void {
    this.lastSeen.set(userId, Date.now());
  }

  isOnline(userId: number): boolean {
    if (this.connections.has(userId)) return true;
    const at = this.lastSeen.get(userId);
    return at !== undefined && Date.now() - at < RECENT_MS;
  }

  /** How many people are online; used by the tests and for a quick look. */
  get count(): number {
    return this.connections.size;
  }
}
