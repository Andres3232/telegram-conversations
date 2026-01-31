import { Injectable } from '@nestjs/common';
import { Producer } from 'kafkajs';

import { DomainEvent } from '@src/domain/events/shared/domain.event';
import { MessageProducer } from '@src/domain/ports/message.producer';
import { KafkaClientFactory } from './kafka.client';

@Injectable()
export class KafkaMessageProducer implements MessageProducer {
  private producer?: Producer;

  constructor(private readonly kafkaFactory: KafkaClientFactory) {}

  private async getProducer(): Promise<Producer> {
    if (!this.producer) {
  this.producer = this.kafkaFactory.createClient('producer').producer();
      await this.producer.connect();
    }
    return this.producer;
  }

  async send<T>(event: DomainEvent<T>): Promise<void> {
    const producer = await this.getProducer();

    await producer.send({
      topic: event.getTopic(),
      messages: [
        {
          key: event.getKey(),
          value: JSON.stringify({
            eventName: event.getEventName(),
            payload: event.dataAsPayload(),
          }),
        },
      ],
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.producer) {
      await this.producer.disconnect();
    }
  }
}
