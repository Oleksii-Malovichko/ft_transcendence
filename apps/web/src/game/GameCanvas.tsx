import { FIELD, type GameState, TICK_RATE, type Theme, THEMES } from "@ft/core";
import { blend } from "./interpolate";
import { type RefObject, useEffect, useRef } from "react";
import { drawGame } from "./render";

type CanvasRef = RefObject<HTMLCanvasElement | null>;

export interface CanvasFeed {
  stateRef: RefObject<GameState>;
  /** The snapshot before the newest one, and when the newest arrived. */
  previousRef?: RefObject<GameState>;
  arrivedAt?: RefObject<number>;
}

export function GameCanvas({
  stateRef,
  previousRef,
  arrivedAt,
  theme = THEMES.classic,
}: CanvasFeed & { theme?: Theme }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useSharpResolution(canvasRef);
  useDrawLoop(canvasRef, { stateRef, previousRef, arrivedAt }, theme);
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

/** Keeps the pixel buffer at on-screen size × devicePixelRatio. */
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

/** Redraws the latest state on every animation frame, scaled from FIELD units. */
/** How far between the two snapshots we are right now, from 0 to 1. */
function progress(feed: CanvasFeed): number {
  if (!feed.arrivedAt?.current) return 1;
  return (performance.now() - feed.arrivedAt.current) / (1000 / TICK_RATE);
}

function useDrawLoop(canvasRef: CanvasRef, feed: CanvasFeed, theme: Theme): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let frame = requestAnimationFrame(function draw() {
      const scale = canvas.width / FIELD.width; // screen pixels per field unit
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      const newer = feed.stateRef.current;
      const older = feed.previousRef?.current ?? newer;
      drawGame(ctx, blend(older, newer, progress(feed)), theme);
      frame = requestAnimationFrame(draw);
    });
    return () => cancelAnimationFrame(frame);
  }, [canvasRef, feed, theme]);
}
