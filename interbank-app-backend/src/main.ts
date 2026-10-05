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

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new CompactConsoleLogger(),
  });
  const configService = app.get(ConfigService);
  const appConfig = configService.get<AppConfig>('app');

  if (!appConfig) {
    throw new Error('No se pudo cargar la configuración de la aplicación');
  }

  app.use(helmet());
  app.enableCors(buildCorsOptions(appConfig.corsOrigins));
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());
  setupSwagger(app, appConfig);

  await app.listen(appConfig.port, '0.0.0.0');

  logServerInfo(appConfig);
}

function logServerInfo(config: AppConfig): void {
  console.log('');
  console.log(`🚀 Servidor corriendo en puerto ${config.port}`);
  console.log(`🌐 API Local: http://localhost:${config.port}`);
  console.log(`📘 Swagger Local: http://localhost:${config.port}/${SWAGGER_PATHS.ui}`);
  console.log(`📄 OpenAPI JSON: http://localhost:${config.port}/${SWAGGER_PATHS.json}`);
  console.log(`🔐 CORS habilitado para: ${config.corsOrigins.join(', ')}`);
  console.log('');
}

void bootstrap();
