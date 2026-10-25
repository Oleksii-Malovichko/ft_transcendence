import type { ChatConversation, ChatMessage } from "@ft/core";
import { apiFetch } from "@/lib/api";

export function fetchConversations(): Promise<ChatConversation[]> {
  return apiFetch<ChatConversation[]>("/chat/conversations");
}

export function openConversation(recipientId: number): Promise<ChatConversation> {
  return apiFetch<ChatConversation>("/chat/conversations", {
    method: "POST",
    body: JSON.stringify({ recipientId }),
  });
}

export function fetchMessages(conversationId: number): Promise<ChatMessage[]> {
  return apiFetch<ChatMessage[]>(`/chat/conversations/${conversationId}/messages`);
}

export function sendMessage(conversationId: number, body: string): Promise<ChatMessage> {
  return apiFetch<ChatMessage>(`/chat/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}
