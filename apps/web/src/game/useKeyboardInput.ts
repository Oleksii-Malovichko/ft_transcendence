import type { InputMessage, PaddleInput, Side } from "@ft/core";
import { useEffect } from "react";

export interface KeyBinding {
  side: Side;
  up: string;
  down: string;
}

export function useKeyboardInput(
  bindings: readonly KeyBinding[],
  onInput: (message: InputMessage) => void,
): void {
  useEffect(() => {
    const held = new Set<string>();
    const sent = new Map<Side, PaddleInput>();
    const update = () => {
      for (const { side, up, down } of bindings) {
        const input = ((held.has(down) ? 1 : 0) - (held.has(up) ? 1 : 0)) as PaddleInput;
        if (sent.get(side) !== input) {
          sent.set(side, input);
          onInput({ side, input });
        }
      }
    };
    const gameKeys = new Set(bindings.flatMap(({ up, down }) => [up, down]));
    const onKeyDown = (event: KeyboardEvent) => {
      if (!gameKeys.has(event.code)) return;
      event.preventDefault();
      held.add(event.code);
      update();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      held.delete(event.code);
      update();
    };
    const onBlur = () => {
      held.clear();
      update();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [bindings, onInput]);
}