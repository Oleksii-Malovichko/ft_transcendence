import { DEFAULT_SETTINGS, DifficultySchema } from "@ft/core";
import type { UiMode } from "./mode";

const OPTIONS: { label: string; mode: UiMode }[] = [
  { label: "2 players", mode: { kind: "local", settings: DEFAULT_SETTINGS } },
  ...DifficultySchema.options.map((difficulty) => ({
    label: `AI · ${difficulty}`,
    mode: { kind: "ai", difficulty, settings: DEFAULT_SETTINGS } as UiMode,
  })),
  { label: "Online", mode: { kind: "online" } },
];

function isCurrent(option: UiMode, current: UiMode): boolean {
  if (option.kind !== current.kind) return false;
  return option.kind !== "ai" || current.kind !== "ai" || option.difficulty === current.difficulty;
}

export function ModePicker({ mode, onChange }: { mode: UiMode; onChange: (mode: UiMode) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {OPTIONS.map((option) => {
        const current = isCurrent(option.mode, mode);
        return (
          <button
            key={option.label}
            type="button"
            aria-pressed={current}
            onClick={() => onChange(option.mode)}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              current ? "border-accent text-accent" : "border-edge text-muted hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
