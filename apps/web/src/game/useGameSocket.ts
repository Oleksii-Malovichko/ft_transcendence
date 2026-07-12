import {
  createInitialState,
  GAME_EVENTS,
  type GameState,
  type InputMessage,
  type JoinRequest,
  type Side,
} from "@ft/core";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { connectSocket } from "./socket";

export interface Hud {
  score: Readonly<Record<Side, number>>;
  winner: Side | null;
}

const JOIN: JoinRequest = { mode: "local" };

const START = createInitialState();
const START_HUD: Hud = { score: START.score, winner: null };

function sameHud(hud: Hud, state: GameState): boolean {
  return (
    hud.winner === state.winner &&
    hud.score.left === state.score.left &&
    hud.score.right === state.score.right
  );
}

export function useGameSocket() {
  const stateRef = useRef<GameState>(createInitialState());
  const stateRef = useRef<GameState>(START);
  const socketRef = useRef<Socket | null>(null);
  const [hud, setHud] = useState<Hud>(START_HUD);

  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;
    socket.on("connect", () => socket.emit(GAME_EVENTS.join, JOIN));
    socket.on(GAME_EVENTS.state, (state: GameState) => {
      stateRef.current = state;
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const sendInput = useCallback((message: InputMessage) => {
    socketRef.current?.emit(GAME_EVENTS.input, message);
  }, []);

  const restart = useCallback(() => {
    stateRef.current = START;
    setHud(START_HUD);
    socketRef.current?.emit(GAME_EVENTS.join, JOIN);
  }, []);

  return { stateRef, hud, sendInput, restart };
 }