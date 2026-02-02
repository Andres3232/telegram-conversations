import type { Repository } from 'typeorm';

import { TypeOrmConversationRepository } from '@src/infrastructure/adapters/repositories/conversation/typeorm-conversation.repository';
import { ConversationPersistence } from '@src/infrastructure/adapters/repositories/conversation/conversation.persistence';
import { Conversation } from '@src/domain/model/conversation.entity';
import { TelegramChatId } from '@src/domain/value-objects/telegram-chat-id.vo';

describe('TypeOrmConversationRepository', () => {
  it('findById: delegates to TypeORM and maps persistence -> domain', async () => {
    // Arrange
    const row = new ConversationPersistence();
    row.id = '11111111-1111-1111-1111-111111111111';
    row.telegramChatId = '123';
    row.createdAt = new Date('2026-01-01T00:00:00.000Z');
    row.updatedAt = new Date('2026-01-01T00:00:01.000Z');

    const ormRepo = {
      findOne: jest.fn().mockResolvedValue(row),
    } as unknown as Pick<Repository<ConversationPersistence>, 'findOne'>;

    const repo = new TypeOrmConversationRepository(ormRepo as any);

    // Act
    const result = await repo.findById('11111111-1111-1111-1111-111111111111');

    // Assert
    expect(ormRepo.findOne).toHaveBeenCalledWith({
      where: { id: '11111111-1111-1111-1111-111111111111' },
    });
    expect(result).toBeDefined();
    expect(result?.id).toBe('11111111-1111-1111-1111-111111111111');
    expect(result?.telegramChatId.toString()).toBe('123');
  });

  it('findByTelegramChatId: delegates to TypeORM using chatId string value', async () => {
    // Arrange
    const row = new ConversationPersistence();
    row.id = '22222222-2222-2222-2222-222222222222';
    row.telegramChatId = '999';
    row.createdAt = new Date('2026-01-01T00:00:00.000Z');
    row.updatedAt = new Date('2026-01-01T00:00:01.000Z');

    const ormRepo = {
      findOne: jest.fn().mockResolvedValue(row),
    } as unknown as Pick<Repository<ConversationPersistence>, 'findOne'>;
    const repo = new TypeOrmConversationRepository(ormRepo as any);

    // Act
    const result = await repo.findByTelegramChatId(
      TelegramChatId.create('999'),
    );

    // Assert
    expect(ormRepo.findOne).toHaveBeenCalledWith({
      where: { telegramChatId: '999' },
    });
    expect(result?.id).toBe('22222222-2222-2222-2222-222222222222');
    expect(result?.telegramChatId.toString()).toBe('999');
  });

  it('save: maps domain -> persistence and back to domain', async () => {
    // Arrange
    const domain = Conversation.rehydrate({
      id: '33333333-3333-3333-3333-333333333333',
      telegramChatId: TelegramChatId.create('555'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:01.000Z'),
    });

    const savedRow = new ConversationPersistence();
    savedRow.id = domain.id;
    savedRow.telegramChatId = '555';
    savedRow.createdAt = domain.createdAt;
    savedRow.updatedAt = domain.updatedAt;

    const ormRepo = {
      save: jest.fn().mockResolvedValue(savedRow),
    } as unknown as Pick<Repository<ConversationPersistence>, 'save'>;
    const repo = new TypeOrmConversationRepository(ormRepo as any);

    // Act
    const result = await repo.save(domain);

    // Assert
    expect(ormRepo.save).toHaveBeenCalledTimes(1);
    const savedArg = (ormRepo.save as jest.Mock).mock
      .calls[0][0] as ConversationPersistence;
    expect(savedArg).toBeInstanceOf(ConversationPersistence);
    expect(savedArg.id).toBe('33333333-3333-3333-3333-333333333333');
    expect(savedArg.telegramChatId).toBe('555');

    expect(result.id).toBe('33333333-3333-3333-3333-333333333333');
    expect(result.telegramChatId.toString()).toBe('555');
  });

  it('list: calls TypeORM with pagination + ordering and maps rows to domain', async () => {
    // Arrange
    const r1 = new ConversationPersistence();
    r1.id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    r1.telegramChatId = '1';
    r1.createdAt = new Date('2026-01-01T00:00:00.000Z');
    r1.updatedAt = new Date('2026-01-01T00:00:01.000Z');

    const r2 = new ConversationPersistence();
    r2.id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    r2.telegramChatId = '2';
    r2.createdAt = new Date('2026-01-01T00:00:00.000Z');
    r2.updatedAt = new Date('2026-01-01T00:00:02.000Z');

    const ormRepo = {
      find: jest.fn().mockResolvedValue([r2, r1]),
    } as unknown as Pick<Repository<ConversationPersistence>, 'find'>;
    const repo = new TypeOrmConversationRepository(ormRepo as any);

    // Act
    const result = await repo.list(10, 5);

    // Assert
    expect(ormRepo.find).toHaveBeenCalledWith({
      order: { updatedAt: 'DESC' },
      take: 10,
      skip: 5,
    });
    expect(result).toHaveLength(2);
    expect(result[0].telegramChatId.toString()).toBe('2');
    expect(result[1].telegramChatId.toString()).toBe('1');
  });
});
