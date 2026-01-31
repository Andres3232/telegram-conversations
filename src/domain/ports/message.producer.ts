import { DomainEvent } from '@src/domain/events/shared/domain.event';

export const MESSAGE_PRODUCER = 'MessageProducer';

export interface MessageProducer {
  send<T>(event: DomainEvent<T>): Promise<void>;
}
