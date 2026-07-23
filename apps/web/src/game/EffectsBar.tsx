import type { Effect, GameState } from "@ft/core";
import { type RefObject, useEffect, useState } from "react";

const LOOK_EVERY_MS = 200;

function describe(effect: Effect): string {
  const what = effect.kind === "bigPaddle" ? "bigger paddle" : "faster ball";
  const who = effect.side ? `${effect.side}: ` : "";
  return `${who}${what} (${Math.ceil(effect.secondsLeft)}s)`;
}

export function EffectsBar({ stateRef }: { stateRef: RefObject<GameState> }) {
  const [labels, setLabels] = useState<string[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = stateRef.current.effects.map(describe);
      setLabels((previous) => (previous.join("|") === next.join("|") ? previous : next));
    }, LOOK_EVERY_MS);
    return () => clearInterval(timer);
  }, [stateRef]);

  if (labels.length === 0) return null;
  return (
    <p className="text-sm text-accent" aria-live="polite">
      {labels.join(" · ")}
    </p>
  );
}
