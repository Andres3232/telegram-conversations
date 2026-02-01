import { SyncTelegramUpdatesUseCase } from '@src/application/use-cases/telegram/sync-telegram-updates.use-case';
import { TelegramChatId } from '@src/domain/value-objects/telegram-chat-id.vo';
import { Conversation } from '@src/domain/model/conversation.entity';
import { Message } from '@src/domain/model/message.entity';
import { MessageContent } from '@src/domain/value-objects/message-content.vo';

describe('SyncTelegramUpdatesUseCase', () => {
  it('fetches updates using offset = lastUpdateId+1 and persists messages, updating state', async () => {
    // Arrange
    const telegramClient = {
      getUpdates: jest.fn().mockResolvedValue([
        {
          updateId: 10,
          message: {
            messageId: 1,
            chatId: '123',
            text: 'hola',
            date: 111,
          },
        },
      ]),
      sendMessage: jest.fn(),
    };

    const syncState = {
      get: jest.fn().mockResolvedValue({ lastUpdateId: 9 }),
      setLastUpdateId: jest.fn().mockResolvedValue(undefined),
    };

    const conv = Conversation.rehydrate({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      telegramChatId: TelegramChatId.create('123'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:01.000Z'),
    });
    const conversations = {
      findByTelegramChatId: jest.fn().mockResolvedValue(conv),
      save: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
    };

    const inserted = Message.rehydrate({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      conversationId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      direction: 'IN',
      telegramUpdateId: 10,
      content: MessageContent.create('hola'),
      createdAt: new Date('2026-01-01T00:00:02.000Z'),
      updatedAt: new Date('2026-01-01T00:00:02.000Z'),
    });
    const messages = {
      saveFromTelegramUpdate: jest.fn().mockResolvedValue(inserted),
      save: jest.fn(),
      listByConversationId: jest.fn(),
    };

    const producer = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    const useCase = new SyncTelegramUpdatesUseCase(
      telegramClient as any,
      syncState as any,
      conversations as any,
      messages as any,
      producer as any,
    );

    // Act
    const result = await useCase.execute({ limit: 50, timeoutSeconds: 0 });

    // Assert
    expect(syncState.get).toHaveBeenCalledTimes(1);
    expect(telegramClient.getUpdates).toHaveBeenCalledWith({
      offset: 10,
      limit: 50,
      timeoutSeconds: 0,
    });
    expect(conversations.findByTelegramChatId).toHaveBeenCalledWith(
      TelegramChatId.create('123'),
    );
    expect(messages.saveFromTelegramUpdate).toHaveBeenCalledWith({
      conversationId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      direction: 'IN',
      content: 'hola',
      telegramUpdateId: 10,
    });
    expect(producer.send).toHaveBeenCalledTimes(1);
    expect(syncState.setLastUpdateId).toHaveBeenCalledWith(10);
    expect(result).toEqual({
      processedUpdates: 1,
      processedMessages: 1,
      lastUpdateIdBefore: 9,
      lastUpdateIdAfter: 10,
    });
  });

  it('is idempotent: when message repository returns undefined, it does not publish event', async () => {
    // Arrange
    const telegramClient = {
      getUpdates: jest.fn().mockResolvedValue([
        {
          updateId: 10,
          message: {
            messageId: 1,
            chatId: '123',
            text: 'hola',
            date: 111,
          },
        },
      ]),
      sendMessage: jest.fn(),
    };
    const syncState = {
      get: jest.fn().mockResolvedValue({ lastUpdateId: 9 }),
      setLastUpdateId: jest.fn().mockResolvedValue(undefined),
    };
    const conv = Conversation.rehydrate({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      telegramChatId: TelegramChatId.create('123'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:01.000Z'),
    });
    const conversations = {
      findByTelegramChatId: jest.fn().mockResolvedValue(conv),
      save: jest.fn(),
    };
    const messages = {
      saveFromTelegramUpdate: jest.fn().mockResolvedValue(undefined),
    };
    const producer = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    const useCase = new SyncTelegramUpdatesUseCase(
      telegramClient as any,
      syncState as any,
      conversations as any,
      messages as any,
      producer as any,
    );

    // Act
    const result = await useCase.execute();

    // Assert
    expect(producer.send).not.toHaveBeenCalled();
    expect(result.processedMessages).toBe(0);
    expect(syncState.setLastUpdateId).toHaveBeenCalledWith(10);
  });

  it('creates a conversation when chatId is new', async () => {
    // Arrange
    const telegramClient = {
      getUpdates: jest.fn().mockResolvedValue([
        {
          updateId: 10,
          message: {
            messageId: 1,
            chatId: '123',
            text: 'hola',
            date: 111,
          },
        },
      ]),
      sendMessage: jest.fn(),
    };
    const syncState = {
      get: jest.fn().mockResolvedValue({ lastUpdateId: 9 }),
      setLastUpdateId: jest.fn().mockResolvedValue(undefined),
    };

    const savedConv = Conversation.rehydrate({
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      telegramChatId: TelegramChatId.create('123'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:01.000Z'),
    });
    const conversations = {
      findByTelegramChatId: jest.fn().mockResolvedValue(undefined),
      save: jest.fn().mockResolvedValue(savedConv),
    };

    const inserted = Message.rehydrate({
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      conversationId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      direction: 'IN',
      telegramUpdateId: 10,
      content: MessageContent.create('hola'),
      createdAt: new Date('2026-01-01T00:00:02.000Z'),
      updatedAt: new Date('2026-01-01T00:00:02.000Z'),
    });
    const messages = {
      saveFromTelegramUpdate: jest.fn().mockResolvedValue(inserted),
    };
    const producer = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    const useCase = new SyncTelegramUpdatesUseCase(
      telegramClient as any,
      syncState as any,
      conversations as any,
      messages as any,
      producer as any,
    );

    // Act
    const result = await useCase.execute();

    // Assert
    expect(conversations.save).toHaveBeenCalledTimes(1);
    expect(messages.saveFromTelegramUpdate).toHaveBeenCalledWith({
      conversationId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      direction: 'IN',
      content: 'hola',
      telegramUpdateId: 10,
    });
    expect(result.processedMessages).toBe(1);
  });
});
