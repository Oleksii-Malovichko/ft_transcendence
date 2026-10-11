import type { CreateTournament, ReportResult, TournamentDetail, TournamentSummary } from "@ft/core";
import { apiFetch } from "@/lib/api";

export function createTournament(input: CreateTournament): Promise<TournamentSummary> {
  return apiFetch<TournamentSummary>("/tournaments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchTournament(id: number): Promise<TournamentDetail> {
  return apiFetch<TournamentDetail>(`/tournaments/${id}`);
}

export function joinTournament(id: number, alias: string): Promise<TournamentDetail> {
  return apiFetch<TournamentDetail>(`/tournaments/${id}/players`, {
    method: "POST",
    body: JSON.stringify({ alias }),
  });
}

export function leaveTournament(id: number): Promise<TournamentDetail> {
  return apiFetch<TournamentDetail>(`/tournaments/${id}/players/me`, { method: "DELETE" });
}

export function reportResult(id: number, result: ReportResult): Promise<TournamentDetail> {
  return apiFetch<TournamentDetail>(`/tournaments/${id}/results`, {
    method: "POST",
    body: JSON.stringify(result),
  });
}
