import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggingModule } from '@src/config/logging.module';
import { CONFIGURATION_SERVICE } from '@src/domain/ports/configuration.service';
import { AI_RESPONDER } from '@src/domain/ports/ai-responder';
import { LOGGER_SERVICE } from '@src/domain/ports/logger.service';
import { OpenAiResponder } from '@src/infrastructure/adapters/ai/openai.responder';
import { NestConfigurationService } from '@src/infrastructure/adapters/configuration/nest-configuration.service';
import { PinoLoggerService } from '@src/infrastructure/adapters/logger/pino-logger.service';

@Module({
  imports: [ConfigModule, LoggingModule.forRoot()],
  providers: [
    NestConfigurationService,
    { provide: CONFIGURATION_SERVICE, useExisting: NestConfigurationService },
    PinoLoggerService,
    { provide: LOGGER_SERVICE, useExisting: PinoLoggerService },
    OpenAiResponder,
    {
      provide: AI_RESPONDER,
      useExisting: OpenAiResponder,
    },
  ],
  exports: [AI_RESPONDER],
})
export class AiModule {}
