import type { PublicProfile } from "@ft/core";
import Image from "next/image";

export function ProfileHeader({ profile }: { profile: PublicProfile }) {
  const lost = profile.played - profile.won;
  return (
    <div className="flex items-center gap-4">
      {}
      <Image
        src={profile.avatarUrl}
        alt=""
        width={72}
        height={72}
        unoptimized
        className="rounded-full border border-edge"
      />
      <div>
        <h1 className="text-2xl font-semibold">{profile.displayName ?? "Unnamed player"}</h1>
        <p className="text-sm text-muted">
          {profile.played} {profile.played === 1 ? "game" : "games"} · {profile.won} won · {lost}{" "}
          lost
        </p>
      </div>
    </div>
  );
}