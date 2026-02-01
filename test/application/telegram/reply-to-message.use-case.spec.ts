import { ReplyToMessageUseCase } from '@src/application/use-cases/telegram/reply-to-message.use-case';

describe('ReplyToMessageUseCase', () => {
  it('sends a non-empty reply to telegram', async () => {
    // Arrange
    const telegramClient = {
      sendMessage: jest.fn().mockResolvedValue(undefined),
    };

    const useCase = new ReplyToMessageUseCase(telegramClient as any);

    // Act
    await useCase.execute({ chatId: '123', incomingText: 'hola' });

    // Assert
    expect(telegramClient.sendMessage).toHaveBeenCalledTimes(1);
    const call = (telegramClient.sendMessage as jest.Mock).mock.calls[0][0];
    expect(call.chatId).toBe('123');
    expect(typeof call.text).toBe('string');
    expect(call.text.trim().length).toBeGreaterThan(0);
  });
});
