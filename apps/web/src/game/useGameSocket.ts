import {
  createInitialState,
  GAME_EVENTS,
  GAME_INVITE_EVENTS,
  type GameChatMessage,
  type GameForfeited,
  type GamePaused,
  type GameState,
  type InputMessage,
  MATCH_EVENTS,
  TOURNAMENT_EVENTS,
  type MatchFound,
  type Side,
} from "@ft/core";
import { type MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { LOCAL_MODE, type UiMode, toJoinRequest } from "./mode";
import { connectSocket } from "./socket";

export interface Hud {
  score: Readonly<Record<Side, number>>;
  winner: Side | null;
}

/** Why the game is not running right now. */
export type Interruption =
  | { kind: "none" }
  | { kind: "away"; side: Side; seconds: number }
  | { kind: "forfeited"; winner: Side };

export const PLAYING: Interruption = { kind: "none" };

export interface OnlineState {
  status: "idle" | "searching" | "playing";
  /** The paddle you control online; null in the other modes. */
  side: Side | null;
  opponent: string | null;
}

export interface IncomingGameInvite {
  inviteId: string;
  inviter: string;
}

const START = createInitialState();
const START_HUD: Hud = { score: START.score, winner: null };
const IDLE: OnlineState = { status: "idle", side: null, opponent: null };

function sameHud(hud: Hud, state: GameState): boolean {
  return (
    hud.winner === state.winner &&
    hud.score.left === state.score.left &&
    hud.score.right === state.score.right
  );
}

/** Asks the server to start whatever the player chose. */
function start(socket: Socket, mode: UiMode): void {
  if (mode.kind === "tournament") {
    socket.emit(TOURNAMENT_EVENTS.play, { tournamentId: mode.tournamentId });
    return;
  }
  const request = toJoinRequest(mode);
  if (request) socket.emit(GAME_EVENTS.join, request);
  else socket.emit(MATCH_EVENTS.find);
}

interface Wiring {
  stateRef: MutableRefObject<GameState>;
  previousRef: MutableRefObject<GameState>;
  arrivedAt: MutableRefObject<number>;
  modeRef: MutableRefObject<UiMode>;
  /** True while an online game is ours to come back to. */
  playingRef: MutableRefObject<boolean>;
  setHud: (update: (previous: Hud) => Hud) => void;
  setOnline: (state: OnlineState) => void;
  setInterruption: (interruption: Interruption) => void;
  setChatMessages: (update: (current: GameChatMessage[]) => GameChatMessage[]) => void;
  setChatError: (message: string | null) => void;
  setIncomingInvite: (invite: IncomingGameInvite | null) => void;
  setInviteError: (message: string | null) => void;
  reset: () => void;
}

/** Wires every message the server can send to the state it changes. */
function listen(socket: Socket, wiring: Wiring): void {
  const { stateRef, previousRef, arrivedAt, modeRef, playingRef } = wiring;
  socket.on("connect", () => {
    socket.emit(GAME_EVENTS.ready, (reply: { rejoined: MatchFound | null }) => {
      if (reply.rejoined) {
        playingRef.current = true;
        wiring.reset();
        wiring.setOnline({
          status: "playing",
          side: reply.rejoined.side,
          opponent: reply.rejoined.opponent,
        });
      } else if (!playingRef.current) {
        start(socket, modeRef.current);
      }
    });
  });
  socket.on(GAME_EVENTS.state, (state: GameState) => {
    // Keep the one before it: the canvas draws between the two.
    previousRef.current = stateRef.current;
    arrivedAt.current = performance.now();
    stateRef.current = state;
    wiring.setHud((previous) =>
      sameHud(previous, state) ? previous : { score: state.score, winner: state.winner },
    );
  });
  socket.on(GAME_EVENTS.paused, (paused: GamePaused) =>
    wiring.setInterruption({ kind: "away", side: paused.away, seconds: paused.seconds }),
  );
  socket.on(GAME_EVENTS.resumed, () => wiring.setInterruption(PLAYING));
  socket.on(GAME_EVENTS.forfeited, (over: GameForfeited) => {
    playingRef.current = false;
    wiring.setInterruption({ kind: "forfeited", winner: over.winner });
    wiring.setHud((previous) => ({ ...previous, winner: over.winner }));
  });
  socket.on(MATCH_EVENTS.waiting, () => wiring.setOnline({ ...IDLE, status: "searching" }));
  socket.on(MATCH_EVENTS.found, (found: MatchFound) => {
    playingRef.current = true;
    wiring.reset();
    wiring.setOnline({ status: "playing", side: found.side, opponent: found.opponent });
  });
  socket.on(GAME_EVENTS.chatMessage, (message: GameChatMessage) => {
    wiring.setChatMessages((current) => [...current.slice(-99), message]);
  });
  socket.on(GAME_EVENTS.chatError, (error: { message?: string }) =>
    wiring.setChatError(error.message ?? "Could not send in-game message"),
  );
  socket.on(GAME_INVITE_EVENTS.incoming, (invite: IncomingGameInvite) =>
    wiring.setIncomingInvite(invite),
  );
  socket.on(GAME_INVITE_EVENTS.error, (error: { inviteId?: string; message?: string }) => {
    wiring.setIncomingInvite((current) =>
      current?.inviteId === error.inviteId ? null : current,
    );
    wiring.setInviteError(error.message ?? "Game invitation failed");
  });
}

/** Opens the connection and keeps it listening for as long as the page lives. */
function useGameConnection(wiring: Wiring) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;
    listen(socket, wiring);
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [wiring]);

  return socketRef;
}

/** Everything the player can ask for: change mode, cancel, play again, press a key. */
function useGameActions(
  socketRef: MutableRefObject<Socket | null>,
  modeRef: MutableRefObject<UiMode>,
  playingRef: MutableRefObject<boolean>,
  setMode: (mode: UiMode) => void,
  setOnline: (state: OnlineState) => void,
  reset: () => void,
) {
  const goTo = useCallback(
    (next: UiMode) => {
      const socket = socketRef.current;
      if (modeRef.current.kind === "online" && next.kind !== "online") {
        socket?.emit(MATCH_EVENTS.cancel);
      }
      playingRef.current = false;
      setMode(next);
      setOnline(next.kind === "online" ? { ...IDLE, status: "searching" } : IDLE);
      reset();
      if (socket) start(socket, next);
    },
    [socketRef, modeRef, playingRef, setMode, setOnline, reset],
  );

  const sendInput = useCallback(
    (message: InputMessage) => {
      socketRef.current?.emit(GAME_EVENTS.input, message);
    },
    [socketRef],
  );

  /** Play again: a new game, or a new opponent online. */
  const restart = useCallback(() => {
    reset();
    if (modeRef.current.kind === "online") setOnline({ ...IDLE, status: "searching" });
    if (socketRef.current) start(socketRef.current, modeRef.current);
  }, [socketRef, modeRef, setOnline, reset]);

  return { choose: goTo, cancelSearch: () => goTo(LOCAL_MODE), sendInput, restart };
}

export function useGameSocket(initialMode: UiMode) {
  const stateRef = useRef<GameState>(START);
  const previousRef = useRef<GameState>(START);
  const arrivedAt = useRef(0);
  const [mode, setMode] = useState(initialMode);
  const modeRef = useRef(mode);
  const playingRef = useRef(false);
  const [hud, setHud] = useState<Hud>(START_HUD);
  const [online, setOnline] = useState<OnlineState>(IDLE);
  const [interruption, setInterruption] = useState<Interruption>(PLAYING);
  const [chatMessages, setChatMessages] = useState<GameChatMessage[]>([]);
  const [chatError, setChatError] = useState<string | null>(null);
  const [incomingInvite, setIncomingInvite] = useState<IncomingGameInvite | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const reset = useCallback(() => {
    stateRef.current = START;
    setHud(START_HUD);
    setChatMessages([]);
    setChatError(null);
    setIncomingInvite(null);
    setInviteError(null);
  }, []);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Stable as long as its pieces are (refs and setState never change), so the
  // connection is opened once and not on every render.
  const wiring = useMemo(
    () => ({
      stateRef,
      previousRef,
      arrivedAt,
      modeRef,
      playingRef,
      setHud,
      setOnline,
      setInterruption,
      setChatMessages,
      setChatError,
      setIncomingInvite,
      setInviteError,
      reset,
    }),
    [reset],
  );
  const socketRef = useGameConnection(wiring);
  const actions = useGameActions(socketRef, modeRef, playingRef, setMode, setOnline, reset);
  const sendChat = useCallback((body: string) => {
    setChatError(null);
    socketRef.current?.emit(GAME_EVENTS.chatSend, { body });
  }, []);
  const respondToInvite = useCallback(
    (inviteId: string, accept: boolean) => {
      socketRef.current?.emit(
        accept ? GAME_INVITE_EVENTS.accept : GAME_INVITE_EVENTS.decline,
        { inviteId },
      );
      setIncomingInvite(null);
      setInviteError(null);
    },
    [],
  );

  return {
    mode,
    stateRef,
    previousRef,
    arrivedAt,
    hud,
    online,
    interruption,
    chatMessages,
    chatError,
    sendChat,
    incomingInvite,
    inviteError,
    respondToInvite,
    socketRef,
    ...actions,
  };
}
