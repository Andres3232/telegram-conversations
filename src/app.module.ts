import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PostgresModule } from './config/postgres.module';
import { AuthModule } from '@src/infrastructure/rest/auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TerminusModule,
    PostgresModule.forRoot(),
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
