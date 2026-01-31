import { DomainEvent } from '@src/domain/events/shared/domain.event';
import { Topics } from '@src/domain/events/shared/topics';
import { EventNames } from '@src/domain/events/shared/event-names.enum';

export interface MessageReceivedEventPayload {
  messageId: string;
  conversationId: string;
  telegramChatId: string;
  telegramUpdateId: number;
  text: string;
  receivedAt: string; // ISO
}

export class MessageReceivedEvent extends DomainEvent<MessageReceivedEventPayload> {
  constructor(private readonly payload: MessageReceivedEventPayload) {
    super();
  }

  getTopic(): string {
    return Topics.TELEGRAM;
  }

  getEventName(): string {
    return EventNames.MESSAGE_RECEIVED;
  }

  getKey(): string {
    return this.payload.conversationId;
  }

  dataAsPayload(): MessageReceivedEventPayload {
    return this.payload;
  }
}
