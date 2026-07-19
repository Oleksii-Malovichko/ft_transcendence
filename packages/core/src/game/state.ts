import { BALL, FIELD, RULES } from "./constants.js";
import { DEFAULT_SETTINGS, type GameSettings } from "./settings.js";

export type Side = "left" | "right";

export type PaddleInput = -1 | 0 | 1;

export type Inputs = Readonly<Record<Side, PaddleInput>>;

export interface Ball {
  /** Center of the ball. */
  readonly x: number;
  readonly y: number;
  /** Velocity, in units per second. */
  readonly vx: number;
  readonly vy: number;
}

export interface GameState {
  readonly settings: GameSettings;
  readonly ball: Ball;

  readonly paddles: Readonly<Record<Side, number>>;
  readonly score: Readonly<Record<Side, number>>;

  readonly serveIn: number;
  /** null while the game is running. */
  readonly winner: Side | null;
}

export const NO_INPUT: Inputs = { left: 0, right: 0 };

export function serveBall(
  towards: Side,
  goingDown: boolean,
  speed: number = BALL.serveSpeed,
): Ball {
  const horizontal = towards === "left" ? -1 : 1;
  const vertical = goingDown ? 1 : -1;
  return {
    x: FIELD.width / 2,
    y: FIELD.height / 2,
    vx: horizontal * speed * Math.cos(BALL.serveAngle),
    vy: vertical * speed * Math.sin(BALL.serveAngle),
  };
}

export function createInitialState(
  firstServe: Side = "left",
  settings: GameSettings = DEFAULT_SETTINGS,
): GameState {
  return {
    settings,
    ball: serveBall(firstServe, true, settings.ballSpeed),
    paddles: { left: FIELD.height / 2, right: FIELD.height / 2 },
    score: { left: 0, right: 0 },
    serveIn: RULES.serveDelay,
    winner: null,
  };
}
