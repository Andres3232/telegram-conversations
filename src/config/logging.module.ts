import { DynamicModule, Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

@Module({})
export class LoggingModule {
  static forRoot(): DynamicModule {
    return {
      module: LoggingModule,
      imports: [
        LoggerModule.forRoot({
          pinoHttp: {
            level: process.env.LOG_LEVEL ?? 'info',
            transport:
              process.env.NODE_ENV === 'production'
                ? undefined
                : {
                    target: 'pino-pretty',
                    options: {
                      colorize: true,
                      translateTime: 'SYS:standard',
                      singleLine: true,
                      ignore: 'pid,hostname',
                    },
                  },
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.body.password',
                'req.body.pass',
                'req.body.token',
              ],
              censor: '[REDACTED]',
            },
          },
        }),
      ],
      exports: [LoggerModule],
    };
  }
}
