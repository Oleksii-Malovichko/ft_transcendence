import { BALL, FIELD, PADDLE } from "../game/constants.js";
import { movePaddle, paddleX } from "../game/paddle.js";
import type { GameState, PaddleInput, Side } from "../game/state.js";
import { withAimError } from "./aim.js";
import type { AiConfig } from "./config.js";
import { decide } from "./decide.js";
import { predictBallY } from "./predict.js";

const CENTER = FIELD.height / 2;

export class AiPlayer {
  private clock = 0; //            seconds of game time, as the AI counts them
  private nextLook = 0; //         when it may look at the game again
  private target = CENTER; //      where it is heading right now
  private plan: { at: number; y: number } | null = null; // seen, not acted on yet
  private paddle = CENTER; //      where it believes its own paddle is
  private readonly faceX: number; // the line where the ball meets its paddle

  constructor(
    readonly side: Side,
    private readonly config: AiConfig,
    private readonly random: () => number = Math.random,
  ) {
    const away = side === "left" ? 1 : -1;
    this.faceX = paddleX(side) + away * (PADDLE.width / 2 + BALL.size / 2);
  }

  /** The key it holds during this tick: -1 up, 0 nothing, 1 down. */
  update(state: GameState, dt: number): PaddleInput {
    this.clock += dt;
    if (this.clock >= this.nextLook) this.look(state);
    if (this.plan && this.clock >= this.plan.at) {
      this.target = this.plan.y;
      this.plan = null;
    }
    const input = decide(this.paddle, this.target, this.config);
    // Between looks it can't see its paddle, so it follows its own keys.
    this.paddle = movePaddle(this.paddle, input, dt);
    return input;
  }

  /** One look at the game: where is the ball going, and how wrong is the aim? */
  private look(state: GameState): void {
    this.nextLook = this.clock + this.config.visionInterval;
    this.paddle = state.paddles[this.side]; // it sees its own paddle too
    this.plan = { at: this.clock + this.config.reactionDelay, y: this.aimAt(state) };
  }

  private aimAt(state: GameState): number {
    const coming = this.side === "left" ? state.ball.vx < 0 : state.ball.vx > 0;
    const predicted = coming ? predictBallY(state.ball, this.faceX) : null;
    // Ball going the other way: walk back to the middle, like a player would.
    return predicted === null ? CENTER : withAimError(predicted, this.config.aimError, this.random);
  }
}
