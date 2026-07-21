import { bounceOffWalls, moveBall } from "./ball.js";
import { collideWithPaddles } from "./collision.js";
import { movePaddle } from "./paddle.js";
import { POWER_UPS, spawnPowerUp, touchedPowerUp } from "./power-ups.js";
import { awardPoint, scoringSide } from "./scoring.js";
import type { GameState, Inputs } from "./state.js";

export function step(state: GameState, inputs: Inputs, dt: number): GameState {
  if (state.winner !== null) return state;

  const { paddleHeight } = state.settings;
  const paddles = {
    left: movePaddle(state.paddles.left, inputs.left, dt, paddleHeight),
    right: movePaddle(state.paddles.right, inputs.right, dt, paddleHeight),
  };
  if (state.serveIn > 0) {
    return { ...state, paddles, serveIn: Math.max(0, state.serveIn - dt) };
  }

  const flying = bounceOffWalls(moveBall(state.ball, dt));
  const ball = collideWithPaddles(flying, paddles, paddleHeight);
  // The ball bounced off a paddle: remember whose, for the bonuses below.
  const lastHitBy = ball === flying ? state.lastHitBy : flying.vx < 0 ? "left" : "right";
  const moved: GameState = { ...withPowerUps(state, ball, dt), paddles, ball, lastHitBy };
  const scorer = scoringSide(ball);
  return scorer === null ? moved : awardPoint(moved, scorer);
}

function withPowerUps(state: GameState, ball: GameState["ball"], dt: number): GameState {
  if (!state.settings.powerUps) return state;
  const due = state.nextPowerUpIn - dt;
  const onField =
    due <= 0 ? [...state.powerUps, spawnPowerUp(state.powerUps.length)] : state.powerUps;
  const taken = touchedPowerUp(ball, onField);
  return {
    ...state,
    powerUps: taken ? onField.filter((powerUp) => powerUp.id !== taken.id) : onField,
    nextPowerUpIn: due <= 0 ? POWER_UPS.every : due,
  };
}
