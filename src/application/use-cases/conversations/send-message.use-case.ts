import { Inject, Injectable } from '@nestjs/common';
import {
  CONVERSATION_REPOSITORY,
  ConversationRepository,
} from '@src/domain/ports/conversation.repository';
import {
  MESSAGE_REPOSITORY,
  MessageRepository,
} from '@src/domain/ports/message.repository';
import {
  TELEGRAM_CLIENT,
  TelegramClient,
} from '@src/domain/ports/telegram.client';
import { Message } from '@src/domain/model/message.entity';
import { MessageContent } from '@src/domain/value-objects/message-content.vo';
import {
  ConversationMessageTextRequiredError,
  ConversationNotFoundError,
} from '@src/domain/errors/conversation.errors';

export interface SendMessageInput {
  conversationId: string;
  text: string;
}

export interface SendMessageOutput {
  id: string;
}

@Injectable()
export class SendMessageUseCase {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversations: ConversationRepository,
    @Inject(MESSAGE_REPOSITORY)
    private readonly messages: MessageRepository,
    @Inject(TELEGRAM_CLIENT)
    private readonly telegramClient: TelegramClient,
  ) {}

  async execute(input: SendMessageInput): Promise<SendMessageOutput> {
    const conversation = await this.conversations.findById(
      input.conversationId,
    );
    if (!conversation) {
      throw new ConversationNotFoundError(input.conversationId);
    }

    const text = input.text?.trim();
    if (!text) {
      throw new ConversationMessageTextRequiredError();
    }

    await this.telegramClient.sendMessage({
      chatId: conversation.telegramChatId.toString(),
      text,
    });

    const message = Message.createNew({
      conversationId: conversation.id,
      direction: 'OUT',
      content: MessageContent.create(text),
    });

    const saved = await this.messages.save(message);

    return { id: saved.id };
  }
}
