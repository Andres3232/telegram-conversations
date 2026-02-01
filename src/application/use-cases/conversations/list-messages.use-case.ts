import { Inject, Injectable } from '@nestjs/common';
import { ConversationNotFoundError } from '@src/domain/errors/conversation.errors';
import {
  CONVERSATION_REPOSITORY,
  ConversationRepository,
} from '@src/domain/ports/conversation.repository';
import {
  MESSAGE_REPOSITORY,
  MessageRepository,
} from '@src/domain/ports/message.repository';

export interface ListMessagesInput {
  conversationId: string;
  limit?: number;
  offset?: number;
}

export interface ListMessagesOutputItem {
  id: string;
  direction: 'IN' | 'OUT';
  content: string;
  createdAt: string;
}

export interface ListMessagesOutput {
  items: ListMessagesOutputItem[];
  limit: number;
  offset: number;
}

@Injectable()
export class ListMessagesUseCase {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversations: ConversationRepository,
    @Inject(MESSAGE_REPOSITORY)
    private readonly messages: MessageRepository,
  ) {}

  async execute(input: ListMessagesInput): Promise<ListMessagesOutput> {
    const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
    const offset = Math.max(input.offset ?? 0, 0);

    const conv = await this.conversations.findById(input.conversationId);
    if (!conv) {
      throw new ConversationNotFoundError(input.conversationId);
    }

    const rows = await this.messages.listByConversationId(
      conv.id,
      limit,
      offset,
    );

    return {
      items: rows.map((m) => ({
        id: m.id,
        direction: m.direction,
        content: m.content.toString(),
        createdAt: m.createdAt.toISOString(),
      })),
      limit,
      offset,
    };
  }
}
