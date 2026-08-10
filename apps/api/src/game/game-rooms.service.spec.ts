import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MatchesService } from "../matches/matches.service.js";
import { GameRoomsService, GRACE_SECONDS } from "./game-rooms.service.js";

function setup() {
  const recorded: unknown[] = [];
  const matches = {
    record: (result: unknown) => {
      recorded.push(result);
      return Promise.resolve();
    },
  } as unknown as MatchesService;
  const service = new GameRoomsService(matches);
  const events: { event: string; payload: unknown }[] = [];
  service.onEvent((_roomId, event, payload) => events.push({ event, payload }));
  const room = service.createRemote(
    { clientId: "ada", userId: 1 },
    { clientId: "bob", userId: 2 },
    () => {},
  );
  room.stop();
  return { service, room, events, recorded };
}

describe("a player who drops out of an online game", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("keeps their seat, and both players are told", () => {
    const { service, events } = setup();
    service.disconnect("ada");
    expect(events.at(-1)).toEqual({
      event: "game:paused",
      payload: { away: "left", seconds: GRACE_SECONDS },
    });
  });

  it("gets the same paddle back on a new connection", () => {
    const { service, room, events } = setup();
    service.disconnect("ada");
    expect(service.rejoin(1, "ada-again")).toEqual({ roomId: room.id, side: "left" });
    expect(events.at(-1)?.event).toBe("game:resumed");
    // The new socket moves the paddle; the old one no longer can.
    expect(room.setInput("ada-again", "left", 1)).toBe(true);
    expect(room.setInput("ada", "left", 1)).toBe(false);
  });

  it("loses the game if nobody comes back in time", () => {
    const { service, events, recorded } = setup();
    service.disconnect("ada");
    vi.advanceTimersByTime(GRACE_SECONDS * 1000);
    expect(events.at(-1)).toEqual({ event: "game:forfeited", payload: { winner: "right" } });
    expect(recorded).toHaveLength(1); // a forfeit is a result like any other
  });

  it("is not waited for in a local game: that one simply ends", () => {
    const { service, events } = setup();
    const room = service.createLocal("solo", () => {});
    room.stop();
    service.disconnect("solo");
    expect(events.some((entry) => entry.event === "game:paused")).toBe(false);
    expect(service.rejoin(1, "solo-again")).toBeNull();
  });
});
