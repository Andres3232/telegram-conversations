import { Inject, Injectable } from '@nestjs/common';

import {
  TELEGRAM_CLIENT,
  TelegramClient,
} from '@src/domain/ports/telegram.client';

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
  ) {}

  async execute(input: ReplyToMessageInput): Promise<void> {
    const reply =
      ReplyToMessageUseCase.REPLIES[
        Math.floor(Math.random() * ReplyToMessageUseCase.REPLIES.length)
      ];

    await this.telegramClient.sendMessage({
      chatId: input.chatId,
      text: reply,
    });
  }
}
