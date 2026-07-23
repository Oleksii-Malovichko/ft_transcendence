import { describe, expect, it } from "vitest";
import { BALL, PADDLE, RULES, TICK_RATE } from "./constants.js";
import { DEFAULT_SETTINGS, GameSettingsSchema } from "./settings.js";
import { createInitialState, NO_INPUT } from "./state.js";
import { step } from "./step.js";

describe("GameSettingsSchema", () => {
  it("defaults to the classic game", () => {
    expect(DEFAULT_SETTINGS).toEqual({
      ballSpeed: BALL.serveSpeed,
      paddleHeight: PADDLE.height,
      scoreLimit: RULES.scoreLimit,
      powerUps: false,
    });
  });

  it("refuses values that would ruin the game for the other player", () => {
    expect(GameSettingsSchema.safeParse({ paddleHeight: 480 }).success).toBe(false);
    expect(GameSettingsSchema.safeParse({ ballSpeed: 5000 }).success).toBe(false);
    expect(GameSettingsSchema.safeParse({ scoreLimit: 0 }).success).toBe(false);
  });
});

describe("a game plays by its settings", () => {
  it("serves at the chosen speed", () => {
    const fast = createInitialState("left", GameSettingsSchema.parse({ ballSpeed: 600 }));
    expect(Math.hypot(fast.ball.vx, fast.ball.vy)).toBeCloseTo(600);
  });

  it("ends at the chosen score limit", () => {
    let state = createInitialState("left", GameSettingsSchema.parse({ scoreLimit: 2 }));
    for (let tick = 0; tick < 60 * TICK_RATE && state.winner === null; tick++) {
      state = step(state, NO_INPUT, 1 / TICK_RATE);
    }
    expect(state.winner).toBe("right");
    expect(state.score.right).toBe(2);
  });

  it("keeps a shorter paddle inside the field", () => {
    const short = GameSettingsSchema.parse({ paddleHeight: 40 });
    let state = createInitialState("left", short);
    for (let tick = 0; tick < TICK_RATE; tick++) {
      state = step(state, { left: -1, right: 1 }, 1 / TICK_RATE);
    }
    expect(state.paddles.left).toBeGreaterThanOrEqual(20);
    expect(state.paddles.right).toBeLessThanOrEqual(480);
  });
});
