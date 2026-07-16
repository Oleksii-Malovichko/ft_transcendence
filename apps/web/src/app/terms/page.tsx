import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <div className="mx-auto flex max-w-prose flex-col gap-4 px-4 py-10">
      <h1 className="text-2xl font-semibold">Terms of service</h1>
      <p className="text-muted">
        By creating an account you accept these terms and the{" "}
        <Link href="/privacy" className="text-ink underline underline-offset-2">
          privacy policy
        </Link>
        .
      </p>

      <h2 className="mt-4 text-lg font-semibold">Your account</h2>
      <p className="text-muted">
        One person, one account. Keep your password to yourself: anything done from your account is
        treated as done by you.
      </p>

      <h2 className="mt-4 text-lg font-semibold">Playing fair</h2>
      <p className="text-muted">
        Play the game as it is served. Do not modify the client to cheat, do not automate play, and
        do not try to break the service for others. Display names must not insult or impersonate
        anyone.
      </p>

      <h2 className="mt-4 text-lg font-semibold">No guarantees</h2>
      <p className="text-muted">
        This is a school project. It can be stopped, reset or emptied at any time, and it comes with
        no warranty of any kind.
      </p>

      <h2 className="mt-4 text-lg font-semibold">Ending it</h2>
      <p className="text-muted">
        You can ask for your account to be deleted at any moment. We may remove an account that
        breaks these rules.
      </p>
    </div>
  );
}