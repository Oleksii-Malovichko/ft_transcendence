import {
  createInitialState,
  type GameState,
  type Inputs,
  NO_INPUT,
  type PaddleInput,
  type Side,
  step,
  TICK_RATE,
} from "@ft/core";

const STEP = 1 / TICK_RATE;
const MAX_CATCH_UP_SECONDS = 0.25;

export class GameRoom {
  private state: GameState = createInitialState();
  private inputs: Inputs = NO_INPUT;
  private pending = 0; // real time (seconds) not simulated yet
  private lastTurn = 0;
  private timer: ReturnType<typeof setInterval> | undefined;
  private readonly controllers = new Map<string, readonly Side[]>();
  constructor(
    readonly id: string,
    private readonly onTick: (state: GameState) => void = () => {},
  ) {}

  get current(): GameState {
    return this.state;
  }

  get running(): boolean {
    return this.timer !== undefined;
  }

  start(): void {
    if (this.running) return;
    this.lastTurn = performance.now();
    this.timer = setInterval(() => this.turn(), 1000 * STEP);
  }

  stop(): void {
    clearInterval(this.timer);
    this.timer = undefined;
  }

  setInput(side: Side, input: PaddleInput): void {
    this.inputs = { ...this.inputs, [side]: input };
  }

  advance(seconds: number): void {
    this.pending += seconds;
    const steps = Math.floor(this.pending / STEP + 1e-9);
    this.pending -= steps * STEP;
    for (let i = 0; i < steps; i++) {
      this.state = step(this.state, this.inputs, STEP);
    }
    if (steps > 0) this.onTick(this.state);
    if (this.state.winner !== null) this.stop();
  }

  private turn(): void {
    const now = performance.now();
    this.advance(Math.min((now - this.lastTurn) / 1000, MAX_CATCH_UP_SECONDS));
    this.lastTurn = now;
  }
}