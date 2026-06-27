import type { PaddleInput } from "../game/state.js";
import type { AiConfig } from "./config.js";

export function decide(paddleY: number, targetY: number, config: AiConfig): PaddleInput {
  const distance = targetY - paddleY;
  if (Math.abs(distance) <= config.deadZone) {
    return 0;
  }
  return distance < 0 ? -1 : 1; // y grows downwards: a target above means "up"
}
