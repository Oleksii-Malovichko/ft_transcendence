import type { Metadata } from "next";
import type { Friend } from "@ft/core";
import { redirect } from "next/navigation";
import { currentUser } from "@/auth/server";
import { ChatView } from "@/chat/ChatView";
import { serverGet } from "@/lib/server-api";

export const metadata: Metadata = { title: "Chat" };

export default async function ChatPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/chat");
  const friends = (await serverGet<Friend[]>("/users/me/friends")) ?? [];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Chat</h1>
      <ChatView friends={friends} currentUserId={user.id} />
    </div>
  );
}
