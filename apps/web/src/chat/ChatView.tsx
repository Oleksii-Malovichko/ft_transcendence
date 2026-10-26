"use client";

import {
  GAME_INVITE_EVENTS,
  MATCH_EVENTS,
  type ChatConversation,
  type ChatMessage,
  type Friend,
  type MatchFound,
} from "@ft/core";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { ConversationList } from "./ConversationList";
import {
  blockUser,
  fetchConversations,
  fetchMessages,
  openConversation,
  sendMessage,
  unblockUser,
} from "./api";
import { MessageComposer } from "./MessageComposer";
import { MessageList } from "./MessageList";
import { connectSocket } from "@/game/socket";

interface IncomingInvite {
  inviteId: string;
  inviter: string;
}

export function ChatView({ friends, currentUserId }: { friends: Friend[]; currentUserId: number }) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [active, setActive] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [incomingInvite, setIncomingInvite] = useState<IncomingInvite | null>(null);
  const [inviteSending, setInviteSending] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const router = useRouter();
  const toast = useToast();

  const refreshConversations = useCallback(async () => {
    setConversations(await fetchConversations());
  }, []);

  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;
    const onInvite = (invite: IncomingInvite) => setIncomingInvite(invite);
    const onInviteError = (error: { inviteId?: string; message?: string }) => {
      setInviteSending(false);
      setIncomingInvite((current) =>
        current?.inviteId === error.inviteId ? null : current,
      );
      toast(error.message ?? "Could not send game invitation", "error");
    };
    const onFound = (_match: MatchFound) => {
      setInviteSending(false);
      router.push("/play");
    };
    socket.on(GAME_INVITE_EVENTS.incoming, onInvite);
    socket.on(GAME_INVITE_EVENTS.error, onInviteError);
    socket.on(MATCH_EVENTS.found, onFound);
    return () => {
      socket.off(GAME_INVITE_EVENTS.incoming, onInvite);
      socket.off(GAME_INVITE_EVENTS.error, onInviteError);
      socket.off(MATCH_EVENTS.found, onFound);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [router, toast]);

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
    if (conversation.blockedByMe || conversation.blockedByThem) return;
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

  const setBlocked = async (shouldBlock: boolean) => {
    if (!active) return;
    const otherUserId = active.otherUser.id;
    try {
      if (shouldBlock) await blockUser(otherUserId);
      else await unblockUser(otherUserId);
      setActive((current) => (current ? { ...current, blockedByMe: shouldBlock } : current));
      setConversations((current) =>
        current.map((conversation) =>
          conversation.otherUser.id === otherUserId
            ? { ...conversation, blockedByMe: shouldBlock }
            : conversation,
        ),
      );
      if (shouldBlock) setMessages([]);
      else if (!active.blockedByThem) setMessages(await fetchMessages(active.id));
      toast(shouldBlock ? "Player blocked" : "Player unblocked");
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Could not update block", "error");
    }
  };

  const inviteToGame = () => {
    if (!active || active.blockedByMe || active.blockedByThem || inviteSending) return;
    socketRef.current?.emit(GAME_INVITE_EVENTS.send, { recipientId: active.otherUser.id });
    setInviteSending(true);
  };

  const answerInvite = (accept: boolean) => {
    if (!incomingInvite) return;
    socketRef.current?.emit(
      accept ? GAME_INVITE_EVENTS.accept : GAME_INVITE_EVENTS.decline,
      { inviteId: incomingInvite.inviteId },
    );
    setIncomingInvite(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {incomingInvite && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent bg-panel p-3">
          <p>{incomingInvite.inviter} invited you to a game.</p>
          <div className="flex gap-2">
            <Button onClick={() => answerInvite(true)}>Accept</Button>
            <Button variant="ghost" onClick={() => answerInvite(false)}>Decline</Button>
          </div>
        </section>
      )}
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
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-edge px-4 py-3">
                <h2 className="font-semibold">{active.otherUser.displayName ?? "Unnamed player"}</h2>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    disabled={active.blockedByMe || active.blockedByThem || inviteSending}
                    onClick={inviteToGame}
                  >
                    {inviteSending ? "Invitation sent…" : "Invite to game"}
                  </Button>
                  <Button variant="ghost" onClick={() => void setBlocked(!active.blockedByMe)}>
                    {active.blockedByMe ? "Unblock" : "Block"}
                  </Button>
                </div>
              </div>
              {(active.blockedByMe || active.blockedByThem) && (
                <p className="px-4 pt-3 text-sm text-muted">
                  {active.blockedByMe
                    ? "You blocked this player. Unblock them to continue messaging or inviting them."
                    : "This player blocked you. Messaging and game invitations are unavailable."}
                </p>
              )}
              <MessageList
                messages={messages}
                currentUserId={currentUserId}
                otherUserName={active.otherUser.displayName ?? "Unnamed player"}
              />
              <MessageComposer
                onSend={submitMessage}
                disabled={active.blockedByMe || active.blockedByThem}
              />
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
    </div>
  );
}
