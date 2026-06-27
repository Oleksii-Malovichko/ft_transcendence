import { FIELD, PADDLE } from "../game/constants.js";

/** Keeps a target where a paddle's center can actually go. */
export function clampPaddleTarget(y: number): number {
  const half = PADDLE.height / 2;
  return Math.min(Math.max(y, half), FIELD.height - half);
}

/**
 * `targetY` moved by a random error between -aimError and +aimError, then kept
 * reachable. `random` works like Math.random (0 ≤ r < 1); tests pass their own.
 */
export function withAimError(
  targetY: number,
  aimError: number,
  random: () => number = Math.random,
): number {
  const error = (random() + random() - 1) * aimError; // -1…+1, most often near 0
  return clampPaddleTarget(targetY + error);
}
