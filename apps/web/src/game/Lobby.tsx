import { Button } from "@/components/ui/Button";

export function Lobby({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="flex w-full flex-col items-center gap-4 rounded-lg border border-edge bg-panel p-10">
      <p className="text-lg" aria-live="polite">
        Looking for an opponent…
      </p>
      <p className="text-sm text-muted">
        The first player waiting gets the left paddle. Keep this tab open.
      </p>
      <Button variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}
