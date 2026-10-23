export interface NavLink {
  href: string;
  label: string;
}

export const NAV_LINKS: readonly NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/play", label: "Play" },
  { href: "/tournaments", label: "Tournaments" },
  { href: "/friends", label: "Friends" },
  { href: "/chat", label: "Chat" },
];
