import { DomainError } from '@src/domain/errors/domain.error';

export class InvalidTelegramChatIdError extends DomainError {
  constructor(chatId: string) {
    super('Invalid Telegram chat id.', 'INVALID_TELEGRAM_CHAT_ID', { chatId });
  }
}

/**
 * Telegram chat_id can be a positive int (private) or negative (groups/supergroups).
 * We keep it as string in the domain to avoid JS number precision issues.
 */
export class TelegramChatId {
  private constructor(private readonly value: string) {}

  static create(raw: string | number): TelegramChatId {
    const normalized = String(raw ?? '').trim();
    // Accept only integer-like strings (including leading '-')
    if (!/^-?\d+$/.test(normalized)) {
      throw new InvalidTelegramChatIdError(String(raw));
    }
    return new TelegramChatId(normalized);
  }

  toString(): string {
    return this.value;
  }
}
