import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { SyncTelegramUpdatesUseCase } from '@src/application/use-cases/telegram/sync-telegram-updates.use-case';
import { TELEGRAM_CLIENT } from '@src/domain/ports/telegram.client';
import { TELEGRAM_SYNC_STATE_REPOSITORY } from '@src/domain/ports/telegram-sync-state.repository';
import { CONVERSATION_REPOSITORY } from '@src/domain/ports/conversation.repository';
import { MESSAGE_REPOSITORY } from '@src/domain/ports/message.repository';
import { CONFIGURATION_SERVICE } from '@src/domain/ports/configuration.service';
import { NestConfigurationService } from '@src/infrastructure/adapters/configuration/nest-configuration.service';
import { LOGGER_SERVICE } from '@src/domain/ports/logger.service';
import { PinoLoggerService } from '@src/infrastructure/adapters/logger/pino-logger.service';
import { LoggingModule } from '@src/config/logging.module';
import { TelegramHttpClient } from '@src/infrastructure/adapters/telegram/telegram-http.client';
import { TelegramPollingService } from './telegram-polling.service';
import { TelegramSyncStatePersistence } from '@src/infrastructure/adapters/repositories/telegram-sync-state/telegram-sync-state.persistence';
import { TypeOrmTelegramSyncStateRepository } from '@src/infrastructure/adapters/repositories/telegram-sync-state/typeorm-telegram-sync-state.repository';

import { ConversationPersistence } from '@src/infrastructure/adapters/repositories/conversation/conversation.persistence';
import { MessagePersistence } from '@src/infrastructure/adapters/repositories/message/message.persistence';
import { TypeOrmConversationRepository } from '@src/infrastructure/adapters/repositories/conversation/typeorm-conversation.repository';
import { TypeOrmMessageRepository } from '@src/infrastructure/adapters/repositories/message/typeorm-message.repository';

@Module({
  imports: [
    ConfigModule,
    LoggingModule.forRoot(),
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      ConversationPersistence,
      MessagePersistence,
      TelegramSyncStatePersistence,
    ]),
  ],
  providers: [
    SyncTelegramUpdatesUseCase,
    TelegramPollingService,

    TelegramHttpClient,
    TypeOrmTelegramSyncStateRepository,
    TypeOrmConversationRepository,
    TypeOrmMessageRepository,
    NestConfigurationService,
    { provide: TELEGRAM_CLIENT, useClass: TelegramHttpClient },
    { provide: CONFIGURATION_SERVICE, useExisting: NestConfigurationService },
    { provide: LOGGER_SERVICE, useExisting: PinoLoggerService },
    {
      provide: TELEGRAM_SYNC_STATE_REPOSITORY,
      useClass: TypeOrmTelegramSyncStateRepository,
    },
    {
      provide: CONVERSATION_REPOSITORY,
      useExisting: TypeOrmConversationRepository,
    },
    { provide: MESSAGE_REPOSITORY, useExisting: TypeOrmMessageRepository },

  ],
  exports: [],
})
export class TelegramModule {}
