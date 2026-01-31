import { InvalidUUIDError } from "../errors/common.error";

export type EntityProps<T> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};
export abstract class BaseEntity {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  protected constructor(
    id: string,
    createdAt: Date = new Date(),
    updatedAt: Date = createdAt,
  ) {
    BaseEntity.validateId(id);
    this.id = id;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  protected static validateId(id: string): void {
    if (!BaseEntity.UUID_REGEX.test(id)) {
      throw new InvalidUUIDError(id);
    }
  }

  protected static ensureNotEmpty(
    value: string,
    ErrorClass: new (value: string) => Error,
  ): void {
    if (!value || value.trim() === '') {
      throw new ErrorClass(value);
    }
  }

  private static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
}
