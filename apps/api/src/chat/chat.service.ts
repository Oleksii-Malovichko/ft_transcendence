import type { ChatConversation, ChatMessage } from "@ft/core";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
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
    const [conversations, blocks] = await Promise.all([
      this.prisma.conversation.findMany({
        where: { OR: [{ userLowId: userId }, { userHighId: userId }] },
        include: conversationInclude,
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      }),
      this.prisma.userBlock.findMany({
        where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
        select: { blockerId: true, blockedId: true },
      }),
    ]);
    return conversations.map((conversation) => this.toConversation(conversation, userId, blocks));
  }

  async getOrCreateConversation(userId: number, recipientId: number): Promise<ChatConversation> {
    if (userId === recipientId) {
      throw new BadRequestException("You cannot start a conversation with yourself");
    }
    await this.requireNotBlocked(userId, recipientId);

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
    return this.toConversation(conversation, userId, []);
  }

  async listMessages(userId: number, conversationId: number): Promise<ChatMessage[]> {
    const otherUserId = await this.requireParticipant(userId, conversationId);
    await this.requireNotBlocked(userId, otherUserId);
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: HISTORY_LIMIT,
    });
    return messages.reverse().map((message) => this.toMessage(message));
  }

  async sendMessage(userId: number, conversationId: number, body: string): Promise<ChatMessage> {
    return this.prisma.$transaction(async (transaction) => {
      const otherUserId = await this.requireParticipant(userId, conversationId, transaction);
      await this.requireNotBlocked(userId, otherUserId, transaction);
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

  async blockUser(userId: number, blockedId: number): Promise<void> {
    if (userId === blockedId) throw new BadRequestException("You cannot block yourself");
    const user = await this.prisma.user.findUnique({
      where: { id: blockedId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException("User not found");
    await this.prisma.userBlock.upsert({
      where: { blockerId_blockedId: { blockerId: userId, blockedId } },
      create: { blockerId: userId, blockedId },
      update: {},
    });
  }

  async unblockUser(userId: number, blockedId: number): Promise<void> {
    const { count } = await this.prisma.userBlock.deleteMany({
      where: { blockerId: userId, blockedId },
    });
    if (count === 0) throw new NotFoundException("User is not blocked");
  }

  async blockStatus(userId: number, otherUserId: number): Promise<{
    blockedByMe: boolean;
    blockedByThem: boolean;
  }> {
    const [blockedByMe, blockedByThem] = await Promise.all([
      this.prisma.userBlock.findUnique({
        where: { blockerId_blockedId: { blockerId: userId, blockedId: otherUserId } },
        select: { id: true },
      }),
      this.prisma.userBlock.findUnique({
        where: { blockerId_blockedId: { blockerId: otherUserId, blockedId: userId } },
        select: { id: true },
      }),
    ]);
    return { blockedByMe: Boolean(blockedByMe), blockedByThem: Boolean(blockedByThem) };
  }

  async areBlocked(firstUserId: number, secondUserId: number): Promise<boolean> {
    if (firstUserId === secondUserId) return false;
    const block = await this.prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: firstUserId, blockedId: secondUserId },
          { blockerId: secondUserId, blockedId: firstUserId },
        ],
      },
      select: { id: true },
    });
    return block !== null;
  }

  private async requireParticipant(
    userId: number,
    conversationId: number,
    prisma: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<number> {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ userLowId: userId }, { userHighId: userId }],
      },
      select: { userLowId: true, userHighId: true },
    });
    if (!conversation) throw new NotFoundException("Conversation not found");
    return conversation.userLowId === userId ? conversation.userHighId : conversation.userLowId;
  }

  private async requireNotBlocked(
    userId: number,
    otherUserId: number,
    prisma: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<void> {
    const block = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: otherUserId },
          { blockerId: otherUserId, blockedId: userId },
        ],
      },
      select: { id: true },
    });
    if (block) throw new ForbiddenException("Messaging is unavailable because one player is blocked");
  }

  private toConversation(
    conversation: ConversationWithPreview,
    userId: number,
    blocks: readonly { blockerId: number; blockedId: number }[],
  ): ChatConversation {
    const otherUser =
      conversation.userLowId === userId ? conversation.userHigh : conversation.userLow;
    const blockedByMe = blocks.some(
      (block) => block.blockerId === userId && block.blockedId === otherUser.id,
    );
    const blockedByThem = blocks.some(
      (block) => block.blockerId === otherUser.id && block.blockedId === userId,
    );
    const lastMessage = conversation.messages[0];
    return {
      id: conversation.id,
      otherUser: {
        id: otherUser.id,
        displayName: otherUser.displayName,
        avatarUrl: avatarUrlFor(otherUser.id),
      },
      updatedAt: conversation.updatedAt.toISOString(),
      lastMessage:
        blockedByMe || blockedByThem || !lastMessage ? null : this.toMessage(lastMessage),
      blockedByMe,
      blockedByThem,
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
