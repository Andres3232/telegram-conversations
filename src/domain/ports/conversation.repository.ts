import { Conversation } from '@src/domain/model/conversation.entity';
import { TelegramChatId } from '@src/domain/value-objects/telegram-chat-id.vo';

export const CONVERSATION_REPOSITORY = 'ConversationRepository';

export interface ConversationRepository {
  findById(id: string): Promise<Conversation | undefined>;
  findByTelegramChatId(chatId: TelegramChatId): Promise<Conversation | undefined>;
  save(conversation: Conversation): Promise<Conversation>;
  list(limit: number, offset: number): Promise<Conversation[]>;
}
