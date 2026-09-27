import type { Friend } from "@ft/core";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/auth/server";
import { Card } from "@/components/ui/Card";
import { FriendsList } from "@/friends/FriendsList";
import { serverGet } from "@/lib/server-api";

export const metadata: Metadata = { title: "Friends" };

export default async function FriendsPage() {
  const user = await currentUser();
  if (!user) {
    redirect("/login?next=/friends");
  }
  const friends = (await serverGet<Friend[]>("/users/me/friends")) ?? [];
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Friends</h1>
      <Card>
        <FriendsList initial={friends} />
      </Card>
    </div>
  );
}
