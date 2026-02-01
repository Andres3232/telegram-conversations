import { NestFactory } from '@nestjs/core';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

import { AppModule } from '@src/app.module';
import { swaggerConfig } from '@src/config/swagger.config';

function sortObject(obj) {
  return Object.keys(obj)
      .sort() // Sort keys alphabetically
      .reduce((sortedObj, key) => {
          sortedObj[key] = obj[key];
          return sortedObj;
      }, {});
}

const optionsCors = {
  "description": "Enable CORS by returning correct headers",
  "consumes": [
    "application/json"
  ],
  "produces": [
    "application/json"
  ],
  "x-amazon-apigateway-integration": {
    "type": "mock",
    "requestTemplates": {
      "application/json": "{\"statusCode\": 201 }"
    },
    "responses": {
      "default": {
        "statusCode": "201",
        "responseParameters": {
          "method.response.header.Access-Control-Allow-Headers": "'Access-Control-Allow-Origin,Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-global-consumer-id,cache-control'",
          "method.response.header.Access-Control-Allow-Methods": "'*'",
          "method.response.header.Access-Control-Allow-Origin": "'*'"
        }
      }
    }
  },
  "responses": {
    "201": {
      "description": "201 response",
      "schema": {
        "$ref": "#/definitions/Empty"
      },
      "headers": {
        "Access-Control-Allow-Origin": {
          "type": "string"
        },
        "Access-Control-Allow-Methods": {
          "type": "string"
        },
        "Access-Control-Allow-Headers": {
          "type": "string"
        }
      }
    }
  }
};

async function generateSwagger() {
  const app = await NestFactory.create(AppModule);

  const document = swaggerConfig(app);

  const outputPath = join(__dirname, '../../docs');
  if (!existsSync(outputPath)) {
    mkdirSync(outputPath);
  }

  const swaggerJsonPath = join(outputPath, 'swagger.json');
  Object.values(document.paths).forEach(path => {
  // @ts-expect-error - agregamos options para CORS en swagger.json
    path.options = optionsCors;

  });

  document.paths = sortObject(document.paths);
  
  writeFileSync(swaggerJsonPath, JSON.stringify(document, null, 2));

  await app.close();
}

generateSwagger().catch((err) => {
  console.error('Error generating Swagger document', err);
  process.exit(1);
});
