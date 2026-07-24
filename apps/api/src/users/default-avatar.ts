
const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

export function defaultAvatar(displayName: string | null, userId: number): string {
  const initial = [...(displayName?.trim() ?? "")][0]?.toUpperCase() ?? "?";
  // 137° is close to the golden angle: consecutive ids land far apart.
  const hue = (userId * 137) % 360;
  const letter = initial.replace(/[&<>"']/g, (character) => ESCAPES[character] ?? character);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Avatar">
  <rect width="64" height="64" rx="32" fill="hsl(${hue} 45% 35%)" />
  <text x="32" y="42" text-anchor="middle" font-family="system-ui, sans-serif" font-size="30" fill="#e2e8f0">${letter}</text>
</svg>`;
}