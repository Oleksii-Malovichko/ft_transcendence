import { z } from "zod";
import { BALL, PADDLE, RULES } from "./constants.js";

export const GameSettingsSchema = z.object({
  /** Speed of every serve, in field units per second. */
  ballSpeed: z.number().min(180).max(720).default(BALL.serveSpeed),
  /** Paddle height in field units; shorter means harder. */
  paddleHeight: z.number().min(40).max(160).default(PADDLE.height),
  /** Points needed to win. */
  scoreLimit: z.number().int().min(1).max(21).default(RULES.scoreLimit),
  /** Whether bonuses appear during the game (they arrive in a later commit). */
  powerUps: z.boolean().default(false),
});

export type GameSettings = z.infer<typeof GameSettingsSchema>;

/** The classic game: what every player gets unless they change something. */
export const DEFAULT_SETTINGS: GameSettings = GameSettingsSchema.parse({});
