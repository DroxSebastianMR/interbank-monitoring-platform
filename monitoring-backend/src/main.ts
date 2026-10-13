import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from '@/app.module';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { CompactConsoleLogger } from '@/common/logger/compact-console.logger';
import { buildCorsOptions, parseCorsOrigins } from '@/config/cors.config';
import { setupSwagger } from '@/config/swagger.config';
import { createValidationPipe } from '@/config/validation.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new CompactConsoleLogger(),
  });
  const config = app.get(ConfigService);
  const port = config.get<number>('port', 4000);
  const corsOrigins = parseCorsOrigins(config.get<string>('corsOrigins'));

  app.use(helmet());
  app.enableCors(buildCorsOptions(corsOrigins));
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());
  setupSwagger(app, port);

  await app.listen(port, '0.0.0.0');

  logServerInfo(port, corsOrigins);
}

function logServerInfo(port: number, corsOrigins: string[]): void {
  console.log('');
  console.log(`🚀 Servidor corriendo en puerto ${port}`);
  console.log(`🌐 API Local: http://localhost:${port}`);
  console.log(`📘 Swagger Local: http://localhost:${port}/api/docs`);
  console.log(`📄 OpenAPI JSON: http://localhost:${port}/api/docs-json`);
  console.log(`🔐 CORS habilitado para: ${corsOrigins.join(', ')}`);
  console.log('');
}

void bootstrap();
