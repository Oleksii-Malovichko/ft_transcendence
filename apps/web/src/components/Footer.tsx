import Link from "next/link";
export function Footer() {
  return (
    <footer className="border-t border-edge bg-panel text-sm text-muted">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <p>ft_transcendence — a 42 project</p>
        <p className="flex gap-3">
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-ink">
            Terms
          </Link>
        </p>
      </div>
    </footer>
  );
}
