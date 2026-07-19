import { FIELD, PADDLE } from "./constants.js";
import type { PaddleInput, Side } from "./state.js";

export function paddleX(side: Side): number {
  const fromWall = PADDLE.offset + PADDLE.width / 2;
  return side === "left" ? fromWall : FIELD.width - fromWall;
}

export function movePaddle(
  y: number,
  input: PaddleInput,
  dt: number,
  paddleHeight: number = PADDLE.height,
): number {
  const half = paddleHeight / 2;
  const moved = y + input * PADDLE.speed * dt;
  return Math.min(Math.max(moved, half), FIELD.height - half);
}
