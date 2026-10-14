import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import type { AppConfig } from '@/config/application/app-config.interface';
import {
  SWAGGER_AUTH_NAME,
  SWAGGER_LOCAL_SERVER_DESCRIPTION,
  SWAGGER_PATHS,
  SWAGGER_SITE_TITLE,
} from '@/config/swagger/swagger.constants';

export interface SwaggerSummary {
  operationCount: number;
}

export function setupSwagger(app: INestApplication, appConfig: AppConfig): SwaggerSummary {
  const config = new DocumentBuilder()
    .setTitle(appConfig.name)
    .setDescription(appConfig.description)
    .setVersion(appConfig.version)
    .addServer(`http://localhost:${appConfig.port}`, SWAGGER_LOCAL_SERVER_DESCRIPTION)
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, SWAGGER_AUTH_NAME)
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const operationCount = Object.values(document.paths).reduce(
    (count, pathItem) =>
      count +
      Object.keys(pathItem ?? {}).filter((method) =>
        ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].includes(method),
      ).length,
    0,
  );

  SwaggerModule.setup(SWAGGER_PATHS.ui, app, document, {
    jsonDocumentUrl: SWAGGER_PATHS.json,
    customSiteTitle: SWAGGER_SITE_TITLE,
    swaggerOptions: {
      displayRequestDuration: true,
      filter: true,
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
  return { operationCount };
}
