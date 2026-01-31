import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ensureDatabaseExists } from './scripts/create-db';
import { ExceptionFilter } from './infrastructure/rest/exception-filter.filter';
import { swaggerConfig } from './config/swagger.config';

async function bootstrap() {
  await ensureDatabaseExists(process.env.POSTGRES_DB || 'customer_product');

  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(app.get(ExceptionFilter));
  swaggerConfig(app);
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
