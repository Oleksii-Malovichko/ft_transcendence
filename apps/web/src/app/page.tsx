import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-semibold">ft_transcendence</h1>
      <p className="max-w-prose text-muted">
        Play Pong in your browser: against a friend on one keyboard, against an AI opponent, or
        online in a tournament.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Play now">
          Two players on one keyboard, or a game against the AI at three difficulty levels.
          <div className="mt-4">
            <Link href="/play">
              <Button>Open the game</Button>
            </Link>
          </div>
        </Card>
        <Card title="Tournaments">Coming with the tournament module.</Card>
      </div>
    </div>
  );
}
