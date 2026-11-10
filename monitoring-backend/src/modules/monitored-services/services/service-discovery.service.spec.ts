import { of } from 'rxjs';

import { ServiceDiscoveryService } from '@/modules/monitored-services/services/service-discovery.service';

describe('ServiceDiscoveryService', () => {
  it('discovers only declared module health checks and marks existing catalog entries', async () => {
    const get = jest.fn().mockReturnValue(of({
      data: {
        paths: {
          '/auth/health': { get: { tags: ['auth'] } },
          '/accounts/health': { get: { tags: ['accounts'] } },
          '/transfers': { get: { tags: ['transfers'] } },
          '/health': { get: { tags: ['health'] } },
        },
      },
    }));
    const catalog = {
      find: (code: string) => (code === 'auth' ? { id: 'auth' } : undefined),
    };
    const service = new ServiceDiscoveryService(
      { get } as never,
      { get: () => 'http://bank-api.local' } as never,
      catalog as never,
    );

    await expect(service.discover()).resolves.toEqual({
      source: 'openapi',
      generatedAt: expect.any(String),
      services: [
        {
          code: 'accounts',
          name: 'Accounts',
          endpoint: '/accounts/health',
          criticality: 'HIGH',
          registered: false,
        },
        {
          code: 'auth',
          name: 'Auth',
          endpoint: '/auth/health',
          criticality: 'CRITICAL',
          registered: true,
        },
      ],
    });
    expect(get).toHaveBeenCalledWith(
      'http://bank-api.local/api/docs-json',
      expect.objectContaining({ timeout: 2_500 }),
    );
  });
});
