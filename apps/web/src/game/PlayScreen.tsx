"use client";

import { type GameState, type Side, THEMES, type ThemeName } from "@ft/core";
import { type RefObject, useState } from "react";
import type { Socket } from "socket.io-client";
import { AwayOverlay } from "./AwayOverlay";
import { EffectsBar } from "./EffectsBar";
import { GameCanvas } from "./GameCanvas";
import { GameOver, Scoreboard } from "./Hud";
import { LOCAL_BINDINGS, ONLINE_RIGHT_BINDINGS, SOLO_BINDINGS } from "./keys";
import { Lobby } from "./Lobby";
import { LOCAL_MODE, settingsOf, type UiMode, waitsForOpponent, withSettings } from "./mode";
import { ModePicker } from "./ModePicker";
import { PingIndicator } from "./PingIndicator";
import { RulesPanel } from "./RulesPanel";
import { ServeCountdown } from "./ServeCountdown";
import { SettingsForm } from "./SettingsForm";
import { ThemePicker } from "./ThemePicker";
import { TouchControls } from "./TouchControls";
import { type Hud, type Interruption, useGameSocket } from "./useGameSocket";
import { useKeyboardInput } from "./useKeyboardInput";

function bindingsFor(mode: UiMode, side: Side | null) {
  if (mode.kind === "ai") return SOLO_BINDINGS;
  if (mode.kind === "online") return side === "right" ? ONLINE_RIGHT_BINDINGS : SOLO_BINDINGS;
  return LOCAL_BINDINGS;
}

export function PlayScreen({ tournamentId }: { tournamentId?: number }) {
  // Arriving from a bracket with ?tournament=… means one particular match,
  // chosen by the server; anything else starts as a local game.
  const game = useGameSocket(tournamentId ? { kind: "tournament", tournamentId } : LOCAL_MODE);
  const { mode, online, hud } = game;
  const [theme, setTheme] = useState<ThemeName>("classic");
  useKeyboardInput(bindingsFor(mode, online.side), game.sendInput);
  const searching = waitsForOpponent(mode) && online.status !== "playing";

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-4">
      <ModePicker mode={mode} onChange={game.choose} />
      {/* Online games always use the classic rules: two players would have to
          agree on anything else, which is a conversation we don't have yet. */}
      {(mode.kind === "local" || mode.kind === "ai") && (
        <SettingsForm
          settings={settingsOf(mode)}
          onChange={(settings) => game.choose(withSettings(mode, settings))}
        />
      )}
      {searching ? (
        <Lobby
          onCancel={game.cancelSearch}
          message={
            mode.kind === "tournament" ? "Waiting for your opponent to be ready…" : undefined
          }
        />
      ) : (
        <>
          {online.opponent && (
            <p className="text-sm text-muted">
              Playing against {online.opponent} — you have the {online.side} paddle
            </p>
          )}
          <GameArea
            stateRef={game.stateRef}
            previousRef={game.previousRef}
            arrivedAt={game.arrivedAt}
            theme={theme}
            hud={hud}
            interruption={game.interruption}
            you={online.side}
            onRestart={game.restart}
          />
          {/* On a phone the keyboard is not an option: your paddle gets buttons. */}
          <TouchControls side={online.side ?? "left"} onInput={game.sendInput} />
          <Toolbar mode={mode} socket={game.socketRef.current} theme={theme} onTheme={setTheme} />
          <RulesPanel />
        </>
      )}
    </div>
  );
}

/** Everything inside the field: the score, the picture, and what sits on top. */
function GameArea({
  stateRef,
  previousRef,
  arrivedAt,
  theme,
  hud,
  interruption,
  you,
  onRestart,
}: {
  stateRef: RefObject<GameState>;
  previousRef: RefObject<GameState>;
  arrivedAt: RefObject<number>;
  theme: ThemeName;
  hud: Hud;
  interruption: Interruption;
  you: Side | null;
  onRestart: () => void;
}) {
  return (
    <>
      <Scoreboard score={hud.score} />
      <EffectsBar stateRef={stateRef} />
      <div className="relative w-full">
        <GameCanvas
          stateRef={stateRef}
          previousRef={previousRef}
          arrivedAt={arrivedAt}
          theme={THEMES[theme]}
        />
        <ServeCountdown stateRef={stateRef} />
        {interruption.kind === "away" && (
          <AwayOverlay side={interruption.side} seconds={interruption.seconds} you={you} />
        )}
        {hud.winner && <GameOver winner={hud.winner} onRestart={onRestart} />}
      </div>
    </>
  );
}

/** Which keys move which paddle, shown under the field. */
function Controls({ mode }: { mode: UiMode }) {
  if (mode.kind === "local") {
    return (
      <p className="text-sm text-muted">
        Left player <Key>W</Key> <Key>S</Key> · Right player <Key>↑</Key> <Key>↓</Key>
      </p>
    );
  }
  const other =
    mode.kind === "ai" ? "the AI plays the other paddle" : "your opponent plays the other paddle";
  return (
    <p className="text-sm text-muted">
      You <Key>W</Key> <Key>S</Key> or <Key>↑</Key> <Key>↓</Key> · {other}
    </p>
  );
}

function Key({ children }: { children: string }) {
  return (
    <kbd className="rounded border border-edge px-1.5 py-0.5 font-mono text-xs">{children}</kbd>
  );
}

/** The row under the field: what the keys do, how far the server is, colours. */
function Toolbar({
  mode,
  socket,
  theme,
  onTheme,
}: {
  mode: UiMode;
  socket: Socket | null;
  theme: ThemeName;
  onTheme: (theme: ThemeName) => void;
}) {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3">
      <Controls mode={mode} />
      <div className="flex items-center gap-3">
        {mode.kind === "online" && <PingIndicator socket={socket} />}
        <ThemePicker theme={theme} onChange={onTheme} />
      </div>
    </div>
  );
}
