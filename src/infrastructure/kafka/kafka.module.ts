import { Module } from '@nestjs/common';

import { MESSAGE_PRODUCER } from '@src/domain/ports/message.producer';
import {
  CONFIGURATION_SERVICE,
} from '@src/domain/ports/configuration.service';
import { NestConfigurationService } from '@src/infrastructure/adapters/configuration/nest-configuration.service';
import { KafkaMessageProducer } from '@src/infrastructure/kafka/kafka-message.producer';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [
    NestConfigurationService,
    KafkaMessageProducer,
    {
      provide: CONFIGURATION_SERVICE,
      useExisting: NestConfigurationService,
    },
    {
      provide: MESSAGE_PRODUCER,
      useExisting: KafkaMessageProducer,
    },
  ],
  exports: [MESSAGE_PRODUCER],
})
export class KafkaModule {}
