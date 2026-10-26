"use client";

import type { ChatConversation, Friend } from "@ft/core";

interface ConversationListProps {
  conversations: ChatConversation[];
  friends: Friend[];
  selectedConversationId: number | null;
  onSelectConversation: (conversation: ChatConversation) => void;
  onOpenFriend: (friend: Friend) => void;
}

export function ConversationList({
  conversations,
  friends,
  selectedConversationId,
  onSelectConversation,
  onOpenFriend,
}: ConversationListProps) {
  return (
    <aside className="flex flex-col gap-5">
      <section>
        <h2 className="mb-2 font-semibold">Conversations</h2>
        {conversations.length === 0 ? (
          <p className="text-sm text-muted">No conversations yet.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  type="button"
                  aria-current={selectedConversationId === conversation.id ? "page" : undefined}
                  onClick={() => onSelectConversation(conversation)}
                  className={`w-full rounded-md px-3 py-2 text-left hover:bg-surface ${
                    selectedConversationId === conversation.id
                      ? "bg-surface text-ink"
                      : "text-muted"
                  }`}
                >
                  <span className="block font-medium">
                    {conversation.otherUser.displayName ?? "Unnamed player"}
                  </span>
                  <span className="block truncate text-sm">
                    {conversation.blockedByMe
                      ? "You blocked this player"
                      : conversation.blockedByThem
                        ? "This player blocked you"
                        : (conversation.lastMessage?.body ?? "Start a conversation")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Friends</h2>
        {friends.length === 0 ? (
          <p className="text-sm text-muted">Add friends first to start a conversation.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {friends.map((friend) => (
              <li key={friend.id}>
                <button
                  type="button"
                  onClick={() => onOpenFriend(friend)}
                  className="w-full rounded-md px-3 py-2 text-left text-muted hover:bg-surface hover:text-ink"
                >
                  {friend.displayName ?? "Unnamed player"}
                  <span className="ml-2 text-xs">{friend.online ? "online" : "offline"}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
