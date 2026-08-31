import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTournament } from "@/tournaments/server";
import { TournamentView } from "@/tournaments/TournamentView";

export const metadata: Metadata = { title: "Tournament" };

// `params` is a promise since Next 15. Typed by hand rather than with the
// generated PageProps, so a fresh route type-checks before the first build.
export default async function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = await getTournament(Number(id));
  if (!tournament) {
    notFound();
  }
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <TournamentView initial={tournament} />
    </div>
  );
}
