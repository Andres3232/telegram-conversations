import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
  LoggerService,
  LogHttpDebugRequest,
} from '@src/domain/ports/logger.service';

@Injectable()
export class PinoLoggerService implements LoggerService {
  constructor(private readonly logger: PinoLogger) {}

  debug(message: string, context?: any) {
    this.logger.debug(context ?? {}, message);
  }

  info(message: string, context?: any) {
    this.logger.info(context ?? {}, message);
  }

  warn(message: string, context?: any) {
    this.logger.warn(context ?? {}, message);
  }

  error(message: string, context?: any) {
    this.logger.error(context ?? {}, message);
  }

  fatal(message: string, context?: any) {
    this.logger.fatal?.(context ?? {}, message);
  }

  logHttpDebugRequest(
    message: string,
    { method, headers, body }: LogHttpDebugRequest,
  ): void {
    const safeHeaders = { ...(headers ?? {}) } as any;
    if (safeHeaders.authorization) safeHeaders.authorization = '[REDACTED]';
    if (safeHeaders.cookie) safeHeaders.cookie = '[REDACTED]';

    this.debug(message, { method, headers: safeHeaders, body });
  }

  logHttpDebugResponse(message: string, response: any): void {
    this.debug(message, { response });
  }
}
