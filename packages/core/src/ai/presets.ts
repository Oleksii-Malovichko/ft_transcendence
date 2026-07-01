import { z } from "zod";
import type { AiConfig } from "./config.js";

export const DifficultySchema = z.enum(["easy", "normal", "hard"]);
export type Difficulty = z.infer<typeof DifficultySchema>;

/** In the order the interface shows them. */
export const DIFFICULTIES: readonly Difficulty[] = ["easy", "normal", "hard"];

export const AI_PRESETS: Readonly<Record<Difficulty, AiConfig>> = {
  easy: { visionInterval: 1, reactionDelay: 0.5, aimError: 80, deadZone: 10 },
  normal: { visionInterval: 1, reactionDelay: 0.25, aimError: 35, deadZone: 6 },
  hard: { visionInterval: 1, reactionDelay: 0.12, aimError: 12, deadZone: 5 },
};
