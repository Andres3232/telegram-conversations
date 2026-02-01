import { SendMessageUseCase } from '@src/application/use-cases/conversations/send-message.use-case';
import {
  ConversationMessageTextRequiredError,
  ConversationNotFoundError,
} from '@src/domain/errors/conversation.errors';
import { Conversation } from '@src/domain/model/conversation.entity';
import { TelegramChatId } from '@src/domain/value-objects/telegram-chat-id.vo';

describe('SendMessageUseCase', () => {
  it('throws ConversationNotFoundError when conversation does not exist', async () => {
    // Arrange
    const conversations = {
      findById: jest.fn().mockResolvedValue(undefined),
    };
    const messages = {
      save: jest.fn(),
    };
    const telegramClient = {
      sendMessage: jest.fn(),
    };

    const useCase = new SendMessageUseCase(
      conversations as any,
      messages as any,
      telegramClient as any,
    );

    // Act + Assert
    await expect(
      useCase.execute({ conversationId: 'missing', text: 'hi' }),
    ).rejects.toBeInstanceOf(ConversationNotFoundError);

    expect(telegramClient.sendMessage).not.toHaveBeenCalled();
    expect(messages.save).not.toHaveBeenCalled();
  });

  it('throws ConversationMessageTextRequiredError when text is blank', async () => {
    // Arrange
    const conv = Conversation.rehydrate({
      id: '88888888-8888-8888-8888-888888888888',
      telegramChatId: TelegramChatId.create('123'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:01.000Z'),
    });
    const conversations = {
      findById: jest.fn().mockResolvedValue(conv),
    };
    const messages = {
      save: jest.fn(),
    };
    const telegramClient = {
      sendMessage: jest.fn(),
    };

    const useCase = new SendMessageUseCase(
      conversations as any,
      messages as any,
      telegramClient as any,
    );

    // Act + Assert
    await expect(
      useCase.execute({
        conversationId: '88888888-8888-8888-8888-888888888888',
        text: '   ',
      }),
    ).rejects.toBeInstanceOf(ConversationMessageTextRequiredError);

    expect(telegramClient.sendMessage).not.toHaveBeenCalled();
    expect(messages.save).not.toHaveBeenCalled();
  });

  it('sends telegram message and persists OUT message', async () => {
    // Arrange
    const conv = Conversation.rehydrate({
      id: '88888888-8888-8888-8888-888888888888',
      telegramChatId: TelegramChatId.create('123'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:01.000Z'),
    });
    const conversations = {
      findById: jest.fn().mockResolvedValue(conv),
    };
    const messages = {
      save: jest.fn(async (m: any) => ({
        ...m,
        id: '99999999-9999-9999-9999-999999999999',
      })),
    };
    const telegramClient = {
      sendMessage: jest.fn().mockResolvedValue(undefined),
    };

    const useCase = new SendMessageUseCase(
      conversations as any,
      messages as any,
      telegramClient as any,
    );

    // Act
    const result = await useCase.execute({
      conversationId: '88888888-8888-8888-8888-888888888888',
      text: ' hola ',
    });

    // Assert
    expect(telegramClient.sendMessage).toHaveBeenCalledWith({
      chatId: '123',
      text: 'hola',
    });
    expect(messages.save).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: '99999999-9999-9999-9999-999999999999' });

    const savedArg = (messages.save as jest.Mock).mock.calls[0][0];
    expect(savedArg.conversationId).toBe(
      '88888888-8888-8888-8888-888888888888',
    );
    expect(savedArg.direction).toBe('OUT');
    expect(savedArg.content.toString()).toBe('hola');
    expect(savedArg.telegramUpdateId).toBeUndefined();
  });
});
