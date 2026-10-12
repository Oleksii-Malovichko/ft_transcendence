import { z } from "zod";
import { GameSettingsSchema } from "./settings.js";
import type { Side } from "./state.js";
import { DifficultySchema } from "../ai/presets.js";

export const GAME_EVENTS = {
  /** browser → server: start a game. The answer (ack) is a JoinReply. */
  join: "game:join",
  /** browser → server: a paddle's key state changed. */
  input: "game:input",
  /** browser → server: leave the current game. */
  leave: "game:leave",
  /** server → the browsers in a room: the latest GameState. */
  state: "game:state",
  /** server → both browsers: a player dropped out; the clock is stopped. */
  paused: "game:paused",
  /** server → both browsers: they are back, play continues. */
  resumed: "game:resumed",
  /** server → both browsers: nobody came back, the game is over. */
  forfeited: "game:forfeited",
  /** browser → server → browser: used only to measure the round trip. */
  ping: "game:ping",
} as const;

export const JoinRequestSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("local"), settings: GameSettingsSchema.optional() }),
  z.object({
    mode: z.literal("ai"),
    difficulty: DifficultySchema,
    settings: GameSettingsSchema.optional(),
  }),
]);

/** One key-state change: which paddle, and up (-1), nothing (0) or down (1). */
export const InputMessageSchema = z.object({
  side: z.enum(["left", "right"]),
  input: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
});

export type JoinRequest = z.infer<typeof JoinRequestSchema>;
export type InputMessage = z.infer<typeof InputMessageSchema>;
export type JoinReply = { roomId: string } | { error: string };

export const MATCH_MODES = ["local", "ai", "remote"] as const;
export type MatchMode = (typeof MATCH_MODES)[number];

export const MATCH_EVENTS = {
  /** browser → server: look for an opponent. */
  find: "match:find",
  /** browser → server: stop looking. */
  cancel: "match:cancel",
  /** server → browser: you are in the queue. */
  waiting: "match:waiting",
  /** server → both browsers: an opponent was found, the game starts. */
  found: "match:found",
} as const;

export interface MatchFound {
  roomId: string;
  side: Side;
  /** How to show the other player (their email, or "Guest"). */
  opponent: string;
}

export interface GamePaused {
  away: Side;
  seconds: number;
}

export interface GameForfeited {
  winner: Side;
}

export const TOURNAMENT_EVENTS = {
  /** browser → server: I am ready to play my tournament match. */
  play: "tournament:play",
  /** server → browser: waiting for the other player to be ready too. */
  waiting: "tournament:waiting",
} as const;

/** Sent with "tournament:play": which tournament the player means. */
export const PlayTournamentMatchSchema = z.object({
  tournamentId: z.number().int().positive(),
});
export type PlayTournamentMatch = z.infer<typeof PlayTournamentMatchSchema>;
