import type { InputMessage, PaddleInput, Side } from "@ft/core";
import { useEffect } from "react";

/** KeyboardEvent.code values: physical keys, the same on every layout. */
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
    const sides = [...new Set(bindings.map((binding) => binding.side))];
    const update = () => {
      for (const side of sides) {
        const keys = bindings.filter((binding) => binding.side === side);
        const down = keys.some((binding) => held.has(binding.down));
        const up = keys.some((binding) => held.has(binding.up));
        const input = ((down ? 1 : 0) - (up ? 1 : 0)) as PaddleInput;
        if (sent.get(side) !== input) {
          sent.set(side, input);
          onInput({ side, input });
        }
      }
    };
    const gameKeys = new Set(bindings.flatMap(({ up, down }) => [up, down]));
    const onKeyDown = (event: KeyboardEvent) => {
      if (!gameKeys.has(event.code)) return;
      // Without this, the arrow keys also scroll the page while playing.
      event.preventDefault();
      held.add(event.code);
      update();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      held.delete(event.code);
      update();
    };
    // The window lost focus (alt-tab): release every key, or a paddle keeps moving.
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
