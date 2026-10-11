import type { Metadata, Viewport } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { AuthProvider } from "@/auth/AuthProvider";
import { currentUser } from "@/auth/server";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ft_transcendence", template: "%s · ft_transcendence" },
  description: "Real-time multiplayer Pong with tournaments and an AI opponent.",
  applicationName: "ft_transcendence",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

// `LayoutProps<"/">` is a global type Next.js generates for each route,
// so `children` is typed without writing the props interface by hand.
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await currentUser();
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-surface"
        >
          Skip to content
        </a>
        <AuthProvider initialUser={user}>
          <ToastProvider>
            <Header />
            <main id="main" className="flex-1">
              {children}
            </main>
            <Footer />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
