import { BALL, FIELD, PADDLE } from "../game/constants.js";
import type { PowerUp } from "../game/power-ups.js";
import { movePaddle, paddleX } from "../game/paddle.js";
import { paddleHeightFor } from "../game/power-ups.js";
import type { GameState, PaddleInput, Side } from "../game/state.js";
import { adaptConfig } from "./adapt.js";
import { withAimError } from "./aim.js";
import type { AiConfig } from "./config.js";
import { decide } from "./decide.js";
import { predictBallY } from "./predict.js";

const CENTER = FIELD.height / 2;
/** How far off-centre the AI hits the ball when it is playing for a bonus. */
const AIM_SHIFT = 14;

export class AiPlayer {
  private clock = 0; //            seconds of game time, as the AI counts them
  private nextLook = 0; //         when it may look at the game again
  private target = CENTER; //      where it is heading right now
  private paddle = CENTER; //      where it believes its own paddle is
  private effective: AiConfig;
  private paddleHeight: number = PADDLE.height;
  private readonly seen: { at: number; y: number }[] = [];
  private readonly faceX: number; // the line where the ball meets its paddle

  constructor(
    readonly side: Side,
    private readonly config: AiConfig,
    private readonly random: () => number = Math.random,
  ) {
    this.effective = config;
    const away = side === "left" ? 1 : -1;
    this.faceX = paddleX(side) + away * (PADDLE.width / 2 + BALL.size / 2);
  }

  /** The key it holds during this tick: -1 up, 0 nothing, 1 down. */
  update(state: GameState, dt: number): PaddleInput {
    this.clock += dt;
    if (this.clock >= this.nextLook) this.look(state);
    this.actOnWhatItSaw();
    const input = decide(this.paddle, this.target, this.effective);
    // Between looks it can't see its paddle, so it follows its own keys.
    this.paddle = movePaddle(this.paddle, input, dt, this.paddleHeight);
    return input;
  }

  /** One look at the game: where is the ball going, and how wrong is the aim? */
  private look(state: GameState): void {
    this.effective = adaptConfig(this.config, state.settings);
    this.paddleHeight = paddleHeightFor(state, this.side);
    this.nextLook = this.clock + this.effective.visionInterval;
    this.paddle = state.paddles[this.side]; // it sees its own paddle too
    this.seen.push({ at: this.clock + this.effective.reactionDelay, y: this.aimAt(state) });
  }

  private actOnWhatItSaw(): void {
    for (
      let sighting = this.seen[0];
      sighting && this.clock >= sighting.at;
      sighting = this.seen[0]
    ) {
      this.target = sighting.y;
      this.seen.shift();
    }
  }

  private aimAt(state: GameState): number {
    const coming = this.side === "left" ? state.ball.vx < 0 : state.ball.vx > 0;
    const predicted = coming ? predictBallY(state.ball, this.faceX) : null;
    // Ball going the other way: walk back to the middle, like a player would.
    if (predicted === null) return CENTER;
    const aimed = withAimError(predicted, this.effective.aimError, this.random);
    return aimed + this.shiftTowardsBonus(state, predicted);
  }
  private shiftTowardsBonus(state: GameState, predicted: number): number {
    const bonus = this.reachableBonus(state);
    if (!bonus) return 0;
    const room = this.paddleHeight / 2 - AIM_SHIFT;
    if (Math.abs(predicted - state.paddles[this.side]) > room) return 0;
    return bonus.y < predicted ? AIM_SHIFT : -AIM_SHIFT;
  }

  /** A bonus in the half its return will fly through. */
  private reachableBonus(state: GameState): PowerUp | undefined {
    const middle = FIELD.width / 2;
    return state.powerUps.find((powerUp) =>
      this.side === "left" ? powerUp.x > middle : powerUp.x < middle,
    );
  }
}
