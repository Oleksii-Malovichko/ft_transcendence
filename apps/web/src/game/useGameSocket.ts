import {
  createInitialState,
  GAME_EVENTS,
  type GameState,
  type InputMessage,
  type JoinRequest,
} from "@ft/core";
import { useCallback, useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import { connectSocket } from "./socket";

const JOIN: JoinRequest = { mode: "local" };

export function useGameSocket() {
  const stateRef = useRef<GameState>(createInitialState());
  const socketRef = useRef<Socket | null>(null);

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

  return { stateRef, sendInput };
}