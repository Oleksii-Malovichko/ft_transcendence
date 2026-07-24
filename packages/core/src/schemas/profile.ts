import { z } from "zod";
import type { MatchMode } from "../game/protocol.js";

export const DisplayNameSchema = z
  .string()
  .trim()
  .min(3, "Use at least 3 characters")
  .max(20, "Use at most 20 characters")
  .regex(/^[\p{L}\p{N}_-]+$/u, "Letters, digits, - and _ only");

export const ProfileUpdateSchema = z.object({ displayName: DisplayNameSchema });
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;

export interface MatchSummary {
  id: number;
  mode: MatchMode;
  opponent: string;
  yourScore: number;
  theirScore: number;
  won: boolean;
  playedAt: string;
}

export interface PublicProfile {
  id: number;
  displayName: string | null;
  avatarUrl: string;
  played: number;
  won: number;
  matches: MatchSummary[];
}