import * as crypto from 'crypto';

import { BaseEntity } from '@src/domain/model/base.entity';
import { MissingPasswordHashError } from '@src/domain/errors/auth.errors';
import { Email } from '@src/domain/value-objects/email.vo';

export interface UserProps {
  id: string;
  email: Email;
  passwordHash: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User extends BaseEntity {
  readonly email: Email;
  readonly passwordHash: string;

  private constructor({
    id,
    email,
    passwordHash,
    createdAt,
    updatedAt,
  }: UserProps) {
    super(id, createdAt, updatedAt);
    this.email = email;
    this.passwordHash = passwordHash;
  }

  static createNew(params: { email: Email; passwordHash: string }): User {
    if (!params.passwordHash) {
      throw new MissingPasswordHashError();
    }
    return new User({
      id: crypto.randomUUID(),
      email: params.email,
      passwordHash: params.passwordHash,
    });
  }

  static rehydrate(props: UserProps): User {
    return new User(props);
  }
}
