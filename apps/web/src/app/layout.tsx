import type { Metadata } from "next";
import "./globals.css";

// Next.js turns this object into <title> and <meta> tags in <head>.
export const metadata: Metadata = {
  title: "ft_transcendence",
  description: "Real-time multiplayer Pong with tournaments and an AI opponent.",
};

// `LayoutProps<"/">` is a global type Next.js generates for each route,
// so `children` is typed without writing the props interface by hand.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
