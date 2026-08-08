import type { Side } from "@ft/core";
import { useEffect, useState } from "react";

export function AwayOverlay({
  side,
  seconds,
  you,
}: {
  side: Side;
  seconds: number;
  you: Side | null;
}) {
  const left = useCountdown(seconds);
  const itIsYou = you === side;
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface/80">
      <p className="text-lg">
        {itIsYou ? "You lost your connection" : "Your opponent lost their connection"}
      </p>
      <p className="text-sm text-muted">
        {itIsYou
          ? `Your seat is kept for ${left} more seconds.`
          : `Waiting ${left} more seconds, then the game is yours.`}
      </p>
    </div>
  );
}


function useCountdown(seconds: number): number {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    const deadline = Date.now() + seconds * 1000;
    const tick = () => setLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [seconds]);
  return left;
}
