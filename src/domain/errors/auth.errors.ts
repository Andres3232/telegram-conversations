import { DomainError } from '@src/domain/errors/domain.error';

export class InvalidEmailError extends DomainError {
  constructor(email: string) {
    super(`Invalid email: ${email}`, 'INVALID_EMAIL', { email });
  }
}

export class PasswordTooWeakError extends DomainError {
  constructor() {
    super('Password must be at least 8 characters.', 'PASSWORD_TOO_WEAK');
  }
}

export class UserAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super('User already exists.', 'USER_ALREADY_EXISTS', { email });
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('Invalid credentials.', 'INVALID_CREDENTIALS');
  }
}
