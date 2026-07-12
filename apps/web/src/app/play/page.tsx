import type { Metadata } from "next";
import { PlayScreen } from "@/game/PlayScreen";

export const metadata: Metadata = { title: "Play" };

export default function PlayPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Pong</h1>
      <PlayScreen />
    </main>
  );
}