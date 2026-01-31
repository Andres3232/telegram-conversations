import * as crypto from 'crypto';

import { BaseEntity } from '@src/domain/model/base.entity';
import { MessageContent } from '@src/domain/value-objects/message-content.vo';

export type MessageDirection = 'IN' | 'OUT';

export interface MessageProps {
  id: string;
  conversationId: string;
  telegramUpdateId?: number;
  direction: MessageDirection;
  content: MessageContent;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Message extends BaseEntity {
  readonly conversationId: string;
  readonly telegramUpdateId?: number;
  readonly direction: MessageDirection;
  readonly content: MessageContent;

  private constructor({
    id,
    conversationId,
    telegramUpdateId,
    direction,
    content,
    createdAt,
    updatedAt,
  }: MessageProps) {
    super(id, createdAt, updatedAt);
    this.conversationId = conversationId;
    this.telegramUpdateId = telegramUpdateId;
    this.direction = direction;
    this.content = content;
  }

  static createNew(params: {
    conversationId: string;
    direction: MessageDirection;
    content: MessageContent;
    telegramUpdateId?: number;
  }): Message {
    return new Message({
      id: crypto.randomUUID(),
      conversationId: params.conversationId,
      telegramUpdateId: params.telegramUpdateId,
      direction: params.direction,
      content: params.content,
    });
  }

  static rehydrate(props: MessageProps): Message {
    return new Message(props);
  }
}
