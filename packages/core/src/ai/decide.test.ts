import { describe, expect, it } from "vitest";
import { PADDLE, TICK_RATE } from "../game/constants.js";
import { decide } from "./decide.js";
import { AI_PRESETS } from "./presets.js";

const CONFIG = AI_PRESETS.normal;

describe("decide", () => {
  it("presses up when the target is above the paddle", () => {
    expect(decide(300, 200, CONFIG)).toBe(-1);
  });

  it("presses down when the target is below the paddle", () => {
    expect(decide(200, 300, CONFIG)).toBe(1);
  });

  it("presses nothing inside the dead zone", () => {
    expect(decide(250, 250 + CONFIG.deadZone, CONFIG)).toBe(0);
    expect(decide(250, 250 - CONFIG.deadZone, CONFIG)).toBe(0);
  });

  it("presses again just outside the dead zone", () => {
    expect(decide(250, 250 + CONFIG.deadZone + 0.1, CONFIG)).toBe(1);
    expect(decide(250, 250 - CONFIG.deadZone - 0.1, CONFIG)).toBe(-1);
  });

  it("keeps every level's dead zone wide enough to stop the paddle shaking", () => {
    // Half a tick of paddle movement: below that, the paddle always overshoots.
    const halfStep = PADDLE.speed / TICK_RATE / 2;
    for (const config of Object.values(AI_PRESETS)) {
      expect(config.deadZone).toBeGreaterThanOrEqual(halfStep);
    }
  });
});
