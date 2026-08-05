import {
  createInitialState,
  DEFAULT_SETTINGS,
  type GameSettings,
  type GameState,
  type Inputs,
  NO_INPUT,
  type PaddleInput,
  type Side,
  step,
  TICK_RATE,
} from "@ft/core";

export interface Bot {
  readonly controllerId: string;
  readonly side: Side;
  update(state: GameState, dt: number): PaddleInput;
}

const STEP = 1 / TICK_RATE;
const MAX_CATCH_UP_SECONDS = 0.25;

export class GameRoom {
  private state: GameState;
  private inputs: Inputs = NO_INPUT;
  private pending = 0; // real time (seconds) not simulated yet
  private lastTurn = 0;
  private timer: ReturnType<typeof setInterval> | undefined;
  private paused = false;
  private readonly controllers = new Map<string, readonly Side[]>();
  private readonly bots: Bot[] = [];

  constructor(
    readonly id: string,
    private readonly onTick: (state: GameState) => void = () => {},
    settings: GameSettings = DEFAULT_SETTINGS,
  ) {
    this.state = createInitialState("left", settings);
  }

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

  
  pause(): void {
    if (!this.running) return;
    this.stop();
    this.paused = true;
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.pending = 0; // the time spent waiting is not part of the game
    this.start();
  }

  get isPaused(): boolean {
    return this.paused;
  }

  sidesOf(controllerId: string): readonly Side[] {
    return this.controllers.get(controllerId) ?? [];
  }

  reassign(oldControllerId: string, newControllerId: string): readonly Side[] {
    const sides = this.controllers.get(oldControllerId) ?? [];
    this.controllers.delete(oldControllerId);
    if (sides.length > 0) this.controllers.set(newControllerId, sides);
    return sides;
  }

  assign(controllerId: string, sides: readonly Side[]): void {
    this.controllers.set(controllerId, sides);
  }

  
  addBot(bot: Bot): void {
    this.assign(bot.controllerId, [bot.side]);
    this.bots.push(bot);
  }

  setInput(controllerId: string, side: Side, input: PaddleInput): boolean {
    if (!this.controllers.get(controllerId)?.includes(side)) return false;
    this.inputs = { ...this.inputs, [side]: input };
    return true;
  }

  advance(seconds: number): void {
    this.pending += seconds;
    const steps = Math.floor(this.pending / STEP + 1e-9);
    this.pending -= steps * STEP;
    for (let i = 0; i < steps; i++) {
      for (const bot of this.bots) {
        this.setInput(bot.controllerId, bot.side, bot.update(this.state, STEP));
      }
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
