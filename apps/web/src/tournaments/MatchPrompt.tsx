"use client";

import type { TournamentDetail } from "@ft/core";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { reportResult } from "./api";

export function MatchPrompt({
  tournament,
  onChanged,
}: {
  tournament: TournamentDetail;
  onChanged: (tournament: TournamentDetail) => void;
}) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const match = tournament.nextMatch;
  const you = tournament.youAre;
  if (!match || !you || !match.players.includes(you)) return null;
  const opponent = match.players.find((player) => player !== you) ?? "your opponent";

  const report = async (winner: string) => {
    setBusy(true);
    try {
      onChanged(
        await reportResult(tournament.id, { round: match.round, slot: match.slot, winner }),
      );
      toast("Result recorded");
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Could not record the result", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-lg border border-accent p-4"
      aria-live="polite"
    >
      <p>
        Your match is ready: <span className="text-accent">{you}</span> against{" "}
        <span className="text-accent">{opponent}</span>.
      </p>
      <Link href={`/play?tournament=${tournament.id}`}>
        <Button>Play now</Button>
      </Link>
      {/* Played somewhere else, or the game was interrupted? The result can
          still be entered by hand; a game played here reports itself. */}
      <span className="text-sm text-muted">Played it elsewhere?</span>
      <Button variant="secondary" disabled={busy} onClick={() => report(you)}>
        I won
      </Button>
      <Button variant="ghost" disabled={busy} onClick={() => report(opponent)}>
        {opponent} won
      </Button>
    </div>
  );
}
