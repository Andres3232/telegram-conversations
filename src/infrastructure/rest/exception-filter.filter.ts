import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { DomainError } from '@src/domain/errors/domain.error';
import { PinoLogger } from 'nestjs-pino';

function isDomainErrorLike(e: unknown): e is DomainError {
  return (
    !!e &&
    typeof e === 'object' &&
    'errorCode' in e &&
    typeof (e as any).errorCode === 'string' &&
    'message' in e &&
    typeof (e as any).message === 'string'
  );
}

@Catch()
export class ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response: any = ctx.getResponse();
    const request: any = ctx.getRequest();

    if (!response) return;

    const url = request?.url;

    // Dominios -> 400
    if (exception instanceof DomainError || isDomainErrorLike(exception)) {
      this.logger.warn(
        {
          errorCode: (exception as any).errorCode,
          data: (exception as any).data,
          path: url,
        },
        (exception as any).message,
      );
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'domain_error',
        message: (exception as any).message,
        code: (exception as any).errorCode,
        data: (exception as any).data,
        path: url,
        timestamp: new Date().toISOString(),
      });
    }

    // HttpException (incluye ValidationPipe) -> usar status y response de Nest
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();

      this.logger.warn(
        { statusCode: status, path: url, response: body },
        'HttpException',
      );

      const payload =
        typeof body === 'string'
          ? { statusCode: status, message: body }
          : (body as Record<string, unknown>);

      return response.status(status).json({
        ...payload,
        path: url,
        timestamp: new Date().toISOString(),
      });
    }

    // Fallback -> 500
    this.logger.error(
      { path: url, err: exception },
      exception?.message ?? 'Internal server error',
    );
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'internal_server_error',
      message: exception?.message ?? 'Internal server error',
      path: url,
      timestamp: new Date().toISOString(),
    });
  }
}
