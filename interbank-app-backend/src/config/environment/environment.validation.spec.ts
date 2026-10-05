import 'reflect-metadata';

import { validateEnvironment } from '@/config/environment/environment.validation';

describe('environment validation', () => {
  it('rejects missing secrets and database URLs', () => {
    expect(() => validateEnvironment({})).toThrow('Invalid environment');
  });

  it('accepts application and migration database URLs', () => {
    const environment = validateEnvironment({
      APP_PORT: '3000',
      DATABASE_URL: 'postgresql://user:pass@localhost:6543/db?pgbouncer=true',
      DIRECT_URL: 'postgresql://user:pass@localhost:5432/db',
      JWT_SECRET: '12345678901234567890123456789012',
    });

    expect(environment.APP_PORT).toBe(3000);
  });
});
