import { describe, expect, it } from "vitest";
import { MatchmakingService, type WaitingPlayer } from "./matchmaking.service.js";

const ada: WaitingPlayer = { clientId: "socket-1", userId: 1, label: "ada@example.com" };
const bob: WaitingPlayer = { clientId: "socket-2", userId: 2, label: "bob@example.com" };
const adaSecondTab: WaitingPlayer = { clientId: "socket-3", userId: 1, label: "ada@example.com" };
const guest: WaitingPlayer = { clientId: "socket-4", label: "Guest" };
const otherGuest: WaitingPlayer = { clientId: "socket-5", label: "Guest" };

describe("MatchmakingService", () => {
  it("makes the first player wait, then pairs the second with them", () => {
    const queue = new MatchmakingService();
    expect(queue.join(ada)).toBeNull();
    expect(queue.size).toBe(1);
    expect(queue.join(bob)).toEqual([ada, bob]);
    expect(queue.size).toBe(0);
  });

  it("gives the left paddle to whoever waited, the right one to the newcomer", () => {
    const queue = new MatchmakingService();
    queue.join(ada);
    const pair = queue.join(bob);
    expect(pair?.[0].label).toBe(ada.label);
    expect(pair?.[1].label).toBe(bob.label);
    expect(queue.size).toBe(0);
  });

  it("forgets a player who cancels or disconnects", () => {
    const queue = new MatchmakingService();
    queue.join(ada);
    queue.leave(ada.clientId);
    expect(queue.size).toBe(0);
    expect(queue.join(bob)).toBeNull();
  });

  it("never pairs someone with their own second tab", () => {
    const queue = new MatchmakingService();
    queue.join(ada);
    expect(queue.join(adaSecondTab)).toBeNull();
    expect(queue.size).toBe(1);
    expect(queue.join(bob)).toEqual([adaSecondTab, bob]);
  });

  it("still pairs two guests with each other", () => {
    const queue = new MatchmakingService();
    queue.join(guest);
    expect(queue.join(otherGuest)).toEqual([guest, otherGuest]);
  });
});