import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '@src/domain/model/message.entity';
import { MessageRepository } from '@src/domain/ports/message.repository';
import { MessageContent } from '@src/domain/value-objects/message-content.vo';
import { MessagePersistence } from './message.persistence';

@Injectable()
export class TypeOrmMessageRepository implements MessageRepository {
  constructor(
    @InjectRepository(MessagePersistence)
    private readonly repo: Repository<MessagePersistence>,
  ) {}

  async save(message: Message): Promise<Message> {
    const saved = await this.repo.save(MessagePersistence.fromDomain(message));
    return saved.toDomain();
  }

  async saveFromTelegramUpdate(params: {
    conversationId: string;
    direction: 'IN' | 'OUT';
    content: string;
    telegramUpdateId: number;
  }): Promise<Message | undefined> {
    const message = Message.createNew({
      conversationId: params.conversationId,
      direction: params.direction,
      content: MessageContent.create(params.content),
      telegramUpdateId: params.telegramUpdateId,
    });

    try {
      const saved = await this.repo.insert(MessagePersistence.fromDomain(message));
      const row = await this.repo.findOne({ where: { id: message.id } });
      return row?.toDomain();
    } catch (err: any) {
      if (err?.code === '23505') {
        return undefined;
      }
      throw err;
    }
  }

  async listByConversationId(
    conversationId: string,
    limit: number,
    offset: number,
  ): Promise<Message[]> {
    const rows = await this.repo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      take: limit,
      skip: offset,
    });
    return rows.map((r) => r.toDomain());
  }
}
