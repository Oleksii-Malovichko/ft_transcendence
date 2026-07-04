import { z } from "zod";
import type { AiConfig } from "./config.js";

export const DifficultySchema = z.enum(["easy", "normal", "hard"]);
export type Difficulty = z.infer<typeof DifficultySchema>;

/** In the order the interface shows them. */
export const DIFFICULTIES: readonly Difficulty[] = ["easy", "normal", "hard"];

export const AI_PRESETS: Readonly<Record<Difficulty, AiConfig>> = {
  easy: { visionInterval: 1.5, reactionDelay: 0.6, aimError: 110, deadZone: 12 },
  normal: { visionInterval: 0.4, reactionDelay: 0.24, aimError: 35, deadZone: 7 },
  hard: { visionInterval: 0.35, reactionDelay: 0.2, aimError: 28, deadZone: 6 },
};
