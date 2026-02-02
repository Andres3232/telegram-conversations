
import { MessageReceivedHandler } from '@src/infrastructure/kafka/consumers/handlers/message-received.handler';

describe('MessageReceivedHandler', () => {
	it('ignores malformed envelopes without telegramChatId', async () => {
		// Arrange
		const replyToMessageUseCase = {
			execute: jest.fn(),
		};
		const handler = new MessageReceivedHandler(replyToMessageUseCase as any);

		// Act
		await handler.handle({
			eventName: 'message.received',
			payload: { telegramChatId: '' as any, text: 'hola' },
		} as any);

		// Assert
		expect(replyToMessageUseCase.execute).not.toHaveBeenCalled();
	});

	it('calls ReplyToMessageUseCase with chatId and incomingText (defaulting to empty string)', async () => {
		// Arrange
		const replyToMessageUseCase = {
			execute: jest.fn().mockResolvedValue(undefined),
		};
		const handler = new MessageReceivedHandler(replyToMessageUseCase as any);

		// Act
		await handler.handle({
			eventName: 'message.received',
			payload: { telegramChatId: '123' },
		} as any);

		// Assert
		expect(replyToMessageUseCase.execute).toHaveBeenCalledWith({
			chatId: '123',
			incomingText: '',
		});
	});
});
