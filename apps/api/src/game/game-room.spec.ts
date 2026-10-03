import { createInitialState, type GameState, NO_INPUT, step, TICK_RATE } from "@ft/core";
import { describe, expect, it } from "vitest";
import { GameRoom } from "./game-room.js";

const STEP = 1 / TICK_RATE;

describe("GameRoom", () => {
  it("runs exactly TICK_RATE fixed steps per second of game time", () => {
    const room = new GameRoom("room");
    room.assign("player", ["left", "right"]);
    room.setInput("player", "left", -1);
    room.advance(1);
    let expected = createInitialState();
    for (let i = 0; i < TICK_RATE; i++) expected = step(expected, { left: -1, right: 0 }, STEP);
    expect(room.current).toEqual(expected);
  });

  it("keeps leftover time for the next turn instead of losing it", () => {
    const room = new GameRoom("room");
    room.advance(STEP / 2);
    expect(room.current).toEqual(createInitialState());
    room.advance(STEP / 2);
    expect(room.current).toEqual(step(createInitialState(), NO_INPUT, STEP));
  });

  it("publishes the new state after each turn that moved the game", () => {
    const published: GameState[] = [];
    const room = new GameRoom("room", (state) => published.push(state));
    room.advance(STEP / 2); // not a full step yet: nothing to publish
    room.advance(STEP);
    expect(published).toHaveLength(1);
  });

  it("moves a paddle only for the player who controls it", () => {
    const room = new GameRoom("room");
    room.assign("alice", ["left"]);
    expect(room.setInput("bob", "left", -1)).toBe(false); // not Bob's paddle
    expect(room.setInput("alice", "right", 1)).toBe(false); // Alice has only the left one
    expect(room.setInput("alice", "left", -1)).toBe(true);
    room.advance(0.5);
    expect(room.current.paddles.left).toBeLessThan(createInitialState().paddles.left);
    expect(room.current.paddles.right).toBe(createInitialState().paddles.right);
  });

  it("lets a bot play through the same input path as a browser", () => {
    const room = new GameRoom("room");
    let presses = 0;
    room.addBot({
      controllerId: "ai",
      side: "right",
      update: () => {
        presses++;
        return 1; // always holding "down"
      },
    });
    room.advance(0.5);
    expect(presses).toBe(TICK_RATE / 2); // asked once per step
    expect(room.current.paddles.right).toBeGreaterThan(createInitialState().paddles.right);
  });

  it("stops its loop once the game is over", () => {
    const room = new GameRoom("room");
    room.start();
    expect(room.running).toBe(true);
    room.advance(60); // idle players: the game ends well within a minute
    expect(room.current.winner).not.toBeNull();
    expect(room.running).toBe(false);
  });
});

describe("GameRoom pause and resume", () => {
  it("stops the clock without losing the game", () => {
    const room = new GameRoom("r1");
    room.start();
    room.pause();
    expect(room.running).toBe(false);
    expect(room.isPaused).toBe(true);
    expect(room.current.winner).toBeNull();
    room.resume();
    expect(room.running).toBe(true);
    expect(room.isPaused).toBe(false);
    room.stop();
  });

  it("does nothing when there is nothing to pause or resume", () => {
    const room = new GameRoom("r2");
    room.pause();
    expect(room.isPaused).toBe(false);
    room.resume();
    expect(room.running).toBe(false);
  });
});

describe("GameRoom seats", () => {
  it("says which paddles a connection controls", () => {
    const room = new GameRoom("r3");
    room.assign("socket-1", ["left"]);
    expect(room.sidesOf("socket-1")).toEqual(["left"]);
    expect(room.sidesOf("nobody")).toEqual([]);
  });

  it("hands a seat to a new connection, and takes it from the old one", () => {
    const room = new GameRoom("r4");
    room.assign("socket-1", ["left"]);
    expect(room.reassign("socket-1", "socket-2")).toEqual(["left"]);
    expect(room.setInput("socket-2", "left", 1)).toBe(true);
    expect(room.setInput("socket-1", "left", 1)).toBe(false);
  });
});
