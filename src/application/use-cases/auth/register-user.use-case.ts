import { Inject, Injectable } from '@nestjs/common';

import { Email } from '@src/domain/value-objects/email.vo';
import { Password } from '@src/domain/value-objects/password.vo';
import { User } from '@src/domain/model/user.entity';
import { UserAlreadyExistsError } from '@src/domain/errors/auth.errors';
import {
  PASSWORD_HASHER,
  PasswordHasher,
} from '@src/domain/ports/password-hasher';
import {
  USER_REPOSITORY,
  UserRepository,
} from '@src/domain/ports/user.repository';
import {
  LOGGER_SERVICE,
  LoggerService,
} from '@src/domain/ports/logger.service';

export interface RegisterUserInput {
  email: string;
  password: string;
}

export interface RegisterUserOutput {
  id: string;
  email: string;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(LOGGER_SERVICE) private readonly logger: LoggerService,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    const email = Email.create(input.email);
    const password = Password.create(input.password);

    this.logger.info('Register user requested', { email: email.toString() });

    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      this.logger.warn('Register user failed: already exists', {
        email: email.toString(),
      });
      throw new UserAlreadyExistsError(email.toString());
    }

    const passwordHash = await this.hasher.hash(password.toString());
    const user = User.createNew({ email, passwordHash });

    const saved = await this.userRepo.save(user);

    this.logger.info('User registered', {
      userId: saved.id,
      email: saved.email.toString(),
    });

    return { id: saved.id, email: saved.email.toString() };
  }
}
