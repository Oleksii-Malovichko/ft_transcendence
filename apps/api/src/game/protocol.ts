import { z } from "zod";

export const GAME_EVENTS = {
  /** browser → server: start a game. The answer (ack) is a JoinReply. */
  join: "game:join",
  /** browser → server: a paddle's key state changed. */
  input: "game:input",
  /** browser → server: leave the current game. */
  leave: "game:leave",
  /** server → the browsers in a room: the latest GameState. */
  state: "game:state",
} as const;

export const JoinRequestSchema = z.object({ mode: z.literal("local") });

export const InputMessageSchema = z.object({
  side: z.enum(["left", "right"]),
  input: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
});

export type JoinRequest = z.infer<typeof JoinRequestSchema>;
export type InputMessage = z.infer<typeof InputMessageSchema>;
export type JoinReply = { roomId: string } | { error: string };