import { describe, expect, it } from "vitest";
import { GameSettingsSchema } from "../game/settings.js";
import { adaptConfig } from "./adapt.js";
import { AI_PRESETS } from "./presets.js";

const normal = AI_PRESETS.normal;

describe("adaptConfig", () => {
  it("changes nothing for a classic game", () => {
    expect(adaptConfig(normal, GameSettingsSchema.parse({}))).toEqual(normal);
  });

  it("aims more precisely when the paddles are smaller", () => {
    const small = adaptConfig(normal, GameSettingsSchema.parse({ paddleHeight: 40 }));
    expect(small.aimError).toBeLessThan(normal.aimError);
  });

  it("looks more often when the ball is faster", () => {
    const fast = adaptConfig(normal, GameSettingsSchema.parse({ ballSpeed: 660 }));
    expect(fast.visionInterval).toBeLessThan(normal.visionInterval);
  });
});
