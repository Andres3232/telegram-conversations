import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { ConfigKeys } from '@src/config/config-keys';

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

            // Telegram
            [ConfigKeys.TELEGRAM_BOT_TOKEN]: Joi.string().required(),
            [ConfigKeys.TELEGRAM_POLLING_ENABLED]: Joi.boolean()
              .truthy('true')
              .falsy('false')
              .default(false),
            [ConfigKeys.TELEGRAM_POLL_INTERVAL_MS]: Joi.number().default(2000),
            [ConfigKeys.TELEGRAM_GETUPDATES_LIMIT]: Joi.number().default(100),
            [ConfigKeys.TELEGRAM_GETUPDATES_TIMEOUT_SECONDS]:
              Joi.number().default(0),

            // Kafka
            [ConfigKeys.KAFKA_BROKERS]: Joi.string().default('localhost:9094'),
            [ConfigKeys.KAFKA_CONSUMER_GROUP_ID]:
              Joi.string().default('telegram-consumer'),
            [ConfigKeys.KAFKA_CONSUMER_ENABLED]: Joi.boolean()
              .truthy('true')
              .falsy('false')
              .default(false),
          }),
          isGlobal: true,
        }),
      ],
      exports: [ConfigModule],
    };
  }
}
