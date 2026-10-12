import type { KeyBinding } from "./useKeyboardInput";

export const LEFT_KEYS: KeyBinding = { side: "left", up: "KeyW", down: "KeyS" };
export const RIGHT_KEYS: KeyBinding = { side: "right", up: "ArrowUp", down: "ArrowDown" };

/** Two players on one keyboard. */
export const LOCAL_BINDINGS = [LEFT_KEYS, RIGHT_KEYS];

/** Playing alone against the AI: the left paddle answers to both key pairs. */
export const LEFT_ARROWS: KeyBinding = { side: "left", up: "ArrowUp", down: "ArrowDown" };

export const SOLO_BINDINGS = [LEFT_KEYS, LEFT_ARROWS];

/** Playing online: whichever paddle you were given answers to both key pairs. */
export const ONLINE_RIGHT_BINDINGS: KeyBinding[] = [
  { side: "right", up: "KeyW", down: "KeyS" },
  RIGHT_KEYS,
];
