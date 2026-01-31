import { Message } from '@src/domain/model/message.entity';

export const MESSAGE_REPOSITORY = 'MessageRepository';

export interface MessageRepository {
  save(message: Message): Promise<Message>;
  listByConversationId(
    conversationId: string,
    limit: number,
    offset: number,
  ): Promise<Message[]>;
}
