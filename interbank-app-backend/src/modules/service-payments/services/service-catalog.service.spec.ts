import { Prisma } from '@prisma/client';

import { ServiceCatalogRepository } from '@/modules/service-payments/repositories/service-catalog.repository';
import { ServiceCatalogService } from '@/modules/service-payments/services/service-catalog.service';
import { ServicePaymentsCacheService } from '@/modules/service-payments/services/service-payments-cache.service';

describe('ServiceCatalogService', () => {
  const repository = {
    findCategories: jest.fn(),
    findProviders: jest.fn(),
  };
  const cache = {
    categories: jest.fn().mockResolvedValue(null),
    setCategories: jest.fn().mockResolvedValue(undefined),
    providers: jest.fn().mockResolvedValue(null),
    setProviders: jest.fn().mockResolvedValue(undefined),
  };
  const service = new ServiceCatalogService(
    repository as unknown as ServiceCatalogRepository,
    cache as unknown as ServicePaymentsCacheService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    cache.categories.mockResolvedValue(null);
    cache.providers.mockResolvedValue(null);
  });

  it('maps the category provider count for the mobile catalog', async () => {
    repository.findCategories.mockResolvedValue([
      {
        code: 'UTILITIES',
        name: 'Servicios básicos',
        description: 'Luz y agua',
        iconKey: 'home-utilities',
        _count: { providers: 2 },
      },
    ]);

    await expect(service.categories()).resolves.toEqual([
      expect.objectContaining({ code: 'UTILITIES', providerCount: 2 }),
    ]);
  });

  it('serializes agreement monetary values without losing precision', async () => {
    repository.findProviders.mockResolvedValue([
      {
        code: 'LUZ_DEL_SUR',
        name: 'Luz del Sur',
        agreements: [
          {
            code: 'LUZ_DEL_SUR_ELECTRICIDAD',
            commissionAmount: new Prisma.Decimal(0),
            minimumAmount: new Prisma.Decimal(1),
            maximumAmount: null,
          },
        ],
      },
    ]);

    const result = await service.providers({ limit: 20 });
    expect(result[0]?.agreements[0]).toEqual(
      expect.objectContaining({ commissionAmount: '0.00', minimumAmount: '1.00' }),
    );
  });
});
