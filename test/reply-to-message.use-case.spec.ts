import { ReplyToMessageUseCase } from '@src/application/use-cases/telegram/reply-to-message.use-case';

describe('ReplyToMessageUseCase', () => {
  it('sends a reply via TelegramClient', async () => {
    const telegram = {
      getUpdates: jest.fn(),
      sendMessage: jest.fn().mockResolvedValue(undefined),
    };

    const uc = new ReplyToMessageUseCase(telegram as any);

    await uc.execute({ chatId: '123', incomingText: 'hola' });

    expect(telegram.sendMessage).toHaveBeenCalledTimes(1);
    expect(telegram.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ chatId: '123' }),
    );

    const sentText = (telegram.sendMessage as jest.Mock).mock.calls[0][0].text;
    expect(typeof sentText).toBe('string');
    expect(sentText.length).toBeGreaterThan(0);
  });
});
