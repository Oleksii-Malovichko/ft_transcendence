import { BALL, FIELD } from "./constants.js";
import type { Ball, Side } from "./state.js";

export type PowerUpKind = "bigPaddle" | "fastBall";

export interface PowerUp {
  readonly id: number;
  readonly kind: PowerUpKind;
  readonly x: number;
  readonly y: number;
}

/** A bonus that is running; `side` is the player it helps, if it helps one. */
export interface Effect {
  readonly kind: PowerUpKind;
  readonly side: Side | null;
  readonly secondsLeft: number;
}

export const POWER_UPS = {
  /** Side of the square drawn on the field. */
  size: 22,
  /** Seconds between two appearances. */
  every: 7,
  /** How long a collected bonus lasts. */
  lasts: 8,
  /** The lanes bonuses appear in: a quarter and three quarters of the field. */
  lanes: [FIELD.width / 4, (FIELD.width * 3) / 4],
} as const;

const KINDS: PowerUpKind[] = ["bigPaddle", "fastBall"];
const HEIGHTS = [0.25, 0.5, 0.75];

/**
 * The bonus number `counter`: lanes alternate, heights cycle, kinds cycle.
 * Three cycles of different lengths, so the pattern does not repeat quickly.
 */
export function spawnPowerUp(counter: number): PowerUp {
  return {
    id: counter,
    kind: KINDS[counter % KINDS.length]!,
    x: POWER_UPS.lanes[counter % POWER_UPS.lanes.length]!,
    y: FIELD.height * HEIGHTS[counter % HEIGHTS.length]!,
  };
}

/** The bonus the ball is touching, if any. */
export function touchedPowerUp(ball: Ball, powerUps: readonly PowerUp[]): PowerUp | undefined {
  const reach = (BALL.size + POWER_UPS.size) / 2;
  return powerUps.find(
    (powerUp) => Math.abs(ball.x - powerUp.x) <= reach && Math.abs(ball.y - powerUp.y) <= reach,
  );
}
