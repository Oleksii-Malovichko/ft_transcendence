"use client";

import type { ChatMessage } from "@ft/core";

export function MessageList({
  messages,
  currentUserId,
  otherUserName,
}: {
  messages: ChatMessage[];
  currentUserId: number;
  otherUserName: string;
}) {
  if (messages.length === 0) {
    return (
      <p className="flex-1 py-8 text-center text-sm text-muted">No messages yet. Say hello.</p>
    );
  }

  return (
    <ol className="flex max-h-[60vh] min-h-64 flex-1 flex-col gap-3 overflow-y-auto p-3">
      {messages.map((message) => {
        const own = message.senderId === currentUserId;
        return (
          <li
            key={message.id}
            className={`max-w-[85%] rounded-lg px-3 py-2 ${
              own ? "self-end bg-accent text-surface" : "self-start bg-surface text-ink"
            }`}
          >
            {!own && <p className="mb-1 text-xs font-semibold">{otherUserName}</p>}
            <p className="whitespace-pre-wrap break-words">{message.body}</p>
            <time className="mt-1 block text-right text-xs opacity-70" dateTime={message.createdAt}>
              {new Date(message.createdAt).toLocaleString()}
            </time>
          </li>
        );
      })}
    </ol>
  );
}
