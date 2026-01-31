export abstract class DomainError extends Error {
  protected constructor(
    message: string,
    public errorCode: string,
    public readonly data?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
