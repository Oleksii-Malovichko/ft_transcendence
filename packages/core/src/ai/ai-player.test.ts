import { describe, expect, it } from "vitest";
import { TICK_RATE } from "../game/constants.js";
import { createInitialState, type GameState } from "../game/state.js";
import { AiPlayer } from "./ai-player.js";
import type { AiConfig } from "./config.js";

const DT = 1 / TICK_RATE;
// No aiming mistake and no delay: the tests check the behaviour, not the noise.
const CONFIG: AiConfig = { visionInterval: 1, reactionDelay: 0, aimError: 0, deadZone: 6 };

/** The ball flying towards the right paddle, at height `y`. */
function ballComing(y: number): GameState {
  return { ...createInitialState(), ball: { x: 400, y, vx: 300, vy: 0 }, serveIn: 0 };
}

describe("AiPlayer", () => {
  it("moves towards where the ball will arrive", () => {
    // A fresh AI each time: the same one would still be playing its first look.
    expect(new AiPlayer("right", CONFIG).update(ballComing(150), DT)).toBe(-1);
    expect(new AiPlayer("right", CONFIG).update(ballComing(400), DT)).toBe(1);
  });

  it("walks back to the middle when the ball goes the other way", () => {
    const ai = new AiPlayer("right", CONFIG);
    const away: GameState = {
      ...createInitialState(),
      ball: { x: 400, y: 100, vx: -300, vy: 0 },
      paddles: { left: 250, right: 400 },
      serveIn: 0,
    };
    expect(ai.update(away, DT)).toBe(-1); // from 400 back up towards 250
  });

  it("waits its reaction time before acting on what it saw", () => {
    const ai = new AiPlayer("right", { ...CONFIG, reactionDelay: 0.3 });
    const state = ballComing(150);
    expect(ai.update(state, DT)).toBe(0); // seen, but not reacted to yet
    for (let tick = 0; tick < 0.3 * TICK_RATE; tick++) ai.update(state, DT);
    expect(ai.update(state, DT)).toBe(-1); // now it moves
  });

  it("still acts when it looks more often than it reacts", () => {
    // Regression: sightings used to overwrite each other, so with a reaction
    // slower than the look interval the AI froze in place forever.
    const ai = new AiPlayer("right", { ...CONFIG, visionInterval: 0.1, reactionDelay: 0.15 });
    const state = ballComing(150);
    let moved = false;
    for (let tick = 0; tick < TICK_RATE; tick++) moved ||= ai.update(state, DT) === -1;
    expect(moved).toBe(true);
  });

  it("is blind between two looks: it plays what it saw last", () => {
    const ai = new AiPlayer("right", CONFIG);
    ai.update(ballComing(150), DT); // look 1: the ball will arrive high
    const elsewhere = ballComing(450); // the ball is suddenly somewhere else
    for (let tick = 0; tick < 5; tick++) ai.update(elsewhere, DT);
    expect(ai.update(elsewhere, DT)).toBe(-1); // still going up, towards the old target
    for (let tick = 0; tick < TICK_RATE; tick++) ai.update(elsewhere, DT); // a second passes
    expect(ai.update(elsewhere, DT)).toBe(1); // it looked again, and turns around
  });
});
