import type { Repository } from 'typeorm';

import { TypeOrmTelegramSyncStateRepository } from '@src/infrastructure/adapters/repositories/telegram-sync-state/typeorm-telegram-sync-state.repository';
import { TelegramSyncStatePersistence } from '@src/infrastructure/adapters/repositories/telegram-sync-state/telegram-sync-state.persistence';

describe('TypeOrmTelegramSyncStateRepository', () => {
  it('get: returns 0 when singleton row does not exist', async () => {
    // Arrange
    const ormRepo = {
      findOne: jest.fn().mockResolvedValue(undefined),
    } as unknown as Pick<Repository<TelegramSyncStatePersistence>, 'findOne'>;
    const repo = new TypeOrmTelegramSyncStateRepository(ormRepo as any);

    // Act
    const result = await repo.get();

    // Assert
    expect(ormRepo.findOne).toHaveBeenCalledWith({ where: { id: 'bot' } });
    expect(result).toEqual({ lastUpdateId: 0 });
  });

  it('get: reads lastUpdateId from persistence row and converts it to number', async () => {
    // Arrange
    const row = new TelegramSyncStatePersistence();
    row.id = 'bot';
    row.lastUpdateId = '42';
    row.createdAt = new Date('2026-01-01T00:00:00.000Z');
    row.updatedAt = new Date('2026-01-01T00:00:01.000Z');

    const ormRepo = {
      findOne: jest.fn().mockResolvedValue(row),
    } as unknown as Pick<Repository<TelegramSyncStatePersistence>, 'findOne'>;
    const repo = new TypeOrmTelegramSyncStateRepository(ormRepo as any);

    // Act
    const result = await repo.get();

    // Assert
    expect(ormRepo.findOne).toHaveBeenCalledWith({ where: { id: 'bot' } });
    expect(result).toEqual({ lastUpdateId: 42 });
  });

  it('setLastUpdateId: upserts singleton row as string', async () => {
    // Arrange
    const ormRepo = {
      save: jest.fn().mockResolvedValue(undefined),
    } as unknown as Pick<Repository<TelegramSyncStatePersistence>, 'save'>;
    const repo = new TypeOrmTelegramSyncStateRepository(ormRepo as any);

    // Act
    await repo.setLastUpdateId(123);

    // Assert
    expect(ormRepo.save).toHaveBeenCalledWith({
      id: 'bot',
      lastUpdateId: '123',
    });
  });
});
