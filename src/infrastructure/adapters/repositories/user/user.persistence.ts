import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '@src/domain/model/user.entity';
import { Email } from '@src/domain/value-objects/email.vo';

@Entity('users')
export class UserPersistence {
  @PrimaryColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  toDomain(): User {
    return User.rehydrate({
      id: this.id,
      email: Email.create(this.email),
      passwordHash: this.passwordHash,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }

  static fromDomain(user: User): UserPersistence {
    const p = new UserPersistence();
    p.id = user.id;
    p.email = user.email.toString();
    p.passwordHash = user.passwordHash;
    p.createdAt = user.createdAt;
    p.updatedAt = user.updatedAt;
    return p;
  }
}
