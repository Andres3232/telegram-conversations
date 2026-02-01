import { Inject, Injectable } from '@nestjs/common';
import {
  TelegramClient,
  TelegramGetUpdatesParams,
  TelegramUpdate,
} from '@src/domain/ports/telegram.client';
import {
  CONFIGURATION_SERVICE,
  ConfigurationService,
} from '@src/domain/ports/configuration.service';
import { ConfigKeys } from '@src/config/config-keys';

interface TelegramApiResponse<T> {
  ok: boolean;
  result: T;
  description?: string;
}

@Injectable()
export class TelegramHttpClient implements TelegramClient {
  constructor(
    @Inject(CONFIGURATION_SERVICE)
    private readonly config: ConfigurationService,
  ) {}

  private get baseUrl(): string {
    const token = this.config.get(ConfigKeys.TELEGRAM_BOT_TOKEN);
    return `https://api.telegram.org/bot${token}`;
  }

  async getUpdates(
    params: TelegramGetUpdatesParams,
  ): Promise<TelegramUpdate[]> {
    const url = new URL(`${this.baseUrl}/getUpdates`);
    if (params.offset !== undefined)
      url.searchParams.set('offset', String(params.offset));
    if (params.limit !== undefined)
      url.searchParams.set('limit', String(params.limit));
    if (params.timeoutSeconds !== undefined)
      url.searchParams.set('timeout', String(params.timeoutSeconds));

    const res = await fetch(url.toString(), { method: 'GET' });
    if (!res.ok) {
      throw new Error(
        `Telegram getUpdates failed: ${res.status} ${res.statusText}`,
      );
    }

    const payload = (await res.json()) as TelegramApiResponse<any[]>;
    if (!payload.ok) {
      throw new Error(
        `Telegram getUpdates error: ${payload.description ?? 'unknown error'}`,
      );
    }

    return (payload.result ?? []).map((u) => ({
      updateId: u.update_id,
      message: u.message
        ? {
            messageId: u.message.message_id,
            chatId: String(u.message.chat?.id),
            text: u.message.text,
            date: u.message.date,
          }
        : undefined,
    }));
  }

  async sendMessage(params: { chatId: string; text: string }): Promise<void> {
    const res = await fetch(`${this.baseUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: params.chatId, text: params.text }),
    });

    if (!res.ok) {
      throw new Error(
        `Telegram sendMessage failed: ${res.status} ${res.statusText}`,
      );
    }

    const payload = (await res.json()) as TelegramApiResponse<unknown>;
    if (!payload.ok) {
      throw new Error(
        `Telegram sendMessage error: ${payload.description ?? 'unknown error'}`,
      );
    }
  }
}
