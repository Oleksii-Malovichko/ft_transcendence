import { describe, expect, it } from "vitest";
import { FIELD, TICK_RATE } from "./constants.js";
import {
  BIG_PADDLE_FACTOR,
  effectOf,
  hasEffect,
  paddleHeightFor,
  POWER_UPS,
  spawnPowerUp,
  tickEffects,
  touchedPowerUp,
} from "./power-ups.js";
import { GameSettingsSchema } from "./settings.js";
import { createInitialState, NO_INPUT } from "./state.js";
import { step } from "./step.js";

describe("spawnPowerUp", () => {
  it("alternates the two lanes and stays inside the field", () => {
    const first = spawnPowerUp(0);
    const second = spawnPowerUp(1);
    expect(first.x).not.toBe(second.x);
    expect(POWER_UPS.lanes).toContain(first.x);
    expect(first.y).toBeGreaterThan(0);
    expect(first.y).toBeLessThan(FIELD.height);
  });

  it("is the same every time: the engine stays predictable", () => {
    expect(spawnPowerUp(4)).toEqual(spawnPowerUp(4));
  });
});

describe("touchedPowerUp", () => {
  const powerUp = spawnPowerUp(0);

  it("finds the one the ball is on", () => {
    const ball = { x: powerUp.x, y: powerUp.y, vx: 300, vy: 0 };
    expect(touchedPowerUp(ball, [powerUp])?.id).toBe(powerUp.id);
  });

  it("ignores one the ball flies past", () => {
    const ball = { x: powerUp.x, y: powerUp.y + 100, vx: 300, vy: 0 };
    expect(touchedPowerUp(ball, [powerUp])).toBeUndefined();
  });
});

describe("effects", () => {
  it("run out after their time", () => {
    const effects = [effectOf(spawnPowerUp(0), "left")];
    expect(tickEffects(effects, POWER_UPS.lasts / 2)).toHaveLength(1);
    expect(tickEffects(effects, POWER_UPS.lasts)).toHaveLength(0);
  });

  it("make the collector's paddle taller, and nobody else's", () => {
    const settings = GameSettingsSchema.parse({ powerUps: true });
    const state = { settings, effects: [effectOf(spawnPowerUp(0), "left")] };
    expect(paddleHeightFor(state, "left")).toBeCloseTo(settings.paddleHeight * BIG_PADDLE_FACTOR);
    expect(paddleHeightFor(state, "right")).toBe(settings.paddleHeight);
  });

  it("belong to the ball when they speed it up", () => {
    const fastBall = effectOf({ id: 1, kind: "fastBall", x: 0, y: 0 }, "left");
    expect(fastBall.side).toBeNull();
    expect(hasEffect([fastBall], "fastBall")).toBe(true);
  });
});

describe("a game with bonuses switched off", () => {
  it("never puts one on the field", () => {
    let state = createInitialState("left", GameSettingsSchema.parse({ scoreLimit: 21 }));
    for (let tick = 0; tick < 30 * TICK_RATE; tick++) {
      state = step(state, NO_INPUT, 1 / TICK_RATE);
    }
    expect(state.powerUps).toHaveLength(0);
    expect(state.effects).toHaveLength(0);
  });
});
