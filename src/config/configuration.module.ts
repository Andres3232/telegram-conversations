import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { ConfigKeys } from '@src/config/config-keys';

const DEFAULT_SERVICE_NAME = 'user-core';

@Module({})
export class ConfigurationModule {
  private static readonly DEFAULT_ENV_FILE = '/.env';
  static forRoot(envFile?: string): DynamicModule {
    let envFilePath = envFile ?? ConfigurationModule.DEFAULT_ENV_FILE;
    if (!envFilePath.startsWith('/')) {
      envFilePath = process.cwd() + '/' + envFilePath;
    }
    return {
      module: ConfigurationModule,
      imports: [
        ConfigModule.forRoot({
          envFilePath,
          validationSchema: Joi.object({
            [ConfigKeys.NODE_ENV]: Joi.string()
              .valid('local', 'dev', 'test', 'integration', 'production')
              .required(),
            [ConfigKeys.NODE_CONFIG_ENV]: Joi.string()
              .valid('local', 'dev', 'test', 'tst', 'stg', 'prd')
              .required(),
            [ConfigKeys.PORT]: Joi.number().required(),
          }),
          isGlobal: true,
        }),
      ],
      exports: [ConfigModule],
    };
  }
}
