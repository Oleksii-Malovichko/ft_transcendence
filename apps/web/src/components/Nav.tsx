"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NAV_LINKS } from "./nav-links";

export function Nav() {
  const [open, setOpen] = useState(false);
  useEscapeToClose(open, () => setOpen(false));

  return (
    <nav aria-label="Main">
      <ul className="hidden gap-4 text-sm sm:flex">
        {NAV_LINKS.map((link) => (
          <NavItem key={link.href} href={link.href} label={link.label} />
        ))}
      </ul>

      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        className="rounded-md border border-edge px-3 py-1.5 text-sm sm:hidden"
      >
        {open ? "Close" : "Menu"}
      </button>

      {open && <MobileMenu onNavigate={() => setOpen(false)} />}
    </nav>
  );
}

function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link href={href} className="text-muted hover:text-ink">
        {label}
      </Link>
    </li>
  );
}

/** The links as a panel under the header, on narrow screens. */
function MobileMenu({ onNavigate }: { onNavigate: () => void }) {
  return (
    <ul
      id="mobile-menu"
      className="absolute left-0 right-0 top-full z-10 flex flex-col gap-1 border-b border-edge bg-panel p-4 sm:hidden"
    >
      {NAV_LINKS.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            onClick={onNavigate}
            className="block rounded-md px-2 py-2 hover:bg-surface"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function useEscapeToClose(active: boolean, close: () => void): void {
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, close]);
}
