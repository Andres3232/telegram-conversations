import {
  applyDecorators,
  Controller,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';


export function RestController(prefix: string) {
  return applyDecorators(
    Controller(prefix),
    UsePipes(new ValidationPipe({ whitelist: true, transform: true })),
  );
}
