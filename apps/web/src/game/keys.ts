import type { KeyBinding } from "./useKeyboardInput";

export const LEFT_KEYS: KeyBinding = { side: "left", up: "KeyW", down: "KeyS" };
export const RIGHT_KEYS: KeyBinding = { side: "right", up: "ArrowUp", down: "ArrowDown" };

export const LOCAL_BINDINGS = [LEFT_KEYS, RIGHT_KEYS];