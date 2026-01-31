import { DomainError } from "./domain.error";


export class DomainServiceError extends DomainError {
  static code = 'DOMAIN_SERVICE_ERROR';
  constructor(serviceName: string, err: unknown) {
    super(
      `Error on domain service: ${serviceName}, error: ${err} `,
      DomainServiceError.code,
    );
  }
}

export class InvalidEntityIdError extends DomainError {
  static code = 'INVALID_ENTITY_ID';
  constructor(id: string) {
    super(
      `Invalid Id: ${id !== '' ? id : 'Cannot be empty'}.`,
      InvalidEntityIdError.code,
    );
  }
}

export abstract class InvalidEmptyAttributeError extends DomainError {
  constructor(attributeName: string, code: string) {
    super(`Invalid ${attributeName}: Cannot be empty.`, code);
  }
}

export class MediaFileNotFound extends DomainError {
  static code = 'MEDIA_FILE_NOT_FOUND';
  constructor(fileKey: string) {
    super(`File not found with file-key: ${fileKey}`, MediaFileNotFound.code);
  }
}

export class InvalidMaritalMatchStatusError extends DomainError {
  static code = 'INVALID_MARITAL_STATUS';
  constructor() {
    super('Invalid match marital status', InvalidMaritalMatchStatusError.code);
  }
}

export class InvalidOccupationMatchError extends DomainError {
  static code = 'INVALID_OCCUPATION';
  constructor() {
    super('Invalid occupation match', InvalidOccupationMatchError.code);
  }
}

export class InvalidStepStatusError extends DomainError {
  static code = 'INVALID_STEP_STATUS';
  constructor() {
    super('Invalid step status', InvalidStepStatusError.code);
  }
}

export class InvalidUUIDError extends DomainError {
  constructor(id: string) {
    super(`Invalid UUID: ${id}.`, 'INVALID_UUID');
  }
}
