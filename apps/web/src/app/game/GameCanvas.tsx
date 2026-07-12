import { FIELD, type GameState } from "@ft/core";
import { type RefObject, useEffect, useRef } from "react";
import { drawGame } from "./render";

export function GameCanvas({ stateRef }: { stateRef: RefObject<GameState> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    let frame = requestAnimationFrame(function draw() {
      drawGame(ctx, stateRef.current);
      frame = requestAnimationFrame(draw);
    });
    return () => cancelAnimationFrame(frame);
  }, [stateRef]);

  return (
    <canvas
      ref={canvasRef}
      width={FIELD.width}
      height={FIELD.height}
      className="h-auto w-full max-w-3xl rounded-lg border border-slate-700"
      role="img"
      aria-label="Pong field"
    />
  );
}