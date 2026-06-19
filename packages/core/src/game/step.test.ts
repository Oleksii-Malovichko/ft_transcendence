import { describe, expect, it } from "vitest";
import { FIELD, RULES, TICK_RATE } from "./constants.js";
import { createInitialState, NO_INPUT, type GameState, type Inputs } from "./state.js";
import { step } from "./step.js";

const DT = 1 / TICK_RATE;

function play(state: GameState, seconds: number, inputs: Inputs = NO_INPUT): GameState {
  let current = state;
  for (let tick = 0; tick < seconds * TICK_RATE; tick++) {
    current = step(current, inputs, DT);
  }
  return current;
}

function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

describe("step", () => {
  it("never modifies the state it receives", () => {
    const frozen = deepFreeze(createInitialState());
    expect(() => play(frozen, 3)).not.toThrow();
  });

  it("is deterministic: same start and inputs, same result", () => {
    const inputs: Inputs = { left: 1, right: -1 };
    expect(play(createInitialState(), 5, inputs)).toEqual(play(createInitialState(), 5, inputs));
  });

  it("keeps the ball at the center before the serve, while paddles can move", () => {
    const start = createInitialState();
    const waiting = play(start, RULES.serveDelay / 2, { left: -1, right: 0 });
    expect(waiting.ball).toEqual(start.ball);
    expect(waiting.paddles.left).toBeLessThan(FIELD.height / 2);
  });

  it("gives the point to the other player when a ball is not returned", () => {
    expect(play(createInitialState(), 3).score).toEqual({ left: 0, right: 1 });
  });

  it("ends the game, and nothing moves after that", () => {
    const end = play(createInitialState(), 60);
    expect(end.winner).toBe("right");
    expect(end.score.right).toBe(RULES.scoreLimit);
    expect(step(end, { left: 1, right: 1 }, DT)).toBe(end);
  });
});