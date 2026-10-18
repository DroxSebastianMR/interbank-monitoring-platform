import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import type { AppConfig } from '@/config/application/app-config.interface';
import { registerEndpointCatalog } from '@/modules/metrics/endpoint-metrics';
import {
  SWAGGER_AUTH_NAME,
  SWAGGER_LOCAL_SERVER_DESCRIPTION,
  SWAGGER_PATHS,
  SWAGGER_SITE_TITLE,
} from '@/config/swagger/swagger.constants';

export function setupSwagger(app: INestApplication, appConfig: AppConfig): void {
  const config = new DocumentBuilder()
    .setTitle(appConfig.name)
    .setDescription(appConfig.description)
    .setVersion(appConfig.version)
    .addServer(`http://localhost:${appConfig.port}`, SWAGGER_LOCAL_SERVER_DESCRIPTION)
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, SWAGGER_AUTH_NAME)
    .build();

  const document = SwaggerModule.createDocument(app, config);
  registerEndpointCatalog(document);

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
}
