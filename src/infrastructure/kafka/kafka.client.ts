import { Inject, Injectable } from '@nestjs/common';
import { Kafka } from 'kafkajs';

import {
  CONFIGURATION_SERVICE,
  ConfigurationService,
} from '@src/domain/ports/configuration.service';
import { ConfigKeys } from '@src/config/config-keys';

@Injectable()
export class KafkaClientFactory {
  constructor(
    @Inject(CONFIGURATION_SERVICE)
    private readonly config: ConfigurationService,
  ) {}

  createClient(role: string): Kafka {
    const brokersRaw = this.config.get(ConfigKeys.KAFKA_BROKERS) ?? '';
    const brokers = brokersRaw
      .split(',')
      .map((b) => b.trim())
      .filter(Boolean);

    if (brokers.length === 0) {
      throw new Error(
        'KAFKA_BROKERS is empty. Please set KAFKA_BROKERS (e.g. localhost:9094 or kafka:29092).',
      );
    }

    const baseClientId =
      this.config.get(ConfigKeys.SERVICE_NAME) ?? 'telegram-conversations';

    return new Kafka({
      clientId: `${baseClientId}-${role}`,
      brokers,
    });
  }
}
