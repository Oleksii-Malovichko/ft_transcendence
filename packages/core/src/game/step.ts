import { bounceOffWalls, moveBall } from "./ball.js";
import { collideWithPaddles } from "./collision.js";
import { movePaddle } from "./paddle.js";
import {
  effectOf,
  FAST_BALL_FACTOR,
  hasEffect,
  paddleHeightFor,
  POWER_UPS,
  spawnPowerUp,
  scaleBall,
  tickEffects,
  touchedPowerUp,
} from "./power-ups.js";
import { awardPoint, scoringSide } from "./scoring.js";
import type { Effect } from "./power-ups.js";
import type { Ball, GameState, Inputs, Side } from "./state.js";

export function step(state: GameState, inputs: Inputs, dt: number): GameState {
  if (state.winner !== null) return state;

  const heights = { left: paddleHeightFor(state, "left"), right: paddleHeightFor(state, "right") };
  const paddles = {
    left: movePaddle(state.paddles.left, inputs.left, dt, heights.left),
    right: movePaddle(state.paddles.right, inputs.right, dt, heights.right),
  };
  if (state.serveIn > 0) {
    return { ...state, paddles, serveIn: Math.max(0, state.serveIn - dt) };
  }

  const flying = bounceOffWalls(moveBall(state.ball, dt));
  const side: Side = flying.vx < 0 ? "left" : "right";
  const ball = collideWithPaddles(flying, paddles, heights[side]);
  // The ball bounced off a paddle: that player collects what it runs into.
  const lastHitBy = ball === flying ? state.lastHitBy : side;

  const withBonuses = applyPowerUps(
    { ...state, effects: tickEffects(state.effects, dt) },
    ball,
    dt,
    lastHitBy,
  );
  const speeded = withSpeedChange(state.effects, withBonuses.effects, ball);
  const moved: GameState = { ...withBonuses, paddles, ball: speeded, lastHitBy };
  const scorer = scoringSide(speeded);
  return scorer === null ? moved : awardPoint(moved, scorer);
}

function applyPowerUps(
  state: GameState,
  ball: Ball,
  dt: number,
  collector: Side | null,
): GameState {
  if (!state.settings.powerUps) return state;
  const due = state.nextPowerUpIn - dt;
  const onField =
    due <= 0 ? [...state.powerUps, spawnPowerUp(state.powerUps.length)] : state.powerUps;
  const taken = touchedPowerUp(ball, onField);
  return {
    ...state,
    powerUps: taken ? onField.filter((powerUp) => powerUp.id !== taken.id) : onField,
    effects: taken ? [...state.effects, effectOf(taken, collector)] : state.effects,
    nextPowerUpIn: due <= 0 ? POWER_UPS.every : due,
  };
}

/** Scales the ball when a "faster ball" starts or ends during this tick. */
function withSpeedChange(before: readonly Effect[], after: readonly Effect[], ball: Ball): Ball {
  const was = hasEffect(before, "fastBall");
  const now = hasEffect(after, "fastBall");
  if (was === now) return ball;
  return scaleBall(ball, now ? FAST_BALL_FACTOR : 1 / FAST_BALL_FACTOR);
}
