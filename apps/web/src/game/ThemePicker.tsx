import { THEMES, type ThemeName } from "@ft/core";

export function ThemePicker({
  theme,
  onChange,
}: {
  theme: ThemeName;
  onChange: (theme: ThemeName) => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted">
      <span>Theme</span>
      {(Object.keys(THEMES) as ThemeName[]).map((name) => (
        <button
          key={name}
          type="button"
          aria-pressed={name === theme}
          onClick={() => onChange(name)}
          className={`rounded-md border px-3 py-1 ${
            name === theme ? "border-accent text-accent" : "border-edge hover:text-ink"
          }`}
        >
          {name}
        </button>
      ))}
    </div>
  );
}
