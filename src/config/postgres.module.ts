import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as Joi from 'joi';

import { ConfigKeys } from '@src/config/config-keys';
import { UserPersistence } from '@src/infrastructure/adapters/repositories/user/user.persistence';
import { ConversationPersistence } from '@src/infrastructure/adapters/repositories/conversation/conversation.persistence';
import { MessagePersistence } from '@src/infrastructure/adapters/repositories/message/message.persistence';

export const ENTITIES = [UserPersistence, ConversationPersistence, MessagePersistence];

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
              // Para el ejercicio, dejamos synchronize activado.
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
