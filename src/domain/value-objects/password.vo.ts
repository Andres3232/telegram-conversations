import { PasswordTooWeakError } from '@src/domain/errors/auth.errors';

export class Password {
  private constructor(private readonly value: string) {}

  static create(raw: string): Password {
    const normalized = (raw ?? '').trim();
    if (!normalized || normalized.length < 8) {
      throw new PasswordTooWeakError();
    }
    return new Password(normalized);
  }

  toString(): string {
    return this.value;
  }

}
