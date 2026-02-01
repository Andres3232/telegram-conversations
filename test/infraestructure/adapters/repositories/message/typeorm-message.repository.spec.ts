import type { Repository } from 'typeorm';

import { TypeOrmMessageRepository } from '@src/infrastructure/adapters/repositories/message/typeorm-message.repository';
import { MessagePersistence } from '@src/infrastructure/adapters/repositories/message/message.persistence';
import { Message } from '@src/domain/model/message.entity';
import { MessageContent } from '@src/domain/value-objects/message-content.vo';

describe('TypeOrmMessageRepository', () => {
	it('save: maps domain -> persistence and back to domain', async () => {
		// Arrange
		const domain = Message.rehydrate({
			id: '11111111-1111-1111-1111-111111111111',
			conversationId: '22222222-2222-2222-2222-222222222222',
			direction: 'OUT',
			content: MessageContent.create('hola'),
			createdAt: new Date('2026-01-01T00:00:00.000Z'),
			updatedAt: new Date('2026-01-01T00:00:01.000Z'),
		});

		const savedRow = new MessagePersistence();
		savedRow.id = domain.id;
		savedRow.conversationId = domain.conversationId;
		savedRow.telegramUpdateId = undefined;
		savedRow.direction = 'OUT';
		savedRow.content = 'hola';
		savedRow.createdAt = domain.createdAt;
		savedRow.updatedAt = domain.updatedAt;

		const ormRepo = {
			save: jest.fn().mockResolvedValue(savedRow),
		} as unknown as Pick<Repository<MessagePersistence>, 'save'>;
		const repo = new TypeOrmMessageRepository(ormRepo as any);

		// Act
		const result = await repo.save(domain);

		// Assert
		expect(ormRepo.save).toHaveBeenCalledTimes(1);
		const savedArg = (ormRepo.save as jest.Mock).mock.calls[0][0] as MessagePersistence;
		expect(savedArg).toBeInstanceOf(MessagePersistence);
		expect(savedArg.id).toBe('11111111-1111-1111-1111-111111111111');
		expect(savedArg.conversationId).toBe('22222222-2222-2222-2222-222222222222');
		expect(savedArg.telegramUpdateId).toBeUndefined();
		expect(savedArg.direction).toBe('OUT');
		expect(savedArg.content).toBe('hola');

		expect(result.id).toBe('11111111-1111-1111-1111-111111111111');
		expect(result.conversationId).toBe('22222222-2222-2222-2222-222222222222');
		expect(result.telegramUpdateId).toBeUndefined();
		expect(result.direction).toBe('OUT');
		expect(result.content.toString()).toBe('hola');
	});

	it('saveFromTelegramUpdate: inserts then loads by id and returns domain', async () => {
		// Arrange
		const insertedRow = new MessagePersistence();
		insertedRow.id = '33333333-3333-3333-3333-333333333333';
		insertedRow.conversationId = '44444444-4444-4444-4444-444444444444';
		insertedRow.telegramUpdateId = '10';
		insertedRow.direction = 'IN';
		insertedRow.content = 'hola';
		insertedRow.createdAt = new Date('2026-01-01T00:00:00.000Z');
		insertedRow.updatedAt = new Date('2026-01-01T00:00:00.000Z');

		let lastInsertedId: string | undefined;

		const ormRepo = {
			insert: jest.fn().mockImplementation(async (p: MessagePersistence) => {
				lastInsertedId = p.id;
				return undefined;
			}),
			findOne: jest.fn().mockImplementation(async ({ where: { id } }: any) => {
				return id === lastInsertedId ? insertedRow : undefined;
			}),
		} as unknown as Pick<Repository<MessagePersistence>, 'insert' | 'findOne'>;
		const repo = new TypeOrmMessageRepository(ormRepo as any);

		// Act
		const result = await repo.saveFromTelegramUpdate({
			conversationId: '44444444-4444-4444-4444-444444444444',
			direction: 'IN',
			content: ' hola ',
			telegramUpdateId: 10,
		});

		// Assert
		expect(ormRepo.insert).toHaveBeenCalledTimes(1);
		const insertArg = (ormRepo.insert as jest.Mock).mock.calls[0][0] as MessagePersistence;
		expect(insertArg).toBeInstanceOf(MessagePersistence);
		expect(lastInsertedId).toBeDefined();
		expect(insertArg.conversationId).toBe('44444444-4444-4444-4444-444444444444');
		expect(insertArg.direction).toBe('IN');
		expect(insertArg.content).toBe('hola');
		expect(insertArg.telegramUpdateId).toBe('10');

		expect(ormRepo.findOne).toHaveBeenCalledTimes(1);
		expect(result).toBeDefined();
		expect(result?.conversationId).toBe('44444444-4444-4444-4444-444444444444');
		expect(result?.direction).toBe('IN');
		expect(result?.telegramUpdateId).toBe(10);
		expect(result?.content.toString()).toBe('hola');
	});

	it('saveFromTelegramUpdate: returns undefined on unique violation (23505)', async () => {
		// Arrange
		const ormRepo = {
			insert: jest.fn().mockRejectedValue({ code: '23505' }),
			findOne: jest.fn(),
		} as unknown as Pick<Repository<MessagePersistence>, 'insert' | 'findOne'>;
		const repo = new TypeOrmMessageRepository(ormRepo as any);

		// Act
		const result = await repo.saveFromTelegramUpdate({
			conversationId: '55555555-5555-5555-5555-555555555555',
			direction: 'IN',
			content: 'hola',
			telegramUpdateId: 10,
		});

		// Assert
		expect(result).toBeUndefined();
		expect(ormRepo.findOne).not.toHaveBeenCalled();
	});

	it('listByConversationId: calls TypeORM with pagination + ordering and maps rows to domain', async () => {
		// Arrange
		const r1 = new MessagePersistence();
		r1.id = '66666666-6666-6666-6666-666666666666';
		r1.conversationId = '77777777-7777-7777-7777-777777777777';
		r1.telegramUpdateId = '1';
		r1.direction = 'IN';
		r1.content = 'a';
		r1.createdAt = new Date('2026-01-01T00:00:01.000Z');
		r1.updatedAt = new Date('2026-01-01T00:00:01.000Z');

		const r2 = new MessagePersistence();
		r2.id = '88888888-8888-8888-8888-888888888888';
		r2.conversationId = '77777777-7777-7777-7777-777777777777';
		r2.telegramUpdateId = undefined;
		r2.direction = 'OUT';
		r2.content = 'b';
		r2.createdAt = new Date('2026-01-01T00:00:02.000Z');
		r2.updatedAt = new Date('2026-01-01T00:00:02.000Z');

		const ormRepo = {
			find: jest.fn().mockResolvedValue([r1, r2]),
		} as unknown as Pick<Repository<MessagePersistence>, 'find'>;
		const repo = new TypeOrmMessageRepository(ormRepo as any);

		// Act
		const result = await repo.listByConversationId(
			'77777777-7777-7777-7777-777777777777',
			10,
			5,
		);

		// Assert
		expect(ormRepo.find).toHaveBeenCalledWith({
			where: { conversationId: '77777777-7777-7777-7777-777777777777' },
			order: { createdAt: 'ASC' },
			take: 10,
			skip: 5,
		});
		expect(result).toHaveLength(2);
		expect(result[0].id).toBe('66666666-6666-6666-6666-666666666666');
		expect(result[0].telegramUpdateId).toBe(1);
		expect(result[1].id).toBe('88888888-8888-8888-8888-888888888888');
		expect(result[1].telegramUpdateId).toBeUndefined();
	});
});
