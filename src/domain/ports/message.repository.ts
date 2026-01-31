import { Message } from '@src/domain/model/message.entity';

export const MESSAGE_REPOSITORY = 'MessageRepository';

export interface MessageRepository {
  save(message: Message): Promise<Message>;
  saveFromTelegramUpdate(params: {
    conversationId: string;
    direction: 'IN' | 'OUT';
    content: string;
    telegramUpdateId: number;
  }): Promise<Message | undefined>;
  listByConversationId(
    conversationId: string,
    limit: number,
    offset: number,
  ): Promise<Message[]>;
}
