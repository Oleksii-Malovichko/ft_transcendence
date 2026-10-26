import { z } from "zod";

export const CreateConversationSchema = z.object({
  recipientId: z.number().int().positive(),
});
export type CreateConversation = z.infer<typeof CreateConversationSchema>;

export const BlockUserSchema = z.object({
  userId: z.number().int().positive(),
});
export type BlockUser = z.infer<typeof BlockUserSchema>;

export const SendMessageSchema = z.object({
  body: z.string().trim().min(1, "Message cannot be empty").max(1000, "Message is too long"),
});
export type SendMessage = z.infer<typeof SendMessageSchema>;

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  body: string;
  createdAt: string;
}

export interface ChatConversation {
  id: number;
  otherUser: {
    id: number;
    displayName: string | null;
    avatarUrl: string;
  };
  updatedAt: string;
  lastMessage: ChatMessage | null;
  blockedByMe: boolean;
  blockedByThem: boolean;
}
