import { Inject, Injectable } from '@nestjs/common';

import {
  CONVERSATION_REPOSITORY,
  ConversationRepository,
} from '@src/domain/ports/conversation.repository';

export interface ListConversationsInput {
  limit?: number;
  offset?: number;
}

export interface ListConversationsOutputItem {
  id: string;
  telegramChatId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListConversationsOutput {
  items: ListConversationsOutputItem[];
  limit: number;
  offset: number;
}

@Injectable()
export class ListConversationsUseCase {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversationsRepository: ConversationRepository,
  ) {}

  async execute(input: ListConversationsInput): Promise<ListConversationsOutput> {
    const limit = Math.min(Math.max(input.limit ?? 20, 1), 100);
    const offset = Math.max(input.offset ?? 0, 0);

    const rows = await this.conversationsRepository.list(limit, offset);

    return {
      items: rows.map((c) => ({
        id: c.id,
        telegramChatId: c.telegramChatId.toString(),
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
      limit,
      offset,
    };
  }
}
