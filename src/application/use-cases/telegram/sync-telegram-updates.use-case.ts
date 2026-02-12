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
import {
  TELEGRAM_SYNC_STATE_REPOSITORY,
  TelegramSyncStateRepository,
} from '@src/domain/ports/telegram-sync-state.repository';
import { Conversation } from '@src/domain/model/conversation.entity';
import { TelegramChatId } from '@src/domain/value-objects/telegram-chat-id.vo';
import {
  MESSAGE_PRODUCER,
  MessageProducer,
} from '@src/domain/ports/message.producer';
import { MessageReceivedEvent } from '@src/domain/events/message-received.event';

export interface SyncTelegramUpdatesInput {
  limit?: number;
  timeoutSeconds?: number;
}

export interface SyncTelegramUpdatesOutput {
  processedUpdates: number;
  processedMessages: number;
  lastUpdateIdBefore: number;
  lastUpdateIdAfter: number;
}

@Injectable()
//TODO: cambiar el nombre del caso de uso a algo mas generico por ejemplo IngestIncomingMessagesUseCase
export class SyncTelegramUpdatesUseCase {
  constructor(
    @Inject(TELEGRAM_CLIENT) private readonly telegramClient: TelegramClient,
    @Inject(TELEGRAM_SYNC_STATE_REPOSITORY)
    private readonly syncState: TelegramSyncStateRepository,
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversations: ConversationRepository,
    @Inject(MESSAGE_REPOSITORY)
    private readonly messages: MessageRepository,
    @Inject(MESSAGE_PRODUCER)
    private readonly producer: MessageProducer,
  ) {}

  async execute(
    input: SyncTelegramUpdatesInput = {},
  ): Promise<SyncTelegramUpdatesOutput> {
    const state = await this.syncState.get();
    const lastUpdateIdBefore = state.lastUpdateId;

    const updates = await this.telegramClient.getUpdates({
      offset: lastUpdateIdBefore + 1,
      limit: input.limit,
      timeoutSeconds: input.timeoutSeconds,
    });

    let processedMessages = 0;
    let lastUpdateIdAfter = lastUpdateIdBefore;

    for (const u of updates) {
      lastUpdateIdAfter = Math.max(lastUpdateIdAfter, u.updateId);

      try {
        const text = u.message?.text;
        const chatId = u.message?.chatId;
        if (!text || !chatId) {
          continue;
        }

        const telegramChatId = TelegramChatId.create(chatId);
        const conversation =
          (await this.conversations.findByTelegramChatId(telegramChatId)) ??
          (await this.conversations.save(
            Conversation.createNew({ telegramChatId }),
          ));

        const inserted = await this.messages.saveFromTelegramUpdate({
          conversationId: conversation.id,
          direction: 'IN',
          content: text,
          telegramUpdateId: u.updateId,
        });

        if (inserted) {
          processedMessages += 1;

          await this.producer.send(
            new MessageReceivedEvent({
              messageId: inserted.id,
              conversationId: conversation.id,
              telegramChatId: telegramChatId.toString(),
              telegramUpdateId: u.updateId,
              text,
              receivedAt: inserted.createdAt.toISOString(),
            }),
          );
        }
      } finally {
        await this.syncState.setLastUpdateId(lastUpdateIdAfter);
      }
    }

    return {
      processedUpdates: updates.length,
      processedMessages,
      lastUpdateIdBefore,
      lastUpdateIdAfter,
    };
  }
}
