import { DomainError } from '@src/domain/errors/domain.error';

export class ConversationNotFoundError extends DomainError {
  constructor(conversationId: string) {
    super('Conversation not found.', 'CONVERSATION_NOT_FOUND', { conversationId });
  }
}
