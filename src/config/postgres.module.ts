import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as Joi from 'joi';

import { ConfigKeys } from '@src/config/config-keys';
import { UserPersistence } from '@src/infrastructure/adapters/repositories/user/user.persistence';
import { ConversationPersistence } from '@src/infrastructure/adapters/repositories/conversation/conversation.persistence';
import { MessagePersistence } from '@src/infrastructure/adapters/repositories/message/message.persistence';
import { TelegramSyncStatePersistence } from '@src/infrastructure/adapters/repositories/telegram-sync-state/telegram-sync-state.persistence';

export const ENTITIES = [
  UserPersistence,
  ConversationPersistence,
  MessagePersistence,
  TelegramSyncStatePersistence,
];

@Module({})
export class PostgresModule {
  static forRoot(typeOrmOptions: TypeOrmModuleOptions = {}): DynamicModule {
    return {
      module: PostgresModule,
      imports: [
        ConfigModule.forRoot({
          validationSchema: Joi.object({
            [ConfigKeys.POSTGRES_HOST]: Joi.string().required(),
            [ConfigKeys.POSTGRES_PORT]: Joi.number().required(),
            [ConfigKeys.POSTGRES_USER]: Joi.string().required(),
            [ConfigKeys.POSTGRES_PASSWORD]: Joi.string().required(),
            [ConfigKeys.POSTGRES_DB]: Joi.string().required(),
            [ConfigKeys.POSTGRES_SCHEMA]: Joi.string().optional(),
            [ConfigKeys.JWT_SECRET]: Joi.string().required(),
            [ConfigKeys.TELEGRAM_BOT_TOKEN]: Joi.string().required(),
            [ConfigKeys.TELEGRAM_POLLING_ENABLED]: Joi.string()
              .valid('true', 'false')
              .default('false'),
            [ConfigKeys.TELEGRAM_POLL_INTERVAL_MS]: Joi.number()
              .integer()
              .min(250)
              .default(2000),
            [ConfigKeys.TELEGRAM_GETUPDATES_LIMIT]: Joi.number()
              .integer()
              .min(1)
              .max(100)
              .default(50),
            [ConfigKeys.TELEGRAM_GETUPDATES_TIMEOUT_SECONDS]: Joi.number()
              .integer()
              .min(0)
              .max(50)
              .default(0),
          }),
        }),
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
            return {
              type: 'postgres',
              host: configService.get<string>(ConfigKeys.POSTGRES_HOST),
              port: Number(
                configService.get<string | number>(ConfigKeys.POSTGRES_PORT),
              ),
              username: configService.get<string>(ConfigKeys.POSTGRES_USER),
              password: configService.get<string>(ConfigKeys.POSTGRES_PASSWORD),
              database: configService.get<string>(ConfigKeys.POSTGRES_DB),
              schema: configService.get<string>(ConfigKeys.POSTGRES_SCHEMA) ?? 'public',
              entities: ENTITIES,
              synchronize: true,
              ...typeOrmOptions,
            } as TypeOrmModuleOptions;
          },
        }),
        TypeOrmModule.forFeature(ENTITIES),
      ],
      exports: [TypeOrmModule],
    };
  }
}
