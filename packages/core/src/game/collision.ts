
import { BALL, PADDLE } from "./constants.js";
import { paddleX } from "./paddle.js";
import type { Ball, Side } from "./state.js";

const REACH_X = BALL.size / 2 + PADDLE.width / 2;
const REACH_Y = BALL.size / 2 + PADDLE.height / 2;

export function touchesPaddle(ball: Ball, side: Side, paddleY: number): boolean {
  return Math.abs(ball.x - paddleX(side)) <= REACH_X && Math.abs(ball.y - paddleY) <= REACH_Y;
}

/** Where the ball met the paddle: -1 = top edge, 0 = middle, 1 = bottom edge. */
export function hitOffset(ball: Ball, paddleY: number): number {
  return Math.min(Math.max((ball.y - paddleY) / REACH_Y, -1), 1);
}

export function bounceOffPaddle(ball: Ball, side: Side, paddleY: number): Ball {
  const angle = hitOffset(ball, paddleY) * BALL.maxBounceAngle;
  const speed = Math.min(Math.hypot(ball.vx, ball.vy) * BALL.speedUp, BALL.maxSpeed);
  const away = side === "left" ? 1 : -1;
  return {
    x: paddleX(side) + away * REACH_X,
    y: ball.y,
    vx: away * speed * Math.cos(angle),
    vy: speed * Math.sin(angle),
  };
}

export function collideWithPaddles(ball: Ball, paddles: Readonly<Record<Side, number>>): Ball {
  const side: Side = ball.vx < 0 ? "left" : "right";
  const paddleY = paddles[side];
  return touchesPaddle(ball, side, paddleY) ? bounceOffPaddle(ball, side, paddleY) : ball;
}