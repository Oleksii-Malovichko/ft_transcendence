"use client";

import type { ChatConversation, ChatMessage, Friend } from "@ft/core";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { ConversationList } from "./ConversationList";
import { fetchConversations, fetchMessages, openConversation, sendMessage } from "./api";
import { MessageComposer } from "./MessageComposer";
import { MessageList } from "./MessageList";

export function ChatView({ friends, currentUserId }: { friends: Friend[]; currentUserId: number }) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [active, setActive] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const refreshConversations = useCallback(async () => {
    setConversations(await fetchConversations());
  }, []);

  useEffect(() => {
    let activeEffect = true;
    void fetchConversations()
      .then((items) => {
        if (activeEffect) setConversations(items);
      })
      .catch((error: unknown) => {
        if (activeEffect) {
          toast(
            error instanceof ApiError ? error.message : "Could not load conversations",
            "error",
          );
        }
      })
      .finally(() => {
        if (activeEffect) setLoading(false);
      });
    return () => {
      activeEffect = false;
    };
  }, [toast]);

  const selectConversation = async (conversation: ChatConversation) => {
    setActive(conversation);
    setMessages([]);
    try {
      setMessages(await fetchMessages(conversation.id));
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Could not load messages", "error");
    }
  };

  const selectFriend = async (friend: Friend) => {
    try {
      const conversation = await openConversation(friend.id);
      setActive(conversation);
      setMessages(await fetchMessages(conversation.id));
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Could not open conversation", "error");
      return;
    }
    try {
      await refreshConversations();
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Could not refresh conversations", "error");
    }
  };

  const submitMessage = async (body: string): Promise<boolean> => {
    if (!active) return false;
    try {
      const message = await sendMessage(active.id, body);
      setMessages((current) => [...current, message]);
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Could not send message", "error");
      return false;
    }
    try {
      await refreshConversations();
    } catch (error) {
      toast(
        error instanceof ApiError ? error.message : "Message sent, but list refresh failed",
        "error",
      );
    }
    return true;
  };

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(12rem,0.8fr)_minmax(0,1.5fr)]">
      <div className="rounded-lg border border-edge bg-panel p-3">
        <ConversationList
          conversations={conversations}
          friends={friends}
          selectedConversationId={active?.id ?? null}
          onSelectConversation={(conversation) => void selectConversation(conversation)}
          onOpenFriend={(friend) => void selectFriend(friend)}
        />
      </div>

      <section className="flex min-h-80 flex-col rounded-lg border border-edge bg-panel">
        {active ? (
          <>
            <h2 className="border-b border-edge px-4 py-3 font-semibold">
              {active.otherUser.displayName ?? "Unnamed player"}
            </h2>
            <MessageList
              messages={messages}
              currentUserId={currentUserId}
              otherUserName={active.otherUser.displayName ?? "Unnamed player"}
            />
            <MessageComposer onSend={submitMessage} disabled={false} />
          </>
        ) : (
          <p className="m-auto px-4 py-8 text-center text-muted">
            {loading
              ? "Loading conversations…"
              : "Choose a conversation or a friend to start direct messaging."}
          </p>
        )}
      </section>
    </div>
  );
}
