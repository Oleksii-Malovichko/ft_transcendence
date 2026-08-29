import type { TournamentDetail, TournamentSummary } from "@ft/core";
import { serverGet } from "@/lib/server-api";

export async function listTournaments(): Promise<TournamentSummary[]> {
  return (await serverGet<TournamentSummary[]>("/tournaments")) ?? [];
}

export function getTournament(id: number): Promise<TournamentDetail | null> {
  return serverGet<TournamentDetail>(`/tournaments/${id}`);
}
