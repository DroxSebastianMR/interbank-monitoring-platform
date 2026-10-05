import 'reflect-metadata';
import { validate } from './env.validation';
describe('environment validation', () => {
  it('rejects missing critical values', () => {
    expect(() => validate({})).toThrow('Invalid environment');
  });
  it('accepts string environment variables', () => {
    expect(
      validate({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        JWT_SECRET: '12345678901234567890123456789012',
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
        AI_SERVICE_URL: 'http://localhost:8000',
        APP_BACKEND_URL: 'http://localhost:8080',
      }).REDIS_PORT,
    ).toBe(6379);
  });
});
