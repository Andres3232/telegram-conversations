import { InvalidEmailError } from '@src/domain/errors/auth.errors';

export class Email {
  private constructor(private readonly value: string) {}

  static create(raw: string): Email {
    const normalized = (raw ?? '').trim().toLowerCase();
    if (!normalized || !Email.EMAIL_REGEX.test(normalized)) {
      throw new InvalidEmailError(raw);
    }
    return new Email(normalized);
  }

  toString(): string {
    return this.value;
  }

  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
}
