import { BadRequestException } from '@nestjs/common';

import { HomeCacheService } from '@/modules/home/services/home-cache.service';
import { SimulationService } from '@/modules/simulation/services/simulation.service';
import { TransfersRepository } from '@/modules/transfers/repositories/transfers.repository';
import { TransfersService } from '@/modules/transfers/services/transfers.service';
import {
  TransferDomainError,
  TransferFailureReason,
} from '@/modules/transfers/types/transfer.types';

describe('TransfersService', () => {
  const simulation = { apply: jest.fn().mockResolvedValue(undefined) };
  const homeCache = { invalidate: jest.fn().mockResolvedValue(undefined) };

  beforeEach(() => jest.clearAllMocks());

  it('serializes a completed transfer without losing monetary precision', async () => {
    const repository = {
      executeInternal: jest.fn().mockResolvedValue({
        id: 'transfer-id',
        sourceAccountId: 'source-id',
        destinationAccountId: 'destination-id',
        amount: { toFixed: () => '125.50' },
        currency: 'PEN',
        status: 'COMPLETED',
        createdAt: new Date('2026-10-05T00:00:00.000Z'),
        completedAt: new Date('2026-10-05T00:00:00.000Z'),
      }),
    };
    const service = new TransfersService(
      simulation as unknown as SimulationService,
      repository as unknown as TransfersRepository,
      homeCache as unknown as HomeCacheService,
    );

    const result = await service.create('user-id', {
      fromAccountId: '00000000-0000-4000-8000-000000000001',
      toAccountId: '00000000-0000-4000-8000-000000000002',
      amount: 125.5,
    });

    expect(result.amount).toBe('125.50');
    expect(result.status).toBe('COMPLETED');
  });

  it('maps insufficient funds to a safe bad request', async () => {
    const repository = {
      executeInternal: jest
        .fn()
        .mockRejectedValue(new TransferDomainError(TransferFailureReason.INSUFFICIENT_FUNDS)),
    };
    const service = new TransfersService(
      simulation as unknown as SimulationService,
      repository as unknown as TransfersRepository,
      homeCache as unknown as HomeCacheService,
    );

    await expect(
      service.create('user-id', {
        fromAccountId: '00000000-0000-4000-8000-000000000001',
        toAccountId: '00000000-0000-4000-8000-000000000002',
        amount: 999999,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
