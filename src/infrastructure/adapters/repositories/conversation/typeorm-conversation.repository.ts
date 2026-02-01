import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '@src/domain/model/conversation.entity';
import { ConversationRepository } from '@src/domain/ports/conversation.repository';
import { TelegramChatId } from '@src/domain/value-objects/telegram-chat-id.vo';
import { ConversationPersistence } from './conversation.persistence';

@Injectable()
export class TypeOrmConversationRepository implements ConversationRepository {
  constructor(
    @InjectRepository(ConversationPersistence)
    private readonly repo: Repository<ConversationPersistence>,
  ) {}

  async findById(id: string): Promise<Conversation | undefined> {
    const row = await this.repo.findOne({ where: { id } });
    return row?.toDomain();
  }

  async findByTelegramChatId(
    chatId: TelegramChatId,
  ): Promise<Conversation | undefined> {
    const row = await this.repo.findOne({
      where: { telegramChatId: chatId.toString() },
    });
    return row?.toDomain();
  }

  async save(conversation: Conversation): Promise<Conversation> {
    const saved = await this.repo.save(
      ConversationPersistence.fromDomain(conversation),
    );
    return saved.toDomain();
  }

  async list(limit: number, offset: number): Promise<Conversation[]> {
    const rows = await this.repo.find({
      order: { updatedAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return rows.map((r) => r.toDomain());
  }
}
