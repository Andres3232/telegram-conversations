import { DomainError } from '@src/domain/errors/domain.error';
export abstract class NotFoundError extends DomainError {
  protected constructor(message: string, errorCode: string) {
    super(message, errorCode);
  }
}