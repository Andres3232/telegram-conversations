import { Inject, Injectable } from '@nestjs/common';

import { InvalidCredentialsError } from '@src/domain/errors/auth.errors';
import { JwtServicePort, JWT_SERVICE } from '@src/domain/ports/jwt.service';
import {
  PASSWORD_HASHER,
  PasswordHasher,
} from '@src/domain/ports/password-hasher';
import {
  USER_REPOSITORY,
  UserRepository,
} from '@src/domain/ports/user.repository';
import { Email } from '@src/domain/value-objects/email.vo';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  accessToken: string;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(JWT_SERVICE) private readonly jwt: JwtServicePort,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const email = Email.create(input.email);
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const verifyPassword = await this.hasher.verify(input.password, user.passwordHash);
    if (!verifyPassword) {
      throw new InvalidCredentialsError();
    }

    const accessToken = await this.jwt.sign({
      sub: user.id,
      email: user.email.toString(),
    });

    return { accessToken };
  }
}
