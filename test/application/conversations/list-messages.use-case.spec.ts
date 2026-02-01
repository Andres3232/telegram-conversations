import { ListMessagesUseCase } from '@src/application/use-cases/conversations/list-messages.use-case';
import { ConversationNotFoundError } from '@src/domain/errors/conversation.errors';
import { Conversation } from '@src/domain/model/conversation.entity';
import { Message } from '@src/domain/model/message.entity';
import { TelegramChatId } from '@src/domain/value-objects/telegram-chat-id.vo';
import { MessageContent } from '@src/domain/value-objects/message-content.vo';

describe('ListMessagesUseCase', () => {
  it('throws ConversationNotFoundError when conversation does not exist', async () => {
    // Arrange
    const conversations = {
      findById: jest.fn().mockResolvedValue(undefined),
    };
    const messages = {
      listByConversationId: jest.fn(),
    };
    const useCase = new ListMessagesUseCase(
      conversations as any,
      messages as any,
    );

    // Act + Assert
    await expect(
      useCase.execute({ conversationId: 'missing' }),
    ).rejects.toBeInstanceOf(ConversationNotFoundError);
    expect(messages.listByConversationId).not.toHaveBeenCalled();
  });

  it('returns messages for a conversation, normalizing limit/offset', async () => {
    // Arrange
    const conv = Conversation.rehydrate({
      id: '55555555-5555-5555-5555-555555555555',
      telegramChatId: TelegramChatId.create('123'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:01.000Z'),
    });
    const rows = [
      Message.rehydrate({
        id: '66666666-6666-6666-6666-666666666666',
        conversationId: '55555555-5555-5555-5555-555555555555',
        direction: 'IN',
        content: MessageContent.create('hola'),
        createdAt: new Date('2026-01-01T00:00:02.000Z'),
        updatedAt: new Date('2026-01-01T00:00:02.000Z'),
      }),
      Message.rehydrate({
        id: '77777777-7777-7777-7777-777777777777',
        conversationId: '55555555-5555-5555-5555-555555555555',
        direction: 'OUT',
        content: MessageContent.create('chau'),
        createdAt: new Date('2026-01-01T00:00:03.000Z'),
        updatedAt: new Date('2026-01-01T00:00:03.000Z'),
      }),
    ];

    const conversations = {
      findById: jest.fn().mockResolvedValue(conv),
    };
    const messages = {
      listByConversationId: jest.fn().mockResolvedValue(rows),
    };
    const useCase = new ListMessagesUseCase(
      conversations as any,
      messages as any,
    );

    // Act
    const result = await useCase.execute({
      conversationId: '55555555-5555-5555-5555-555555555555',
      limit: 999,
      offset: -1,
    });

    // Assert
    expect(messages.listByConversationId).toHaveBeenCalledWith(
      '55555555-5555-5555-5555-555555555555',
      200,
      0,
    );
    expect(result).toEqual({
      items: [
        {
          id: '66666666-6666-6666-6666-666666666666',
          direction: 'IN',
          content: 'hola',
          createdAt: '2026-01-01T00:00:02.000Z',
        },
        {
          id: '77777777-7777-7777-7777-777777777777',
          direction: 'OUT',
          content: 'chau',
          createdAt: '2026-01-01T00:00:03.000Z',
        },
      ],
      limit: 200,
      offset: 0,
    });
  });
});
