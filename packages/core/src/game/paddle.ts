
import { FIELD, PADDLE } from "./constants.js";
import type { PaddleInput, Side } from "./state.js";

const HALF_HEIGHT = PADDLE.height / 2;

export function paddleX(side: Side): number {
  const fromWall = PADDLE.offset + PADDLE.width / 2;
  return side === "left" ? fromWall : FIELD.width - fromWall;
}

export function movePaddle(y: number, input: PaddleInput, dt: number): number {
  const moved = y + input * PADDLE.speed * dt;
  return Math.min(Math.max(moved, HALF_HEIGHT), FIELD.height - HALF_HEIGHT);
}