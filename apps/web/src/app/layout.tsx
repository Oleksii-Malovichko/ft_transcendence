import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

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
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        {/* Keyboard users can jump straight to the page content. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-surface"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
