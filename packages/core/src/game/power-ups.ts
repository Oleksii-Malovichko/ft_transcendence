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

/** A collected "bigger paddle" makes that player's paddle this much taller. */
export const BIG_PADDLE_FACTOR = 1.6;

/** The effects after `dt` seconds, with the finished ones dropped. */
export function tickEffects(effects: readonly Effect[], dt: number): Effect[] {
  return effects
    .map((effect) => ({ ...effect, secondsLeft: effect.secondsLeft - dt }))
    .filter((effect) => effect.secondsLeft > 0);
}

/** The effect a collected bonus starts, for the player who collected it. */
export function effectOf(powerUp: PowerUp, collector: Side | null): Effect {
  return {
    kind: powerUp.kind,
    // "fastBall" changes the ball itself, so it belongs to nobody.
    side: powerUp.kind === "bigPaddle" ? collector : null,
    secondsLeft: POWER_UPS.lasts,
  };
}

export function hasEffect(
  effects: readonly Effect[],
  kind: PowerUpKind,
  side: Side | null = null,
): boolean {
  return effects.some(
    (effect) => effect.kind === kind && (kind !== "bigPaddle" || effect.side === side),
  );
}

/** One side's paddle height, bonuses included: what the game (and the browser) must use. */
export function paddleHeightFor(
  state: { settings: { paddleHeight: number }; effects: readonly Effect[] },
  side: Side,
): number {
  const base = state.settings.paddleHeight;
  return hasEffect(state.effects, "bigPaddle", side) ? base * BIG_PADDLE_FACTOR : base;
}
