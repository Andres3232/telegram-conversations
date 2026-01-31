import {
  applyDecorators,
  Controller,
  UseFilters,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
// import { RestExceptionFilter } from '@src/infrastructure/rest/shared/exception.filter';
// import { DeviceInterceptor } from '@src/infrastructure/interceptors/device.interceptor'

export function RestController(prefix: string) {
  return applyDecorators(
    Controller(prefix),
    UsePipes(new ValidationPipe({ whitelist: true, transform: true })),
    // UseInterceptors(DeviceInterceptor),
    // UseFilters(RestExceptionFilter),
  );
}
