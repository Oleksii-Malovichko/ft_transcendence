import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex max-w-prose flex-col gap-4 px-4 py-10">
      <h1 className="text-2xl font-semibold">Privacy policy</h1>
      <p className="text-muted">
        ft_transcendence is a student project built at 42. It is not a commercial service, and
        nothing here is sold, shared or used for advertising.
      </p>

      <h2 className="mt-4 text-lg font-semibold">What we store</h2>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        <li>Your email address, which identifies your account.</li>
        <li>
          Your password, only as an Argon2id hash. We cannot read it, and it cannot be turned back
          into your password.
        </li>
        <li>Your games: scores, opponents and dates, so the site can show a match history.</li>
      </ul>

      <h2 className="mt-4 text-lg font-semibold">Cookies</h2>
      <p className="text-muted">
        One cookie, called <code>session</code>, which says that you are logged in. It is set by the
        server, cannot be read by scripts in the page, and is sent only to this site. There are no
        analytics or advertising cookies, and no third-party scripts.
      </p>

      <h2 className="mt-4 text-lg font-semibold">How long</h2>
      <p className="text-muted">
        Your account and your match history are kept until you ask for them to be deleted. The
        session cookie expires after seven days, or as soon as you log out.
      </p>

      <h2 className="mt-4 text-lg font-semibold">Deleting your data</h2>
      <p className="text-muted">
        Ask any member of the team and your account will be removed, along with the personal data
        attached to it.
      </p>
    </div>
  );
}