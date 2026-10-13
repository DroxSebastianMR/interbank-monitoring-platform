import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from '@/app.module';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { CompactConsoleLogger } from '@/common/logger/compact-console.logger';
import {
  buildCorsOptions,
  createValidationPipe,
  setupSwagger,
  SWAGGER_PATHS,
  type AppConfig,
} from '@/config';
import { docsOnlyMiddleware } from '@/config/swagger/docs-only.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new CompactConsoleLogger(),
  });
  const configService = app.get(ConfigService);
  const appConfig = configService.getOrThrow<AppConfig>('app');

  app.use(helmet());
  app.enableCors(buildCorsOptions(appConfig.corsOrigins));
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());
  if (appConfig.docsOnly) {
    app.use(docsOnlyMiddleware);
  }
  const swagger = setupSwagger(app, appConfig);

  await app.listen(appConfig.port, appConfig.docsOnly ? '127.0.0.1' : '0.0.0.0');

  logServerInfo(appConfig, swagger.operationCount);
}

function logServerInfo(config: AppConfig, operationCount: number): void {
  console.log('');
  console.log(
    `🚀 ${config.docsOnly ? 'Swagger (solo documentación)' : 'Servidor'} en puerto ${config.port}`,
  );
  console.log(`🌐 API Local: http://localhost:${config.port}`);
  console.log(`📘 Swagger Local: http://localhost:${config.port}/${SWAGGER_PATHS.ui}`);
  console.log(`📄 OpenAPI JSON: http://localhost:${config.port}/${SWAGGER_PATHS.json}`);
  console.log(`🔢 Endpoints documentados: ${operationCount}`);
  console.log(`🔐 CORS habilitado para: ${config.corsOrigins.join(', ')}`);
  console.log('');
}

void bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
