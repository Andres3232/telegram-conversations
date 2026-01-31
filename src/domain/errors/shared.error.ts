import { DomainError } from '@src/domain/errors/domain.error';

export class InvalidDeviceIdHeaderError extends DomainError{
    constructor() {
        super(`Invalid or not found DeviceId header`, 'INVALID_DEVICE_ID');
      }
}

export abstract class NotFoundError extends DomainError {
  protected constructor(message: string, errorCode: string) {
    super(message, errorCode);
  }
}