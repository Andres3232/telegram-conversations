
import { TelegramKafkaConsumerService } from '@src/infrastructure/kafka/consumers/telegram-kafka-consumer.service';
import { ConfigKeys } from '@src/config/config-keys';
import { Topics } from '@src/domain/events/shared/topics';
import { EventNames } from '@src/domain/events/shared/event-names.enum';

describe('TelegramKafkaConsumerService', () => {
	it('does not start consumer when disabled via config', async () => {
		// Arrange
		const config = {
			get: jest.fn((key: string) => {
				if (key === ConfigKeys.KAFKA_CONSUMER_ENABLED) return 'false';
				return undefined;
			}),
		};
		const logger = {
			info: jest.fn(),
			warn: jest.fn(),
			debug: jest.fn(),
		};
		const messageReceivedHandler = { handle: jest.fn() };
		const kafkaFactory = { createClient: jest.fn() };

		const service = new TelegramKafkaConsumerService(
			config as any,
			logger as any,
			messageReceivedHandler as any,
			kafkaFactory as any,
		);

		// Act
		await service.onModuleInit();

		// Assert
		expect(logger.info).toHaveBeenCalledWith('kafka.consumer.disabled');
		expect(kafkaFactory.createClient).not.toHaveBeenCalled();
	});

	it('does not start consumer when brokers are empty', async () => {
		// Arrange
		const config = {
			get: jest.fn((key: string) => {
				if (key === ConfigKeys.KAFKA_CONSUMER_ENABLED) return 'true';
				if (key === ConfigKeys.KAFKA_BROKERS) return '   ';
				return undefined;
			}),
		};
		const logger = {
			info: jest.fn(),
			warn: jest.fn(),
			debug: jest.fn(),
		};
		const messageReceivedHandler = { handle: jest.fn() };
		const kafkaFactory = { createClient: jest.fn() };

		const service = new TelegramKafkaConsumerService(
			config as any,
			logger as any,
			messageReceivedHandler as any,
			kafkaFactory as any,
		);

		// Act
		await service.onModuleInit();

		// Assert
		expect(logger.warn).toHaveBeenCalledWith('kafka.consumer.no_brokers');
		expect(kafkaFactory.createClient).not.toHaveBeenCalled();
	});

	it('starts consumer and routes MESSAGE_RECEIVED to handler; ignores invalid JSON and unknown events', async () => {
		// Arrange
		const config = {
			get: jest.fn((key: string) => {
				if (key === ConfigKeys.KAFKA_CONSUMER_ENABLED) return 'true';
				if (key === ConfigKeys.KAFKA_BROKERS) return 'localhost:9094';
				if (key === ConfigKeys.KAFKA_CONSUMER_GROUP_ID)
					return 'test-group';
				return undefined;
			}),
		};
		const logger = {
			info: jest.fn(),
			warn: jest.fn(),
			debug: jest.fn(),
		};
		const messageReceivedHandler = {
			handle: jest.fn().mockResolvedValue(undefined),
		};

		let eachMessageFn: any;
		const consumer = {
			connect: jest.fn().mockResolvedValue(undefined),
			subscribe: jest.fn().mockResolvedValue(undefined),
			run: jest.fn().mockImplementation(async ({ eachMessage }: any) => {
				eachMessageFn = eachMessage;
				return undefined;
			}),
			disconnect: jest.fn().mockResolvedValue(undefined),
		};
		const kafkaFactory = {
			createClient: jest.fn().mockReturnValue({
				consumer: jest.fn().mockReturnValue(consumer),
			}),
		};

		const service = new TelegramKafkaConsumerService(
			config as any,
			logger as any,
			messageReceivedHandler as any,
			kafkaFactory as any,
		);

		// Act
		await service.onModuleInit();
		// simulate messages
		await eachMessageFn({
			topic: Topics.TELEGRAM,
			partition: 0,
			message: { offset: '1', value: Buffer.from('{not-json') },
		});
		await eachMessageFn({
			topic: Topics.TELEGRAM,
			partition: 0,
			message: {
				offset: '2',
				value: Buffer.from(
					JSON.stringify({ eventName: 'something.else', payload: {} }),
				),
			},
		});
		await eachMessageFn({
			topic: Topics.TELEGRAM,
			partition: 0,
			message: {
				offset: '3',
				value: Buffer.from(
					JSON.stringify({
						eventName: EventNames.MESSAGE_RECEIVED,
						payload: { telegramChatId: '123', text: 'hola' },
					}),
				),
			},
		});

		// Assert
		expect(kafkaFactory.createClient).toHaveBeenCalledWith('consumer');
		expect(consumer.connect).toHaveBeenCalledTimes(1);
		expect(consumer.subscribe).toHaveBeenCalledWith({
			topic: Topics.TELEGRAM,
			fromBeginning: false,
		});
		expect(logger.warn).toHaveBeenCalledWith(
			'kafka.consumer.invalid_json',
			expect.objectContaining({
				topic: Topics.TELEGRAM,
				partition: 0,
				offset: '1',
			}),
		);
		expect(logger.debug).toHaveBeenCalledWith(
			'kafka.consumer.unknown_event',
			expect.objectContaining({
				eventName: 'something.else',
				offset: '2',
			}),
		);
		expect(messageReceivedHandler.handle).toHaveBeenCalledWith(
			expect.objectContaining({
				eventName: EventNames.MESSAGE_RECEIVED,
				payload: { telegramChatId: '123', text: 'hola' },
			}),
		);
		expect(logger.info).toHaveBeenCalledWith('kafka.consumer.started', {
			topic: Topics.TELEGRAM,
			groupId: 'test-group',
		});

		await service.onModuleDestroy();
		expect(consumer.disconnect).toHaveBeenCalledTimes(1);
	});
});
