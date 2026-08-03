import { z } from "zod";
import { DisplayNameSchema } from "../schemas/profile.js";
import type { BracketMatch } from "./bracket.js";

export const TournamentStatusSchema = z.enum(["open", "running", "finished"]);
export type TournamentStatus = z.infer<typeof TournamentStatusSchema>;

export const CreateTournamentSchema = z.object({
  name: z.string().trim().min(3, "Use at least 3 characters").max(40, "Use at most 40 characters"),
  size: z.union([z.literal(4), z.literal(8)]),
});
export type CreateTournament = z.infer<typeof CreateTournamentSchema>;

export const JoinTournamentSchema = z.object({ alias: DisplayNameSchema });
export type JoinTournament = z.infer<typeof JoinTournamentSchema>;

export interface TournamentSummary {
  id: number;
  name: string;
  size: number;
  status: TournamentStatus;
  /** How many seats are taken. */
  registered: number;
}

export interface TournamentDetail extends TournamentSummary {
  players: { alias: string; seat: number }[];
  bracket: BracketMatch[];
  /** The match to play now, or null when there is nothing to play. */
  nextMatch: BracketMatch | null;
  champion: string | null;
}
