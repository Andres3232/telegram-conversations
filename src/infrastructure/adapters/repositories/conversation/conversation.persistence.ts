import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Conversation } from '@src/domain/model/conversation.entity';
import { TelegramChatId } from '@src/domain/value-objects/telegram-chat-id.vo';
import { MessagePersistence } from '@src/infrastructure/adapters/repositories/message/message.persistence';

@Entity('conversations')
export class ConversationPersistence {
  @PrimaryColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 32, unique: true })
  telegramChatId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => MessagePersistence, (m) => m.conversation)
  messages?: MessagePersistence[];

  toDomain(): Conversation {
    return Conversation.rehydrate({
      id: this.id,
      telegramChatId: TelegramChatId.create(this.telegramChatId),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }

  static fromDomain(conversation: Conversation): ConversationPersistence {
    const p = new ConversationPersistence();
    p.id = conversation.id;
    p.telegramChatId = conversation.telegramChatId.toString();
    p.createdAt = conversation.createdAt;
    p.updatedAt = conversation.updatedAt;
    return p;
  }
}
