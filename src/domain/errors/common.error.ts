import { DomainError } from "./domain.error";

export class InvalidUUIDError extends DomainError {
  constructor(id: string) {
    super(`Invalid UUID: ${id}.`, 'INVALID_UUID');
  }
}
