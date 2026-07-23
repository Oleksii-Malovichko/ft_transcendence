import { DEFAULT_SETTINGS, type GameSettings } from "@ft/core";

interface Slider {
  key: "ballSpeed" | "paddleHeight" | "scoreLimit";
  label: string;
  min: number;
  max: number;
  step: number;
}

const SLIDERS: Slider[] = [
  { key: "ballSpeed", label: "Ball speed", min: 240, max: 660, step: 30 },
  { key: "paddleHeight", label: "Paddle size", min: 40, max: 160, step: 10 },
  { key: "scoreLimit", label: "Points to win", min: 1, max: 11, step: 1 },
];

export function SettingsForm({
  settings,
  onChange,
}: {
  settings: GameSettings;
  onChange: (settings: GameSettings) => void;
}) {
  return (
    <div className="flex w-full flex-wrap items-end justify-center gap-4">
      {SLIDERS.map((slider) => (
        <label key={slider.key} className="flex flex-col gap-1 text-sm text-muted">
          <span>
            {slider.label}: <span className="text-ink tabular-nums">{settings[slider.key]}</span>
          </span>
          <input
            type="range"
            min={slider.min}
            max={slider.max}
            step={slider.step}
            value={settings[slider.key]}
            onChange={(event) =>
              onChange({ ...settings, [slider.key]: Number(event.target.value) })
            }
            className="accent-accent"
          />
        </label>
      ))}
      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={settings.powerUps}
          onChange={(event) => onChange({ ...settings, powerUps: event.target.checked })}
          className="accent-accent"
        />
        Bonuses
      </label>
      <button
        type="button"
        onClick={() => onChange(DEFAULT_SETTINGS)}
        className="rounded-md border border-edge px-3 py-1.5 text-sm text-muted hover:text-ink"
      >
        Reset
      </button>
    </div>
  );
}
