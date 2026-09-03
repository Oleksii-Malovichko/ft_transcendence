export interface NavLink {
  href: string;
  label: string;
}

export const NAV_LINKS: readonly NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/play", label: "Play" },
  { href: "/tournaments", label: "Tournaments" },
];
