import { DEFAULT_SETTINGS, type GameSettings } from "../game/settings.js";
import type { AiConfig } from "./config.js";

export function adaptConfig(config: AiConfig, settings: GameSettings): AiConfig {
  const paddleRatio = settings.paddleHeight / DEFAULT_SETTINGS.paddleHeight;
  const speedRatio = settings.ballSpeed / DEFAULT_SETTINGS.ballSpeed;
  return {
    ...config,
    // A smaller paddle forgives less, a bigger one forgives more.
    aimError: config.aimError * paddleRatio,
    // A faster ball leaves less time between two looks.
    visionInterval: config.visionInterval / speedRatio,
  };
}
