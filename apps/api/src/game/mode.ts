import type { Difficulty, JoinRequest } from "@ft/core";

export type UiMode =
  { kind: "local" } | { kind: "ai"; difficulty: Difficulty } | { kind: "online" };

export const LOCAL_MODE: UiMode = { kind: "local" };

export function toJoinRequest(mode: UiMode): JoinRequest | null {
  if (mode.kind === "local") return { mode: "local" };
  if (mode.kind === "ai") return { mode: "ai", difficulty: mode.difficulty };
  return null;
}