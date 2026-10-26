import { describe, expect, it } from "vitest";
import { MatchmakingService, type WaitingPlayer } from "./matchmaking.service.js";

const ada: WaitingPlayer = { clientId: "socket-1", userId: 1, label: "ada@example.com" };
const bob: WaitingPlayer = { clientId: "socket-2", userId: 2, label: "bob@example.com" };
const adaSecondTab: WaitingPlayer = { clientId: "socket-3", userId: 1, label: "ada@example.com" };
const guest: WaitingPlayer = { clientId: "socket-4", label: "Guest" };
const otherGuest: WaitingPlayer = { clientId: "socket-5", label: "Guest" };

describe("MatchmakingService", () => {
  it("makes the first player wait, then pairs the second with them", async () => {
    const queue = new MatchmakingService();
    expect(await queue.join(ada, async () => false)).toBeNull();
    expect(queue.size).toBe(1);
    expect(await queue.join(bob, async () => false)).toEqual([ada, bob]);
    expect(queue.size).toBe(0);
  });

  it("gives the left paddle to whoever waited, the right one to the newcomer", async () => {
    const queue = new MatchmakingService();
    await queue.join(ada, async () => false);
    const pair = await queue.join(bob, async () => false);
    expect(pair?.[0].label).toBe(ada.label);
    expect(pair?.[1].label).toBe(bob.label);
    expect(queue.size).toBe(0);
  });

  it("forgets a player who cancels or disconnects", async () => {
    const queue = new MatchmakingService();
    await queue.join(ada, async () => false);
    queue.leave(ada.clientId);
    expect(queue.size).toBe(0);
    expect(await queue.join(bob, async () => false)).toBeNull();
  });

  it("never pairs someone with their own second tab", async () => {
    const queue = new MatchmakingService();
    await queue.join(ada, async () => false);
    expect(await queue.join(adaSecondTab, async () => false)).toBeNull();
    expect(queue.size).toBe(1);
    expect(await queue.join(bob, async () => false)).toEqual([adaSecondTab, bob]);
  });

  it("still pairs two guests with each other", async () => {
    const queue = new MatchmakingService();
    await queue.join(guest, async () => false);
    expect(await queue.join(otherGuest, async () => false)).toEqual([guest, otherGuest]);
  });

  it("does not match two users who have blocked each other", async () => {
    const queue = new MatchmakingService();
    await queue.join(ada, async () => false);
    expect(await queue.join(bob, async () => true)).toBeNull();
    expect(queue.size).toBe(2);
  });
});