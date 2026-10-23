import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/auth/server";

export const metadata: Metadata = { title: "Chat" };

export default async function ChatPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/chat");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Chat</h1>
      <p>Chat is not implemented yet.</p>
    </div>
  );
}