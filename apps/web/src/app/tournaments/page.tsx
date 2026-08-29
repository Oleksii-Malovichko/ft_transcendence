import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@/auth/server";
import { Card } from "@/components/ui/Card";
import { CreateTournamentForm } from "@/tournaments/CreateTournamentForm";
import { listTournaments } from "@/tournaments/server";

export const metadata: Metadata = { title: "Tournaments" };

export default async function TournamentsPage() {
  const [tournaments, user] = await Promise.all([listTournaments(), currentUser()]);
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Tournaments</h1>
      <Card title="Open a tournament">
        {user ? (
          <CreateTournamentForm />
        ) : (
          <p>
            <Link href="/login?next=/tournaments" className="text-ink underline underline-offset-2">
              Log in
            </Link>{" "}
            to open one or take a seat.
          </p>
        )}
      </Card>
      <Card title="Running and open">
        {tournaments.length === 0 ? (
          <p>No tournaments yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {tournaments.map((tournament) => (
              <li key={tournament.id} className="flex justify-between border-b border-edge py-1">
                <Link href={`/tournaments/${tournament.id}`} className="text-ink hover:underline">
                  {tournament.name}
                </Link>
                <span>
                  {tournament.registered}/{tournament.size} · {tournament.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
