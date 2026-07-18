import type { GameState } from "@ft/core";
import { type RefObject, useEffect, useState } from "react";

const LOOK_EVERY_MS = 100;

export function ServeCountdown({ stateRef }: { stateRef: RefObject<GameState> }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const state = stateRef.current;
      const left = state.winner === null ? Math.ceil(state.serveIn) : 0;
      setSeconds((previous) => (previous === left ? previous : left));
    }, LOOK_EVERY_MS);
    return () => clearInterval(timer);
  }, [stateRef]);

  if (seconds <= 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
      <p className="text-6xl font-bold tabular-nums">{seconds}</p>
      <p className="text-sm text-muted">get ready</p>
    </div>
  );
}