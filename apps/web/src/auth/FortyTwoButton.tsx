import { apiUrl } from "@/lib/api";

export function FortyTwoButton() {
  return (
    <a
      href={apiUrl("/auth/42")}
      className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-edge bg-panel px-4 py-2 text-sm font-medium hover:border-muted"
    >
      Continue with 42
    </a>
  );
}
