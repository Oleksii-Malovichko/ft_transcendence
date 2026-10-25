import {
  type ChatConversation,
  type ChatMessage,
  type CreateConversation,
  CreateConversationSchema,
  type SendMessage,
  SendMessageSchema,
} from "@ft/core";
import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import type { User } from "../generated/prisma/client.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { ChatService } from "./chat.service.js";

@Controller("chat")
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get("conversations")
  listConversations(@CurrentUser() user: User): Promise<ChatConversation[]> {
    return this.chat.listConversations(user.id);
  }

  @Post("conversations")
  openConversation(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(CreateConversationSchema)) input: CreateConversation,
  ): Promise<ChatConversation> {
    return this.chat.getOrCreateConversation(user.id, input.recipientId);
  }

  @Get("conversations/:id/messages")
  listMessages(
    @CurrentUser() user: User,
    @Param("id", ParseIntPipe) id: number,
  ): Promise<ChatMessage[]> {
    return this.chat.listMessages(user.id, id);
  }

  @Post("conversations/:id/messages")
  sendMessage(
    @CurrentUser() user: User,
    @Param("id", ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(SendMessageSchema)) input: SendMessage,
  ): Promise<ChatMessage> {
    return this.chat.sendMessage(user.id, id, input.body);
  }
}
