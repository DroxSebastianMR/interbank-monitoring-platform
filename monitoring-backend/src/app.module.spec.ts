import { Test } from '@nestjs/testing';

describe('AppModule dependency graph', () => {
  it('resolves all feature modules and exported authentication dependencies', async () => {
    const values = {
      DATABASE_URL: 'postgresql://test:test@127.0.0.1:5432/test?schema=monitoring',
      JWT_SECRET: '0123456789abcdef0123456789abcdef',
      REDIS_HOST: '127.0.0.1',
      REDIS_PORT: '6379',
      AI_SERVICE_URL: 'http://127.0.0.1:8000',
      APP_BACKEND_URL: 'http://127.0.0.1:8080',
    };
    const previous = Object.fromEntries(
      Object.keys(values).map((name) => [name, process.env[name]]),
    );
    Object.assign(process.env, values);

    try {
      const { AppModule } = await import('@/app.module');
      const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
      await module.close();
    } finally {
      for (const [name, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
    }
  });
});
