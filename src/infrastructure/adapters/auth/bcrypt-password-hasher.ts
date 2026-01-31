import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { PasswordHasher } from '@src/domain/ports/password-hasher';

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(plain, saltRounds);
  }

  async verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
