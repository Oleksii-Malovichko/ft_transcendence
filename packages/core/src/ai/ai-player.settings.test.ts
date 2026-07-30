import { describe, expect, it } from "vitest";
import { FIELD, TICK_RATE } from "../game/constants.js";
import { GameSettingsSchema } from "../game/settings.js";
import { createInitialState, type GameState, type PaddleInput } from "../game/state.js";
import { AiPlayer } from "./ai-player.js";

const DT = 1 / TICK_RATE;
const EXACT = { visionInterval: 0.2, reactionDelay: 0.1, aimError: 0, deadZone: 4 };

/** A ball flying flat towards the right paddle, arriving at `y`. */
function ballTowardsRight(
  settings: GameState["settings"],
  y: number,
  powerUps: GameState["powerUps"] = [],
) {
  return {
    ...createInitialState("right", settings),
    serveIn: 0,
    paddles: { left: 250, right: y },
    ball: { x: FIELD.width / 2, y, vx: 300, vy: 0 },
    powerUps,
  };
}

function keysDuring(player: AiPlayer, state: GameState, seconds: number): PaddleInput[] {
  const keys: PaddleInput[] = [];
  for (let tick = 0; tick < Math.round(seconds * TICK_RATE); tick++) {
    keys.push(player.update(state, DT));
  }
  return keys;
}

describe("AiPlayer with custom settings", () => {
  it("stays still when the ball is already coming to its paddle", () => {
    const settings = GameSettingsSchema.parse({ paddleHeight: 40 });
    const keys = keysDuring(new AiPlayer("right", EXACT), ballTowardsRight(settings, 250), 0.5);
    expect(keys.every((key) => key === 0)).toBe(true);
  });

  it("shifts its paddle to send the ball towards a bonus", () => {
    const settings = GameSettingsSchema.parse({ powerUps: true });
    // A bonus high up in the half its return will cross.
    const bonus = [{ id: 1, kind: "bigPaddle" as const, x: FIELD.width / 4, y: 60 }];
    const keys = keysDuring(
      new AiPlayer("right", EXACT),
      ballTowardsRight(settings, 250, bonus),
      0.5,
    );
    // Sending the ball UP means meeting it with the top of the paddle, so the
    // paddle itself moves DOWN. It arrives in a few hundredths of a second
    // and then stops, so what matters is the direction it took, not the key
    // it happens to hold at the end.
    expect(keys).toContain(1);
    expect(keys).not.toContain(-1);
  });

  it("does not chase a bonus in its own half", () => {
    const settings = GameSettingsSchema.parse({ powerUps: true });
    const behind = [{ id: 2, kind: "fastBall" as const, x: (FIELD.width * 3) / 4, y: 60 }];
    const keys = keysDuring(
      new AiPlayer("right", EXACT),
      ballTowardsRight(settings, 250, behind),
      0.5,
    );
    expect(keys.every((key) => key === 0)).toBe(true);
  });
});
