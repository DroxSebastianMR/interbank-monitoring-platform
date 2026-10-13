import { Test } from '@nestjs/testing';

import { setupSwagger } from '@/config/swagger/swagger.config';
import type { AppConfig } from '@/config/application/app-config.interface';

describe('Swagger inventory', () => {
  it('documents real module routes without initializing PostgreSQL or Redis', async () => {
    const values = {
      DATABASE_URL: 'postgresql://docs:docs@127.0.0.1:5432/docs?schema=monitoring',
      JWT_SECRET: '0123456789abcdef0123456789abcdef',
      MONITORING_DOCS_ONLY: 'true',
    };
    const previous = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
    Object.assign(process.env, values);

    try {
      const { AppModule } = await import('@/app.module');
      const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
      const app = module.createNestApplication();
      const config: AppConfig = {
        name: 'Monitoring Platform API',
        description: 'Monitoring API',
        version: '0.1.0',
        port: 4000,
        env: 'test',
        docsOnly: true,
        corsOrigins: [],
      };
      const result = setupSwagger(app, config);
      expect(result.operationCount).toBeGreaterThanOrEqual(30);
      await app.close();
    } finally {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });
});
