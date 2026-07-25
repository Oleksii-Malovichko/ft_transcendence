import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/auth/server";
import { Card } from "@/components/ui/Card";
import { MatchHistory } from "@/profile/MatchHistory";
import { ProfileHeader } from "@/profile/ProfileHeader";
import { fetchProfile } from "@/profile/server";

export const metadata: Metadata = { title: "Your profile" };

export default async function ProfilePage() {
  const user = await currentUser();
  if (!user) {
    redirect("/login?next=/profile");
  }
  const profile = await fetchProfile(user.id);
  if (!profile) {
    return <p className="mx-auto max-w-3xl px-4 py-10 text-muted">Profile unavailable.</p>;
  }
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <ProfileHeader profile={profile} />
      <Card title="Recent games">
        <MatchHistory matches={profile.matches} />
      </Card>
    </div>
  );
}