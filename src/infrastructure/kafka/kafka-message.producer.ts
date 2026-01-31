import { Inject, Injectable } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

import { DomainEvent } from '@src/domain/events/shared/domain.event';
import { MessageProducer } from '@src/domain/ports/message.producer';
import {
  CONFIGURATION_SERVICE,
  ConfigurationService,
} from '@src/domain/ports/configuration.service';
import { ConfigKeys } from '@src/config/config-keys';

@Injectable()
export class KafkaMessageProducer implements MessageProducer {
  private producer?: Producer;

  constructor(
    @Inject(CONFIGURATION_SERVICE)
    private readonly config: ConfigurationService,
  ) {}

  private get kafka(): Kafka {
    const brokersRaw = this.config.get(ConfigKeys.KAFKA_BROKERS) ?? '';
    const brokers = brokersRaw
      .split(',')
      .map((b) => b.trim())
      .filter(Boolean);

    if (brokers.length === 0) {
      throw new Error(
        'KAFKA_BROKERS is empty. Please set KAFKA_BROKERS (e.g. localhost:9092).',
      );
    }

    return new Kafka({
      clientId:
        this.config.get(ConfigKeys.SERVICE_NAME) ?? 'telegram-conversations',
      brokers,
    });
  }

  private async getProducer(): Promise<Producer> {
    if (!this.producer) {
      this.producer = this.kafka.producer();
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
