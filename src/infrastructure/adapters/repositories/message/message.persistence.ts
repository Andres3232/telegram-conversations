import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Message } from '@src/domain/model/message.entity';
import { MessageContent } from '@src/domain/value-objects/message-content.vo';
import { ConversationPersistence } from '@src/infrastructure/adapters/repositories/conversation/conversation.persistence';

@Entity('messages')
@Index(['conversationId', 'createdAt'])
export class MessagePersistence {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  conversationId: string;

  @Index({ unique: true })
  @Column({ type: 'bigint', unique: true, nullable: true })
  telegramUpdateId?: string;

  @ManyToOne(() => ConversationPersistence, (c) => c.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversationId' })
  conversation?: ConversationPersistence;

  @Column({ type: 'varchar', length: 3 })
  direction: 'IN' | 'OUT';

  @Column({ type: 'varchar', length: 4096 })
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  toDomain(): Message {
    return Message.rehydrate({
      id: this.id,
      conversationId: this.conversationId,
      telegramUpdateId: this.telegramUpdateId
        ? Number(this.telegramUpdateId)
        : undefined,
      direction: this.direction,
      content: MessageContent.create(this.content),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }

  static fromDomain(message: Message): MessagePersistence {
    const p = new MessagePersistence();
    p.id = message.id;
    p.conversationId = message.conversationId;
    p.telegramUpdateId =
      message.telegramUpdateId === undefined
        ? undefined
        : String(message.telegramUpdateId);
    p.direction = message.direction;
    p.content = message.content.toString();
    p.createdAt = message.createdAt;
    p.updatedAt = message.updatedAt;
    return p;
  }
}
