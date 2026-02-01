import { Inject, Injectable } from '@nestjs/common';

import {
  TELEGRAM_CLIENT,
  TelegramClient,
} from '@src/domain/ports/telegram.client';
import {
  CONFIGURATION_SERVICE,
  ConfigurationService,
} from '@src/domain/ports/configuration.service';
import { ConfigKeys } from '@src/config/config-keys';
import { AI_RESPONDER, AIResponder } from '@src/domain/ports/ai-responder';

export interface ReplyToMessageInput {
  chatId: string;
  incomingText: string;
}

@Injectable()
export class ReplyToMessageUseCase {
  private static readonly REPLIES = [
    'Recibido.',
    'Dale, lo anoto.',
    'Buenísimo.',
    'Ok ok.',
    'Gracias por tu mensaje.',
    'Anotado!',
    'Genial 😄',
    'Perfecto.',
  ];

  constructor(
    @Inject(TELEGRAM_CLIENT) private readonly telegramClient: TelegramClient,
  @Inject(CONFIGURATION_SERVICE) private readonly config: ConfigurationService,
  @Inject(AI_RESPONDER) private readonly ai: AIResponder,
  ) {}

  async execute(input: ReplyToMessageInput): Promise<void> {
    const aiEnabled =
      String(this.config.get(ConfigKeys.AI_REPLY_ENABLED) ?? 'false') === 'true';

    let reply: string;
    if (aiEnabled) {
      try {
        reply = await this.ai.generateReply({ incomingText: input.incomingText });
      } catch {
        // fallback seguro: no queremos romper el flujo si falla la "IA"
        reply =
          ReplyToMessageUseCase.REPLIES[
            Math.floor(Math.random() * ReplyToMessageUseCase.REPLIES.length)
          ];
      }
    } else {
      reply =
        ReplyToMessageUseCase.REPLIES[
          Math.floor(Math.random() * ReplyToMessageUseCase.REPLIES.length)
        ];
    }

    await this.telegramClient.sendMessage({
      chatId: input.chatId,
      text: reply,
    });
  }
}
