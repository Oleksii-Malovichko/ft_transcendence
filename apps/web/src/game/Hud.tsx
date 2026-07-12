import type { Side } from "@ft/core";

export function Scoreboard({ score }: { score: Readonly<Record<Side, number>> }) {
  return (
    <p className="text-4xl font-bold tabular-nums" aria-live="polite">
      {score.left} <span className="text-slate-500">–</span> {score.right}
    </p>
  );
}

const NAMES: Record<Side, string> = { left: "Left player", right: "Right player" };

export function GameOver({ winner, onRestart }: { winner: Side; onRestart: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-lg bg-slate-950/80 text-slate-100">
      <p className="text-3xl font-semibold">{NAMES[winner]} wins!</p>
      <button
        type="button"
        onClick={onRestart}
        className="rounded-md bg-amber-400 px-4 py-2 font-medium text-slate-950 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
      >
        Play again
      </button>
    </div>
  );
}