import Link from "next/link";
import { NAV_LINKS } from "./nav-links";

export function Header() {
  return (
    <header className="border-b border-edge bg-panel">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          ft_transcendence
        </Link>
        <nav aria-label="Main">
          <ul className="flex gap-4 text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-muted hover:text-ink">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
