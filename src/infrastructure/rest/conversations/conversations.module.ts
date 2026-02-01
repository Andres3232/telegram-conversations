import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListConversationsUseCase } from '@src/application/use-cases/conversations/list-conversations.use-case';
import { ListMessagesUseCase } from '@src/application/use-cases/conversations/list-messages.use-case';
import { SendMessageUseCase } from '@src/application/use-cases/conversations/send-message.use-case';
import { CONVERSATION_REPOSITORY } from '@src/domain/ports/conversation.repository';
import { MESSAGE_REPOSITORY } from '@src/domain/ports/message.repository';
import { ConversationPersistence } from '@src/infrastructure/adapters/repositories/conversation/conversation.persistence';
import { MessagePersistence } from '@src/infrastructure/adapters/repositories/message/message.persistence';
import { TypeOrmConversationRepository } from '@src/infrastructure/adapters/repositories/conversation/typeorm-conversation.repository';
import { TypeOrmMessageRepository } from '@src/infrastructure/adapters/repositories/message/typeorm-message.repository';
import { JwtAuthGuard } from '@src/infrastructure/rest/auth/jwt-auth.guard';
import { JWT_SERVICE } from '@src/domain/ports/jwt.service';
import { JsonWebTokenService } from '@src/infrastructure/adapters/auth/jsonwebtoken-jwt.service';
import { CONFIGURATION_SERVICE } from '@src/domain/ports/configuration.service';
import { NestConfigurationService } from '@src/infrastructure/adapters/configuration/nest-configuration.service';
import { ConfigModule } from '@nestjs/config';
import { ConversationsController } from './conversations.controller';
import { TelegramModule } from '@src/infrastructure/telegram-cron/telegram.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ConversationPersistence, MessagePersistence]),
  TelegramModule,
  ],
  controllers: [ConversationsController],
  providers: [
    // Use-cases
    ListConversationsUseCase,
    ListMessagesUseCase,
  SendMessageUseCase,

    // Adapters
    TypeOrmConversationRepository,
    TypeOrmMessageRepository,
    NestConfigurationService,
    JsonWebTokenService,
    JwtAuthGuard,

    // Ports
    {
      provide: CONVERSATION_REPOSITORY,
      useExisting: TypeOrmConversationRepository,
    },
    { provide: MESSAGE_REPOSITORY, useExisting: TypeOrmMessageRepository },

    // Auth/JWT (needed by JwtAuthGuard)
    { provide: CONFIGURATION_SERVICE, useExisting: NestConfigurationService },
    { provide: JWT_SERVICE, useExisting: JsonWebTokenService },
  ],
})
export class ConversationsModule {}
