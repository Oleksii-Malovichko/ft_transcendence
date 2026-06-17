
import { FIELD, RULES } from "./constants.js";
import { serveBall, type Ball, type GameState, type Side } from "./state.js";

export function scoringSide(ball: Ball): Side | null {
  if (ball.x < 0) return "right";
  if (ball.x > FIELD.width) return "left";
  return null;
}

export function awardPoint(state: GameState, scorer: Side): GameState {
  const loser: Side = scorer === "left" ? "right" : "left";
  const score = { ...state.score, [scorer]: state.score[scorer] + 1 };
  return {
    ...state,
    score,
    ball: serveBall(loser, (score.left + score.right) % 2 === 0),
    serveIn: RULES.serveDelay,
  };
}