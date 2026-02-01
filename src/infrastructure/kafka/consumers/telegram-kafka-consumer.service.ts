import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Consumer } from 'kafkajs';
import {
  CONFIGURATION_SERVICE,
  ConfigurationService,
} from '@src/domain/ports/configuration.service';
import { ConfigKeys } from '@src/config/config-keys';
import { EventNames } from '@src/domain/events/shared/event-names.enum';
import { Topics } from '@src/domain/events/shared/topics';
import {
  LOGGER_SERVICE,
  LoggerService,
} from '@src/domain/ports/logger.service';
import {
  MessageReceivedEventEnvelope,
  MessageReceivedHandler,
} from './handlers/message-received.handler';
import { KafkaClientFactory } from '../kafka.client';

@Injectable()
export class TelegramKafkaConsumerService
  implements OnModuleInit, OnModuleDestroy
{
  private consumer?: Consumer;

  constructor(
    @Inject(CONFIGURATION_SERVICE)
    private readonly config: ConfigurationService,
    @Inject(LOGGER_SERVICE)
    private readonly logger: LoggerService,
    private readonly messageReceivedHandler: MessageReceivedHandler,
    private readonly kafkaFactory: KafkaClientFactory,
  ) {}

  async onModuleInit(): Promise<void> {
    const enabledRaw = this.config.get(ConfigKeys.KAFKA_CONSUMER_ENABLED);
    const enabled = (enabledRaw ?? 'true').toLowerCase() !== 'false';

    if (!enabled) {
      this.logger.info('kafka.consumer.disabled');
      return;
    }

    const brokersRaw = this.config.get(ConfigKeys.KAFKA_BROKERS) ?? '';
    if (brokersRaw.trim().length === 0) {
      this.logger.warn('kafka.consumer.no_brokers');
      return;
    }

    const groupId =
      this.config.get(ConfigKeys.KAFKA_CONSUMER_GROUP_ID) ??
      'telegram-conversations';

    this.consumer = this.kafkaFactory
      .createClient('consumer')
      .consumer({ groupId });

    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: Topics.TELEGRAM,
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const raw = message.value?.toString('utf8');
        if (!raw) return;

        let envelope: MessageReceivedEventEnvelope;
        try {
          envelope = JSON.parse(raw);
        } catch {
          this.logger.warn('kafka.consumer.invalid_json', {
            topic,
            partition,
            offset: message.offset,
          });
          return;
        }

        if (envelope.eventName === EventNames.MESSAGE_RECEIVED) {
          await this.messageReceivedHandler.handle(envelope);
          return;
        }

        // Unknown eventName: ignore (forward compatibility)
        this.logger.debug('kafka.consumer.unknown_event', {
          eventName: envelope.eventName,
          topic,
          partition,
          offset: message.offset,
        });
      },
    });

    this.logger.info('kafka.consumer.started', {
      topic: Topics.TELEGRAM,
      groupId,
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.consumer) {
      await this.consumer.disconnect();
      this.consumer = undefined;
    }
  }
}
