import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PostgresModule } from './config/postgres.module';
import { AuthModule } from '@src/infrastructure/rest/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ExceptionFilter } from '@src/infrastructure/rest/exception-filter.filter';
import { LoggingModule } from '@src/config/logging.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggingModule.forRoot(),
    TerminusModule,
    PostgresModule.forRoot(),
    AuthModule,
  ],
  controllers: [],
  providers: [ExceptionFilter],
})
export class AppModule {}
