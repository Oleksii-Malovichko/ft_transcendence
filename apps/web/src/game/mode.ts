import { DEFAULT_SETTINGS, type Difficulty, type GameSettings, type JoinRequest } from "@ft/core";

export type UiMode =
  | { kind: "local"; settings: GameSettings }
  | { kind: "ai"; difficulty: Difficulty; settings: GameSettings }
  | { kind: "online" }
  /** A match of a bracket: the server decides who plays whom, and the rules. */
  | { kind: "tournament"; tournamentId: number };

export const LOCAL_MODE: UiMode = { kind: "local", settings: DEFAULT_SETTINGS };

/** The settings a mode plays with; online games always use the classic ones. */
export function settingsOf(mode: UiMode): GameSettings {
  return mode.kind === "local" || mode.kind === "ai" ? mode.settings : DEFAULT_SETTINGS;
}

/** The same mode, played with other settings. */
export function withSettings(mode: UiMode, settings: GameSettings): UiMode {
  return mode.kind === "local" || mode.kind === "ai" ? { ...mode, settings } : mode;
}

/** True while the player is waiting for the server to pair them with somebody. */
export function waitsForOpponent(mode: UiMode): boolean {
  return mode.kind === "online" || mode.kind === "tournament";
}

/** The message that starts a local or AI game; the other modes don't use one. */
export function toJoinRequest(mode: UiMode): JoinRequest | null {
  if (mode.kind === "local") return { mode: "local", settings: mode.settings };
  if (mode.kind === "ai") {
    return { mode: "ai", difficulty: mode.difficulty, settings: mode.settings };
  }
  return null;
}
