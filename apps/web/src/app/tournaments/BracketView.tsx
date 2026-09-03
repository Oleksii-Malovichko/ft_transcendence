import type { BracketMatch } from "@ft/core";

const ROUND_NAMES = ["First round", "Semi-final", "Final"];

function roundName(round: number, rounds: number): string {
  if (round === rounds - 1) return "Final";
  if (round === rounds - 2) return "Semi-final";
  return ROUND_NAMES[round] ?? `Round ${round + 1}`;
}

export function BracketView({ bracket }: { bracket: readonly BracketMatch[] }) {
  const rounds = Math.max(...bracket.map((match) => match.round)) + 1;
  return (
    <div className="flex gap-6 overflow-x-auto">
      {Array.from({ length: rounds }, (_, round) => (
        <div key={round} className="flex min-w-40 flex-col gap-3">
          <h3 className="text-sm text-muted">{roundName(round, rounds)}</h3>
          {bracket
            .filter((match) => match.round === round)
            .map((match) => (
              <div key={match.slot} className="rounded-md border border-edge p-2 text-sm">
                {match.players.map((player, seat) => (
                  <p
                    key={seat}
                    className={player && player === match.winner ? "text-accent" : "text-ink"}
                  >
                    {player ?? "—"}
                  </p>
                ))}
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
