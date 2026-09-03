"use client";

import type { TournamentDetail } from "@ft/core";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { fetchTournament } from "./api";
import { BracketView } from "./BracketView";
import { MatchPrompt } from "./MatchPrompt";
import { SeatPanel } from "./SeatPanel";

const REFRESH_MS = 4000;

export function TournamentView({ initial }: { initial: TournamentDetail }) {
  const [tournament, setTournament] = useState(initial);

  const refresh = useCallback(async () => {
    try {
      setTournament(await fetchTournament(initial.id));
    } catch {
      // A hiccup while polling is not worth shouting about: try again later.
    }
  }, [initial.id]);

  useEffect(() => {
    const timer = setInterval(() => void refresh(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold">{tournament.name}</h1>
        <p className="text-sm text-muted">
          {tournament.registered}/{tournament.size} players · {tournament.status}
          {tournament.champion ? ` · winner: ${tournament.champion}` : ""}
        </p>
      </header>
      <MatchPrompt tournament={tournament} onChanged={setTournament} />
      <Card title="Your seat">
        <SeatPanel tournament={tournament} onChanged={setTournament} />
      </Card>
      <Card title="Bracket">
        <BracketView bracket={tournament.bracket} />
      </Card>
    </div>
  );
}
