import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { readFileSync } from 'fs';
import { ConfigKeys } from './config-keys';

const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../../package.json'), 'utf8'),
);

export function swaggerConfig(app: INestApplication) {
  const prefix = process.env[ConfigKeys.GLOBAL_PREFIX];
  if (prefix) {
    app.setGlobalPrefix(prefix);
  }
  const config = new DocumentBuilder()
  .setTitle('Telegram Conversations API')
  .setDescription('API documentation')
    .setVersion(packageJson.version)
  .addBearerAuth()
  .addTag('Auth')
  .addTag('Conversations')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  return document;
}
