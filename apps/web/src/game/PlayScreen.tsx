"use client";
import { GameCanvas } from "./GameCanvas";
import { GameOver, Scoreboard } from "./Hud";
import { LOCAL_BINDINGS } from "./keys";
import { useGameSocket } from "./useGameSocket";
import { useKeyboardInput } from "./useKeyboardInput";

export function PlayScreen() {
  const { stateRef, hud, sendInput, restart } = useGameSocket();
  useKeyboardInput(LOCAL_BINDINGS, sendInput);
  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-4">
      <Scoreboard score={hud.score} />
      <div className="relative w-full">
        <GameCanvas stateRef={stateRef} />
        {hud.winner && <GameOver winner={hud.winner} onRestart={restart} />}
      </div>
      <Controls />
    </div>
  );
}

function Controls() {
  return (
    <p className="text-sm text-slate-500">
      Left player <Key>W</Key> <Key>S</Key> · Right player <Key>↑</Key> <Key>↓</Key>
    </p>
  );
}

function Key({ children }: { children: string }) {
  return (
    <kbd className="rounded border border-slate-400 px-1.5 py-0.5 font-mono text-xs">
      {children}
    </kbd>
  );
}
