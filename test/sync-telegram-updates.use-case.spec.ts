import { SyncTelegramUpdatesUseCase } from '../src/application/use-cases/telegram/sync-telegram-updates.use-case';

import { Conversation } from '@src/domain/model/conversation.entity';
import { TelegramChatId } from '@src/domain/value-objects/telegram-chat-id.vo';

describe('SyncTelegramUpdatesUseCase', () => {
  it('advances offset and is idempotent when message insert returns undefined', async () => {
    const telegram = {
      getUpdates: jest.fn().mockResolvedValue([
        {
          updateId: 10,
          message: {
            messageId: 1,
            chatId: '123',
            text: 'hola',
            date: 0,
          },
        },
        {
          updateId: 11,
          message: {
            messageId: 2,
            chatId: '123',
            text: 'hola de nuevo',
            date: 0,
          },
        },
      ]),
      sendMessage: jest.fn(),
    };

    const syncState = {
      get: jest.fn().mockResolvedValue({ lastUpdateId: 9 }),
      setLastUpdateId: jest.fn().mockResolvedValue(undefined),
    };

    const conversations = {
      findByTelegramChatId: jest
        .fn()
        .mockResolvedValue(
          Conversation.createNew({ telegramChatId: TelegramChatId.create('123') }),
        ),
      save: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
    };

    const messages = {
      save: jest.fn(),
      saveFromTelegramUpdate: jest
        .fn()
        .mockResolvedValueOnce(undefined)
  .mockResolvedValueOnce({ id: 'm2', createdAt: new Date('2020-01-01') }),
      listByConversationId: jest.fn(),
    };

    const producer = { send: jest.fn().mockResolvedValue(undefined) };

    const uc = new SyncTelegramUpdatesUseCase(
      telegram as any,
      syncState as any,
      conversations as any,
      messages as any,
      producer as any,
    );

    const out = await uc.execute({ limit: 50, timeoutSeconds: 0 });

    expect(out.lastUpdateIdBefore).toBe(9);
    expect(out.lastUpdateIdAfter).toBe(11);
    expect(out.processedUpdates).toBe(2);
    expect(out.processedMessages).toBe(1);

    expect(syncState.setLastUpdateId).toHaveBeenCalledWith(10);
    expect(syncState.setLastUpdateId).toHaveBeenCalledWith(11);
  });
});
