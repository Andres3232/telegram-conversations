import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserRepository } from '@src/domain/ports/user.repository';
import { User } from '@src/domain/model/user.entity';
import { Email } from '@src/domain/value-objects/email.vo';
import { UserPersistence } from './user.persistence';

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserPersistence)
    private readonly repo: Repository<UserPersistence>,
  ) {}

  async findByEmail(email: Email): Promise<User | undefined> {
    const row = await this.repo.findOne({ where: { email: email.toString() } });
    return row?.toDomain();
  }

  async findById(id: string): Promise<User | undefined> {
    const row = await this.repo.findOne({ where: { id } });
    return row?.toDomain();
  }

  async save(user: User): Promise<User> {
    const saved = await this.repo.save(UserPersistence.fromDomain(user));
    return saved.toDomain();
  }
}
