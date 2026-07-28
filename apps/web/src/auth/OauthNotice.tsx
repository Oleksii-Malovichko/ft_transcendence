import { useSearchParams } from "next/navigation";

const REASONS: Record<string, string> = {
  failed: "That 42 sign-in could not be completed. Please try again.",
  denied: "You did not allow us to read your 42 profile, so nothing was signed in.",
};

export function OauthNotice() {
  const reason = useSearchParams().get("oauth");
  const message = reason ? (REASONS[reason] ?? REASONS.failed) : null;
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md border border-danger px-3 py-2 text-sm text-danger">
      {message}
    </p>
  );
}
