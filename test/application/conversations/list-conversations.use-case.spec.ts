import { ListConversationsUseCase } from '@src/application/use-cases/conversations/list-conversations.use-case';
import { Conversation } from '@src/domain/model/conversation.entity';
import { TelegramChatId } from '@src/domain/value-objects/telegram-chat-id.vo';

describe('ListConversationsUseCase', () => {
  it('normalizes limit/offset and maps entities to DTO', async () => {
    // Arrange
    const rows = [
      Conversation.rehydrate({
        id: '33333333-3333-3333-3333-333333333333',
        telegramChatId: TelegramChatId.create('123'),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:01.000Z'),
      }),
      Conversation.rehydrate({
        id: '44444444-4444-4444-4444-444444444444',
        telegramChatId: TelegramChatId.create('-999'),
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:01.000Z'),
      }),
    ];

    const repo = {
      list: jest.fn().mockResolvedValue(rows),
    };

    const useCase = new ListConversationsUseCase(repo as any);

    // Act
    const result = await useCase.execute({ limit: 999, offset: -10 });

    // Assert
    expect(repo.list).toHaveBeenCalledWith(100, 0);
    expect(result).toEqual({
      items: [
        {
          id: '33333333-3333-3333-3333-333333333333',
          telegramChatId: '123',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:01.000Z',
        },
        {
          id: '44444444-4444-4444-4444-444444444444',
          telegramChatId: '-999',
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:01.000Z',
        },
      ],
      limit: 100,
      offset: 0,
    });
  });
});
