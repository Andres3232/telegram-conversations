export const TELEGRAM_CLIENT = 'TelegramClient';

export interface TelegramGetUpdatesParams {
  offset?: number;
  limit?: number;
  timeoutSeconds?: number;
}

export interface TelegramUpdate {
  updateId: number;
  message?: {
    messageId: number;
    chatId: string;
    text?: string;
    date: number;
  };
}

export interface TelegramClient {
  getUpdates(params: TelegramGetUpdatesParams): Promise<TelegramUpdate[]>;
  sendMessage(params: { chatId: string; text: string }): Promise<void>;
}
