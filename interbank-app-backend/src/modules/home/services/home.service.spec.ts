import { HomeRepository } from '@/modules/home/repositories/home.repository';
import { HomeCacheService } from '@/modules/home/services/home-cache.service';
import { HomeService } from '@/modules/home/services/home.service';
import { SimulationService } from '@/modules/simulation/services/simulation.service';

describe('HomeService', () => {
  it('builds PEN and USD summaries and masks account numbers', async () => {
    const repository = {
      getSnapshot: jest.fn().mockResolvedValue({
        firstName: 'Cliente',
        accounts: [
          {
            id: 'pen-account',
            displayName: 'Cuenta Soles',
            accountNumber: '2003000000001',
            balance: '4250.50',
            currency: 'PEN',
            type: 'SAVINGS',
          },
          {
            id: 'usd-account',
            displayName: 'Cuenta Dólares',
            accountNumber: '2003000000002',
            balance: '850.75',
            currency: 'USD',
            type: 'SAVINGS',
          },
        ],
        hasNewCard: true,
        recentTransactions: [],
      }),
    };
    const simulation = { apply: jest.fn().mockResolvedValue(undefined) };
    const cache = {
      find: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };
    const service = new HomeService(
      repository as unknown as HomeRepository,
      simulation as unknown as SimulationService,
      cache as unknown as HomeCacheService,
    );

    const result = await service.getHome('user-id');

    expect(result.balances).toEqual([
      { currency: 'PEN', availableBalance: '4250.50' },
      { currency: 'USD', availableBalance: '850.75' },
    ]);
    expect(result.accounts[0]?.maskedAccountNumber).toBe('*********0001');
    expect(result.quickActions.map(({ path }) => path)).toEqual([
      '/plinear',
      '/transfers',
      '/service-payments',
      '/mobile-top-up',
      '/exchange',
      '/accounts/cards',
      '/accounts/products',
      '/operations',
    ]);
    expect(result.quickActions.find(({ code }) => code === 'CARD')?.badge).toBe('Nuevo');
    expect(cache.set).toHaveBeenCalled();
  });
});
