export abstract class DomainEvent<T> {
  abstract getTopic(): string;
  abstract getEventName(): string;
  abstract dataAsPayload(): T;
  abstract getKey(): string;
}
