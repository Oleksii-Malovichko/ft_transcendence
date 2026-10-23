import { BALL, FIELD } from "./game/constants.js";
import type { Ball } from "./game/state.js";

// The ball's CENTER moves between TOP and TOP + SPAN: it bounces when its
// edge touches a wall.
const TOP = BALL.size / 2;
const SPAN = FIELD.height - BALL.size;

/** Folds a y of the straight, wall-less path back into the field (mirror bounces). */
export function reflectIntoField(y: number): number {
  const period = 2 * SPAN; // down and back up: the pattern repeats after this
  const offset = (((y - TOP) % period) + period) % period;
  return TOP + (offset <= SPAN ? offset : period - offset);
}

export function predictBallY(ball: Ball, targetX: number): number | null {
  const time = (targetX - ball.x) / ball.vx;
  if (!Number.isFinite(time) || time < 0) {
    return null;
  }
  return reflectIntoField(ball.y + ball.vy * time);
}
