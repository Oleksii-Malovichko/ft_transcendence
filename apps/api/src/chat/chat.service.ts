import type { ChatConversation, ChatMessage } from "@ft/core";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { avatarUrlFor } from "../users/public-user.js";

const HISTORY_LIMIT = 50;

const conversationInclude = {
  userLow: { select: { id: true, displayName: true } },
  userHigh: { select: { id: true, displayName: true } },
  messages: { orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1 },
} satisfies Prisma.ConversationInclude;

type ConversationWithPreview = Prisma.ConversationGetPayload<{
  include: typeof conversationInclude;
}>;

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async listConversations(userId: number): Promise<ChatConversation[]> {
    const conversations = await this.prisma.conversation.findMany({
      where: { OR: [{ userLowId: userId }, { userHighId: userId }] },
      include: conversationInclude,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    });
    return conversations.map((conversation) => this.toConversation(conversation, userId));
  }

  async getOrCreateConversation(userId: number, recipientId: number): Promise<ChatConversation> {
    if (userId === recipientId) {
      throw new BadRequestException("You cannot start a conversation with yourself");
    }

    const recipient = await this.prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true },
    });
    if (!recipient) throw new NotFoundException("User not found");

    const [userLowId, userHighId] =
      userId < recipientId ? [userId, recipientId] : [recipientId, userId];
    const conversation = await this.prisma.conversation.upsert({
      where: { userLowId_userHighId: { userLowId, userHighId } },
      create: { userLowId, userHighId },
      update: {},
      include: conversationInclude,
    });
    return this.toConversation(conversation, userId);
  }

  async listMessages(userId: number, conversationId: number): Promise<ChatMessage[]> {
    await this.requireParticipant(userId, conversationId);
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: HISTORY_LIMIT,
    });
    return messages.reverse().map((message) => this.toMessage(message));
  }

  async sendMessage(userId: number, conversationId: number, body: string): Promise<ChatMessage> {
    return this.prisma.$transaction(async (transaction) => {
      await this.requireParticipant(userId, conversationId, transaction);
      const message = await transaction.message.create({
        data: { conversationId, senderId: userId, body },
      });
      await transaction.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
      return this.toMessage(message);
    });
  }

  private async requireParticipant(
    userId: number,
    conversationId: number,
    prisma: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<void> {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ userLowId: userId }, { userHighId: userId }],
      },
      select: { id: true },
    });
    if (!conversation) throw new NotFoundException("Conversation not found");
  }

  private toConversation(conversation: ConversationWithPreview, userId: number): ChatConversation {
    const otherUser =
      conversation.userLowId === userId ? conversation.userHigh : conversation.userLow;
    const lastMessage = conversation.messages[0];
    return {
      id: conversation.id,
      otherUser: {
        id: otherUser.id,
        displayName: otherUser.displayName,
        avatarUrl: avatarUrlFor(otherUser.id),
      },
      updatedAt: conversation.updatedAt.toISOString(),
      lastMessage: lastMessage ? this.toMessage(lastMessage) : null,
    };
  }

  private toMessage(message: {
    id: number;
    conversationId: number;
    senderId: number;
    body: string;
    createdAt: Date;
  }): ChatMessage {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
    };
  }
}
