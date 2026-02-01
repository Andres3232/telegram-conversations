import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TelegramSyncState,
  TelegramSyncStateRepository,
} from '@src/domain/ports/telegram-sync-state.repository';
import { TelegramSyncStatePersistence } from './telegram-sync-state.persistence';

const SINGLETON_ID = 'bot';

@Injectable()
export class TypeOrmTelegramSyncStateRepository implements TelegramSyncStateRepository {
  constructor(
    @InjectRepository(TelegramSyncStatePersistence)
    private readonly repo: Repository<TelegramSyncStatePersistence>,
  ) {}

  async get(): Promise<TelegramSyncState> {
    const row = await this.repo.findOne({ where: { id: SINGLETON_ID } });
    return { lastUpdateId: row ? Number(row.lastUpdateId) : 0 };
  }

  async setLastUpdateId(lastUpdateId: number): Promise<void> {
    await this.repo.save({
      id: SINGLETON_ID,
      lastUpdateId: String(lastUpdateId),
    });
  }
}
