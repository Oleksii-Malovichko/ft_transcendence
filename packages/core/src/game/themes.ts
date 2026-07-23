import { z } from "zod";

export interface Theme {
  field: string;
  line: string;
  paddle: string;
  ball: string;
}

export const THEMES: Record<"classic" | "neon", Theme> = {
  classic: { field: "#0f172a", line: "#334155", paddle: "#e2e8f0", ball: "#fbbf24" },
  neon: { field: "#0b0b1a", line: "#4c1d95", paddle: "#22d3ee", ball: "#f472b6" },
};

export const ThemeNameSchema = z.enum(["classic", "neon"]);
export type ThemeName = z.infer<typeof ThemeNameSchema>;
export const DEFAULT_THEME: ThemeName = "classic";
