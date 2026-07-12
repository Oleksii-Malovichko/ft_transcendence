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
    room.advance(STEP / 2); 
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

  it("stops its loop once the game is over", () => {
    const room = new GameRoom("room");
    room.start();
    expect(room.running).toBe(true);
    room.advance(60); // idle players: the game ends well within a minute
    expect(room.current.winner).not.toBeNull();
    expect(room.running).toBe(false);
  });
});