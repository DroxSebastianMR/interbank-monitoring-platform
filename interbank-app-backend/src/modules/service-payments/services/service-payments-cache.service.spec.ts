import { CacheStoreService } from '@/common/cache/cache-store.service';
import { ServicePaymentsCacheService } from '@/modules/service-payments/services/service-payments-cache.service';
import { createHash } from 'node:crypto';

describe('ServicePaymentsCacheService', () => {
  const store = {
    get: jest.fn(),
    set: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
  };
  const cache = new ServicePaymentsCacheService(store as unknown as CacheStoreService);

  beforeEach(() => jest.clearAllMocks());

  it('serializes catalog responses with a bounded TTL', async () => {
    await cache.setCategories([{ code: 'UTILITIES' }]);

    expect(store.set).toHaveBeenCalledWith(
      'service-payments:catalog:categories',
      '[{"code":"UTILITIES"}]',
      300,
    );
  });

  it('uses the same deterministic key to cache and invalidate an inquiry', async () => {
    await cache.setDebts('LUZ_DEL_SUR_ELECTRICIDAD', '123456789', { debts: [] });
    const hash = createHash('sha256').update('LUZ_DEL_SUR_ELECTRICIDAD|123456789').digest('hex');
    const key = `service-payments:catalog:debts:${hash}`;

    await cache.invalidateDebts('LUZ_DEL_SUR_ELECTRICIDAD', '123456789');
    expect(store.delete).toHaveBeenCalledWith(key);
  });
});
