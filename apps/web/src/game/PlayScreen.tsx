"use client";
import { createInitialState, type GameState } from "@ft/core";
import { useRef } from "react";
import { GameCanvas } from "./GameCanvas";

export function PlayScreen() {
  const stateRef = useRef<GameState>(createInitialState());
  return <GameCanvas stateRef={stateRef} />;
}
