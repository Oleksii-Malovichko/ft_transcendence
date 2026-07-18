import type { InputMessage, PaddleInput, Side } from "@ft/core";
import type { ReactNode } from "react";

export function TouchControls({
  side,
  onInput,
}: {
  side: Side;
  onInput: (message: InputMessage) => void;
}) {
  const send = (input: PaddleInput) => () => onInput({ side, input });
  return (
    <div className="flex w-full gap-3 sm:hidden">
      <TouchButton label="Move up" onPress={send(-1)} onRelease={send(0)}>
        ▲
      </TouchButton>
      <TouchButton label="Move down" onPress={send(1)} onRelease={send(0)}>
        ▼
      </TouchButton>
    </div>
  );
}

function TouchButton({
  label,
  onPress,
  onRelease,
  children,
}: {
  label: string;
  onPress: () => void;
  onRelease: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={onPress}
      onPointerUp={onRelease}
      onPointerCancel={onRelease}
      onPointerLeave={onRelease}
      className="flex-1 touch-none select-none rounded-lg border border-edge bg-panel py-6 text-2xl"
    >
      {children}
    </button>
  );
}