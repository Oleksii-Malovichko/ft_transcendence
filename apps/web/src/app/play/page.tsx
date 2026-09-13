import type { Metadata } from "next";
import { PlayScreen } from "@/game/PlayScreen";

export const metadata: Metadata = { title: "Play" };

export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ tournament?: string }>;
}) {
  // /play?tournament=12 means "play the match that is due in tournament 12".
  const { tournament } = await searchParams;
  const parsed = Number(tournament);
  const matchId = Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Pong</h1>
      <PlayScreen tournamentId={matchId} />
    </div>
  );
}
