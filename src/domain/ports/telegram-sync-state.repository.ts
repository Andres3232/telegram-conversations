export const TELEGRAM_SYNC_STATE_REPOSITORY = 'TelegramSyncStateRepository';

export interface TelegramSyncState {
  lastUpdateId: number;
}

export interface TelegramSyncStateRepository {
  get(): Promise<TelegramSyncState>;
  setLastUpdateId(lastUpdateId: number): Promise<void>;
}
