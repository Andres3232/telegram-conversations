import { ArgumentsHost, Catch, HttpException, HttpStatus } from '@nestjs/common';
import { DomainError } from '@src/domain/errors/domain.error';

@Catch()
export class ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response: any = ctx.getResponse();
    const request: any = ctx.getRequest();

    // Si no hay response (edge case), no podemos contestar.
    if (!response) return;

    const url = request?.url;

    // Dominios -> 400
    if (exception instanceof DomainError) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'domain_error',
        message: exception.message,
        code: exception.errorCode,
        data: exception.data,
        path: url,
        timestamp: new Date().toISOString(),
      });
    }

    // HttpException (incluye ValidationPipe) -> usar status y response de Nest
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();

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
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'internal_server_error',
      message: exception?.message ?? 'Internal server error',
      path: url,
      timestamp: new Date().toISOString(),
    });
  }
}