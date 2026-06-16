
import { BALL, FIELD } from "./constants.js";
import type { Ball } from "./state.js";

const HALF = BALL.size / 2;

export function moveBall(ball: Ball, dt: number): Ball {
  return { ...ball, x: ball.x + ball.vx * dt, y: ball.y + ball.vy * dt };
}


export function bounceOffWalls(ball: Ball): Ball {
  if (ball.y - HALF <= 0) {
    return { ...ball, y: HALF, vy: Math.abs(ball.vy) };
  }
  if (ball.y + HALF >= FIELD.height) {
    return { ...ball, y: FIELD.height - HALF, vy: -Math.abs(ball.vy) };
  }
  return ball;
}