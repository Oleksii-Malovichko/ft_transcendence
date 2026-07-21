import { FIELD, RULES } from "./constants.js";
import { serveBall, type Ball, type GameState, type Side } from "./state.js";

export function scoringSide(ball: Ball): Side | null {
  if (ball.x < 0) return "right";
  if (ball.x > FIELD.width) return "left";
  return null;
}

export function findWinner(
  score: Readonly<Record<Side, number>>,
  scoreLimit: number = RULES.scoreLimit,
): Side | null {
  if (score.left >= scoreLimit) return "left";
  if (score.right >= scoreLimit) return "right";
  return null;
}

export function awardPoint(state: GameState, scorer: Side): GameState {
  const loser: Side = scorer === "left" ? "right" : "left";
  const score = { ...state.score, [scorer]: state.score[scorer] + 1 };
  return {
    ...state,
    score,
    ball: serveBall(loser, (score.left + score.right) % 2 === 0, state.settings.ballSpeed),
    serveIn: RULES.serveDelay,
    powerUps: [],
    effects: [],
    lastHitBy: null,
    winner: findWinner(score, state.settings.scoreLimit),
  };
}
