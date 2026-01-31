import { DomainError } from '@src/domain/errors/domain.error';

export class InvalidMessageContentError extends DomainError {
  constructor(reason: string) {
    super('Invalid message content.', 'INVALID_MESSAGE_CONTENT', { reason });
  }
}

export class MessageContent {
  private constructor(private readonly value: string) {}

  static create(raw: string): MessageContent {
    const normalized = (raw ?? '').trim();
    if (!normalized) {
      throw new InvalidMessageContentError('empty');
    }
    if (normalized.length > 4096) {
      throw new InvalidMessageContentError('too_long');
    }
    return new MessageContent(normalized);
  }

  toString(): string {
    return this.value;
  }
}
