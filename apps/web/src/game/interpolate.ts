import type { GameState } from "@ft/core";

const mix = (from: number, to: number, t: number): number => from + (to - from) * t;

export function blend(older: GameState, newer: GameState, t: number): GameState {
  if (older.score.left !== newer.score.left || older.score.right !== newer.score.right) {
    return newer;
  }
  const clamped = Math.min(Math.max(t, 0), 1);
  return {
    ...newer,
    ball: {
      ...newer.ball,
      x: mix(older.ball.x, newer.ball.x, clamped),
      y: mix(older.ball.y, newer.ball.y, clamped),
    },
    paddles: {
      left: mix(older.paddles.left, newer.paddles.left, clamped),
      right: mix(older.paddles.right, newer.paddles.right, clamped),
    },
  };
}
