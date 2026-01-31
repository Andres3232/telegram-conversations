import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Message } from '@src/domain/model/message.entity';
import { MessageRepository } from '@src/domain/ports/message.repository';
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
