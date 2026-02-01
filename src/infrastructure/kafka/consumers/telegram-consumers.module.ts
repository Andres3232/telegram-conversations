import { Module } from '@nestjs/common';
import { ReplyToMessageUseCase } from '@src/application/use-cases/telegram/reply-to-message.use-case';
import { LoggingModule } from '@src/config/logging.module';
import { KafkaModule } from '@src/infrastructure/kafka/kafka.module';
import { TelegramModule } from '@src/infrastructure/telegram-cron/telegram.module';
import { AiModule } from '@src/infrastructure/ai/ai.module';
import { MessageReceivedHandler } from './handlers/message-received.handler';
import { TelegramKafkaConsumerService } from './telegram-kafka-consumer.service';

@Module({
  imports: [KafkaModule, TelegramModule, AiModule, LoggingModule.forRoot()],
  providers: [
    ReplyToMessageUseCase,
    MessageReceivedHandler,
    TelegramKafkaConsumerService,
  ],
})
export class TelegramConsumersModule {}
