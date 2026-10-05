import { ConfigService } from '@nestjs/config';

import { CacheStoreService } from '@/common/cache/cache-store.service';
import { AuthSessionCacheService } from '@/modules/auth/services/auth-session-cache.service';

describe('AuthSessionCacheService', () => {
  it('stores only an opaque session reference and rotates it', async () => {
    const configService = new ConfigService({
      auth: {
        jwtSecret: 'x'.repeat(32),
        sessionPepper: 'y'.repeat(32),
        accessTokenTtlSeconds: 900,
        sessionTtlSeconds: 300,
      },
      cache: {
        driver: 'memory',
        redis: { host: 'localhost', port: 6379, database: 0, keyPrefix: 'test:' },
      },
    });
    const cache = new CacheStoreService(configService);
    const service = new AuthSessionCacheService(configService, cache);
    const issued = await service.create(
      {
        id: '00000000-0000-0000-0000-000000000010',
        documentNumber: '12345678',
        email: 'demo@interbank.test',
        firstName: 'Cliente',
        lastName: 'Demo',
      },
      'credential-proof',
      '550e8400-e29b-41d4-a716-446655440000',
    );

    expect(await service.find(issued.token)).toMatchObject({
      user: { id: '00000000-0000-0000-0000-000000000010' },
      credentialProof: 'credential-proof',
    });

    const rotated = await service.rotate(issued.token, issued.value);
    expect(await service.find(issued.token)).toBeNull();
    expect(await service.find(rotated.token)).not.toBeNull();
  });
});
