import { DIFFICULTIES, type JoinRequest } from "@ft/core";
import type { ReactNode } from "react";

export function ModePicker({
  request,
  onChange,
}: {
  request: JoinRequest;
  onChange: (request: JoinRequest) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <ModeButton selected={request.mode === "local"} onClick={() => onChange({ mode: "local" })}>
        2 players
      </ModeButton>
      {DIFFICULTIES.map((difficulty) => (
        <ModeButton
          key={difficulty}
          selected={request.mode === "ai" && request.difficulty === difficulty}
          onClick={() => onChange({ mode: "ai", difficulty })}
        >
          AI · {difficulty}
        </ModeButton>
      ))}
    </div>
  );
}

function ModeButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const colors = selected
    ? "border-amber-400 bg-amber-400 text-slate-950"
    : "border-slate-400 hover:border-slate-600";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-md border px-3 py-1.5 text-sm ${colors}`}
    >
      {children}
    </button>
  );
}
