"use client";

import { DisplayNameSchema, type TournamentDetail } from "@ft/core";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { joinTournament, leaveTournament } from "./api";

type Changed = (tournament: TournamentDetail) => void;

/** Runs one seat action and reports whatever the API says about it. */
function useSeatAction(onChanged: Changed) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const run = async (action: () => Promise<TournamentDetail>) => {
    setBusy(true);
    try {
      onChanged(await action());
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Could not reach the server", "error");
    } finally {
      setBusy(false);
    }
  };
  return { busy, run };
}

export function SeatPanel({
  tournament,
  onChanged,
}: {
  tournament: TournamentDetail;
  onChanged: Changed;
}) {
  if (tournament.youAre) {
    return <SeatTaken tournament={tournament} onChanged={onChanged} />;
  }
  if (tournament.status !== "open") {
    return <p className="text-sm text-muted">Registration is closed.</p>;
  }
  return <JoinForm tournament={tournament} onChanged={onChanged} />;
}

function SeatTaken({
  tournament,
  onChanged,
}: {
  tournament: TournamentDetail;
  onChanged: Changed;
}) {
  const { busy, run } = useSeatAction(onChanged);
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <p>
        You are playing as <span className="text-accent">{tournament.youAre}</span>.
      </p>
      {tournament.status === "open" && (
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => run(() => leaveTournament(tournament.id))}
        >
          Give up my seat
        </Button>
      )}
    </div>
  );
}

function JoinForm({ tournament, onChanged }: { tournament: TournamentDetail; onChanged: Changed }) {
  const [alias, setAlias] = useState("");
  const { busy, run } = useSeatAction(onChanged);
  const problem = DisplayNameSchema.safeParse(alias).error?.issues[0]?.message;
  return (
    <div className="flex flex-wrap items-end gap-3">
      <Input
        label="Your alias in this tournament"
        value={alias}
        onChange={(event) => setAlias(event.target.value)}
        error={alias.length > 0 ? problem : undefined}
      />
      <Button
        disabled={busy || Boolean(problem)}
        onClick={() => run(() => joinTournament(tournament.id, alias))}
      >
        Take a seat
      </Button>
    </div>
  );
}
