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
import {
  LOGGER_SERVICE,
  LoggerService,
} from '@src/domain/ports/logger.service';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  accessToken: string;
}

// si es muy "purista" estoy importando cosas de infraestructura en applicactio, esto rompe el principio de comunicacion de arq hex.
//me ahorro por ejemplo de hacer
// {
//   provide: LoginUseCase,
//   useFactory: (userRepo, hasher, jwt, logger) =>
//     new LoginUseCase(userRepo, hasher, jwt, logger),
//   inject: [USER_REPOSITORY, PASSWORD_HASHER, JWT_SERVICE, LOGGER_SERVICE],
// } en el modulo de auth, osea con ese decorador puedo registrarlos casos de usos en providers
@Injectable() 
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(JWT_SERVICE) private readonly jwt: JwtServicePort,
    @Inject(LOGGER_SERVICE) private readonly logger: LoggerService,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const email = Email.create(input.email);

    this.logger.info('Login requested', { email: email.toString() });
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      this.logger.warn('Login failed: invalid credentials', {
        email: email.toString(),
      });
      throw new InvalidCredentialsError();
    }

    const verifyPassword = await this.hasher.verify(
      input.password,
      user.passwordHash,
    );
    if (!verifyPassword) {
      this.logger.warn('Login failed: invalid credentials', {
        email: email.toString(),
      });
      throw new InvalidCredentialsError();
    }

    const accessToken = await this.jwt.sign({
      sub: user.id,
      email: user.email.toString(),
    });

    this.logger.info('Login succeeded', {
      userId: user.id,
      email: user.email.toString(),
    });

    return { accessToken };
  }
}
