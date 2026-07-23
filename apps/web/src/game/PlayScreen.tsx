"use client";
import { type Side, THEMES, type ThemeName } from "@ft/core";
import { useState } from "react";
import { EffectsBar } from "./EffectsBar";
import { GameCanvas } from "./GameCanvas";
import { GameOver, Scoreboard } from "./Hud";
import { LOCAL_BINDINGS, ONLINE_RIGHT_BINDINGS, SOLO_BINDINGS } from "./keys";
import { Lobby } from "./Lobby";
import { LOCAL_MODE, settingsOf, type UiMode, withSettings } from "./mode";
import { ModePicker } from "./ModePicker";
import { ThemePicker } from "./ThemePicker";
import { SettingsForm } from "./SettingsForm";
import { RulesPanel } from "./RulesPanel";
import { ServeCountdown } from "./ServeCountdown";
import { TouchControls } from "./TouchControls";
import { useGameSocket } from "./useGameSocket";
import { useKeyboardInput } from "./useKeyboardInput";

function bindingsFor(mode: UiMode, side: Side | null) {
  if (mode.kind === "ai") return SOLO_BINDINGS;
  if (mode.kind === "online") return side === "right" ? ONLINE_RIGHT_BINDINGS : SOLO_BINDINGS;
  return LOCAL_BINDINGS;
}

export function PlayScreen() {
  const { mode, choose, stateRef, hud, online, sendInput, restart, cancelSearch } =
    useGameSocket(LOCAL_MODE);
  const [theme, setTheme] = useState<ThemeName>("classic");
  useKeyboardInput(bindingsFor(mode, online.side), sendInput);
  const searching = mode.kind === "online" && online.status !== "playing";

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-4">
      <ModePicker mode={mode} onChange={choose} />
      {mode.kind !== "online" && (
        <SettingsForm
          settings={settingsOf(mode)}
          onChange={(settings) => choose(withSettings(mode, settings))}
        />
      )}
      {searching ? (
        <Lobby onCancel={cancelSearch} />
      ) : (
        <>
          {online.opponent && (
            <p className="text-sm text-muted">
              Playing against {online.opponent} — you have the {online.side} paddle
            </p>
          )}
          <Scoreboard score={hud.score} />
          <EffectsBar stateRef={stateRef} />
          <div className="relative w-full">
            <GameCanvas stateRef={stateRef} theme={THEMES[theme]} />
            <ServeCountdown stateRef={stateRef} />
            {hud.winner && <GameOver winner={hud.winner} onRestart={restart} />}
          </div>
          <TouchControls side={online.side ?? "left"} onInput={sendInput} />
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <Controls mode={mode} />
            <ThemePicker theme={theme} onChange={setTheme} />
          </div>
          <RulesPanel />
        </>
      )}
    </div>
  );
}

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
