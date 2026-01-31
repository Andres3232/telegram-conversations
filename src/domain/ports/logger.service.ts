export const LOGGER_SERVICE = 'LoggerService';

export interface LogHttpDebugRequest {
  method: any;
  headers: any;
  body: any;
}
export interface LoggerService {
  debug(message: string, context?: any);
  info(message: string, context?: any);
  warn(message: string, context?: any);
  error(message: string, context?: any);
  fatal(message: string, context?: any);
  logHttpDebugRequest(
    message: string,
    { method, headers, body }: LogHttpDebugRequest,
  ): void;
  logHttpDebugResponse(message: string, response: any): void;
}
