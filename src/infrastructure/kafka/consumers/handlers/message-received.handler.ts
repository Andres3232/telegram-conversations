import { Injectable } from '@nestjs/common';

import { ReplyToMessageUseCase } from '@src/application/use-cases/telegram/reply-to-message.use-case';

export interface MessageReceivedEventEnvelope {
  eventName: string;
  payload: {
    telegramChatId: string;
    text: string;
    telegramUpdateId?: number;
    conversationId?: string;
    messageId?: string;
    receivedAt?: string;
  };
}

@Injectable()
export class MessageReceivedHandler {
  constructor(private readonly replyToMessageUseCase: ReplyToMessageUseCase) {}

  async handle(envelope: MessageReceivedEventEnvelope): Promise<void> {
    // Minimal validation to avoid crashing on malformed messages
    if (!envelope?.payload?.telegramChatId) return;

    await this.replyToMessageUseCase.execute({
      chatId: envelope.payload.telegramChatId,
      incomingText: envelope.payload.text ?? '',
    });
  }
}
