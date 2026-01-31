import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RegisterUserUseCase } from '@src/application/use-cases/register-user.use-case';
import { LoginUseCase } from '@src/application/use-cases/login.use-case';
import { GetMeUseCase } from '@src/application/use-cases/get-me.use-case';

import { PASSWORD_HASHER } from '@src/domain/ports/password-hasher';
import { JWT_SERVICE } from '@src/domain/ports/jwt.service';
import { USER_REPOSITORY } from '@src/domain/ports/user.repository';
import { CONFIGURATION_SERVICE } from '@src/domain/ports/configuration.service';
import { LOGGER_SERVICE } from '@src/domain/ports/logger.service';

import { BcryptPasswordHasher } from '@src/infrastructure/adapters/auth/bcrypt-password-hasher';
import { JsonWebTokenService } from '@src/infrastructure/adapters/auth/jsonwebtoken-jwt.service';
import { NestConfigurationService } from '@src/infrastructure/adapters/configuration/nest-configuration.service';
import { UserPersistence } from '@src/infrastructure/adapters/repositories/user/user.persistence';
import { TypeOrmUserRepository } from '@src/infrastructure/adapters/repositories/user/typeorm-user.repository';
import { PinoLoggerService } from '@src/infrastructure/adapters/logger/pino-logger.service';

import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([UserPersistence])],
  controllers: [AuthController],
  providers: [
    // Use-cases
    RegisterUserUseCase,
    LoginUseCase,
    GetMeUseCase,

    // Adapters
    TypeOrmUserRepository,
    BcryptPasswordHasher,
    JsonWebTokenService,
    NestConfigurationService,
  PinoLoggerService,
    JwtAuthGuard,

    // Ports
    { provide: USER_REPOSITORY, useExisting: TypeOrmUserRepository },
    { provide: PASSWORD_HASHER, useExisting: BcryptPasswordHasher },
    { provide: JWT_SERVICE, useExisting: JsonWebTokenService },
    { provide: CONFIGURATION_SERVICE, useExisting: NestConfigurationService },
  { provide: LOGGER_SERVICE, useExisting: PinoLoggerService },
  ],
  exports: [],
})
export class AuthModule {}
