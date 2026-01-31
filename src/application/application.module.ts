import { Module } from '@nestjs/common';

import { GetMeUseCase } from './use-cases/auth/get-me.use-case';
import { LoginUseCase } from './use-cases/auth/login.use-case';
import { RegisterUserUseCase } from './use-cases/auth/register-user.use-case';

@Module({
  providers: [RegisterUserUseCase, LoginUseCase, GetMeUseCase],
  exports: [RegisterUserUseCase, LoginUseCase, GetMeUseCase],
})
export class ApplicationModule {}
