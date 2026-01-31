import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ListConversationsUseCase } from '@src/application/use-cases/conversations/list-conversations.use-case';
import { ListMessagesUseCase } from '@src/application/use-cases/conversations/list-messages.use-case';

import {
  CONVERSATION_REPOSITORY,
} from '@src/domain/ports/conversation.repository';
import { MESSAGE_REPOSITORY } from '@src/domain/ports/message.repository';

import { ConversationPersistence } from '@src/infrastructure/adapters/repositories/conversation/conversation.persistence';
import { MessagePersistence } from '@src/infrastructure/adapters/repositories/message/message.persistence';
import { TypeOrmConversationRepository } from '@src/infrastructure/adapters/repositories/conversation/typeorm-conversation.repository';
import { TypeOrmMessageRepository } from '@src/infrastructure/adapters/repositories/message/typeorm-message.repository';

import { ConversationsController } from './conversations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ConversationPersistence, MessagePersistence])],
  controllers: [ConversationsController],
  providers: [
    // Use-cases
    ListConversationsUseCase,
    ListMessagesUseCase,

    // Adapters
    TypeOrmConversationRepository,
    TypeOrmMessageRepository,

    // Ports
    { provide: CONVERSATION_REPOSITORY, useExisting: TypeOrmConversationRepository },
    { provide: MESSAGE_REPOSITORY, useExisting: TypeOrmMessageRepository },
  ],
})
export class ConversationsModule {}
