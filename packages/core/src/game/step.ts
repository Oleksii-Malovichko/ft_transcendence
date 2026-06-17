import { bounceOffWalls, moveBall } from "./ball.js";
import { collideWithPaddles } from "./collision.js";
import { movePaddle } from "./paddle.js";
import { awardPoint, scoringSide } from "./scoring.js";
import type { GameState, Inputs } from "./state.js";

export function step(state: GameState, inputs: Inputs, dt: number): GameState {
  if (state.winner !== null) return state;

  const paddles = {
    left: movePaddle(state.paddles.left, inputs.left, dt),
    right: movePaddle(state.paddles.right, inputs.right, dt),
  };
  if (state.serveIn > 0) {
    return { ...state, paddles, serveIn: Math.max(0, state.serveIn - dt) };
  }

  const ball = collideWithPaddles(bounceOffWalls(moveBall(state.ball, dt)), paddles);
  const scorer = scoringSide(ball);
  const moved: GameState = { ...state, paddles, ball };
  return scorer === null ? moved : awardPoint(moved, scorer);
}