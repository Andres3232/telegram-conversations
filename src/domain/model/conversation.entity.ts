import * as crypto from 'crypto';

import { BaseEntity } from '@src/domain/model/base.entity';
import { TelegramChatId } from '@src/domain/value-objects/telegram-chat-id.vo';

export interface ConversationProps {
  id: string;
  telegramChatId: TelegramChatId;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Conversation extends BaseEntity {
  readonly telegramChatId: TelegramChatId;

  private constructor({ id, telegramChatId, createdAt, updatedAt }: ConversationProps) {
    super(id, createdAt, updatedAt);
    this.telegramChatId = telegramChatId;
  }

  static createNew(params: { telegramChatId: TelegramChatId }): Conversation {
    return new Conversation({
      id: crypto.randomUUID(),
      telegramChatId: params.telegramChatId,
    });
  }

  static rehydrate(props: ConversationProps): Conversation {
    return new Conversation(props);
  }
}
