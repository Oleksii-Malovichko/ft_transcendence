import { FIELD, type GameState, type Theme, THEMES } from "@ft/core";
import { type RefObject, useEffect, useRef } from "react";
import { drawGame } from "./render";

type CanvasRef = RefObject<HTMLCanvasElement | null>;

export function GameCanvas({
  stateRef,
  theme = THEMES.classic,
}: {
  stateRef: RefObject<GameState>;
  theme?: Theme;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useSharpResolution(canvasRef);
  useDrawLoop(canvasRef, stateRef, theme);
  return (
    <canvas
      ref={canvasRef}
      className="block w-full rounded-lg border border-slate-700"
      style={{ aspectRatio: `${FIELD.width} / ${FIELD.height}` }}
      role="img"
      aria-label="Pong field"
    />
  );
}

function useSharpResolution(canvasRef: CanvasRef): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(canvas.clientWidth * ratio);
      canvas.height = Math.round(canvas.clientHeight * ratio);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [canvasRef]);
}

function useDrawLoop(canvasRef: CanvasRef, stateRef: RefObject<GameState>, theme: Theme): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let frame = requestAnimationFrame(function draw() {
      const scale = canvas.width / FIELD.width; // screen pixels per field unit
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      drawGame(ctx, stateRef.current, theme);
      frame = requestAnimationFrame(draw);
    });
    return () => cancelAnimationFrame(frame);
  }, [canvasRef, stateRef, theme]);
}
