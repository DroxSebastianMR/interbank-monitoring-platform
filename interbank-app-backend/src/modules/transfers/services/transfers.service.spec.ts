import { BadRequestException, ConflictException } from '@nestjs/common';
import { Currency, Prisma, TransactionStatus, TransferKind } from '@prisma/client';
import { HomeCacheService } from '@/modules/home/services/home-cache.service';
import { SimulationService } from '@/modules/simulation/services/simulation.service';
import { TransfersRepository } from '@/modules/transfers/repositories/transfers.repository';
import { TransfersService } from '@/modules/transfers/services/transfers.service';
import {
  TransferDomainError,
  TransferFailureReason,
} from '@/modules/transfers/types/transfer.types';

describe('TransfersService', () => {
  const simulation = { apply: jest.fn() };
  const cache = { invalidate: jest.fn() };
  const repository = { executeInternal: jest.fn() };
  const service = new TransfersService(
    simulation as unknown as SimulationService,
    repository as unknown as TransfersRepository,
    cache as unknown as HomeCacheService,
  );
  const dto = {
    fromAccountId: '00000000-0000-4000-8000-000000000001',
    toAccountId: '00000000-0000-4000-8000-000000000002',
    amount: 25.5,
  };
  const receipt = {
    id: 'transfer',
    userId: 'sender',
    sourceAccountId: dto.fromAccountId,
    destinationAccountId: dto.toAccountId,
    operationNumber: 'TRF-ONE',
    kind: TransferKind.THIRD_PARTY,
    status: TransactionStatus.COMPLETED,
    amount: new Prisma.Decimal('25.50'),
    currency: Currency.PEN,
    description: null,
    createdAt: new Date('2026-10-05'),
    completedAt: new Date('2026-10-05'),
    sourceAccount: {
      id: dto.fromAccountId,
      userId: 'sender',
      displayName: 'Origen',
      accountNumber: '2003000000001',
      currency: Currency.PEN,
    },
    destinationAccount: {
      id: dto.toAccountId,
      userId: 'recipient',
      displayName: 'Destino',
      accountNumber: '2003000000002',
      currency: Currency.PEN,
    },
  };
  beforeEach(() => {
    jest.resetAllMocks();
    simulation.apply.mockResolvedValue(undefined);
    cache.invalidate.mockResolvedValue(undefined);
    repository.executeInternal.mockResolvedValue({ transfer: receipt, replayed: false });
  });
  it('requires an idempotency key before querying persistence', async () => {
    await expect(service.create('sender', dto)).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.executeInternal).not.toHaveBeenCalled();
  });
  it.each([0, -1, 0.001, Number.NaN, Number.POSITIVE_INFINITY, 1000000000000])(
    'rejects invalid amount %s immediately',
    async (amount) => {
      await expect(
        service.create('sender', { ...dto, amount }, 'transfer-key'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.executeInternal).not.toHaveBeenCalled();
    },
  );
  it('serializes precise money, masks numbers, and invalidates both participant caches', async () => {
    const result = await service.create('sender', dto, 'transfer-key');
    expect(result.amount).toBe('25.50');
    expect(result.destination.maskedAccountNumber).toBe('*********0002');
    expect(result).not.toHaveProperty('requestFingerprint');
    expect(result).not.toHaveProperty('userId');
    expect(cache.invalidate).toHaveBeenCalledWith('sender');
    expect(cache.invalidate).toHaveBeenCalledWith('recipient');
  });
  it('returns a confirmed transfer even if a cache invalidation fails', async () => {
    cache.invalidate.mockRejectedValue(new Error('cache unavailable'));
    expect(await service.create('sender', dto, 'transfer-key')).toMatchObject({
      status: 'COMPLETED',
    });
  });
  it('returns replay status', async () => {
    repository.executeInternal.mockResolvedValue({ transfer: receipt, replayed: true });
    expect(await service.create('sender', dto, 'transfer-key')).toMatchObject({ replayed: true });
  });
  it('exposes the insufficient funds enum in a safe error response', async () => {
    repository.executeInternal.mockRejectedValue(
      new TransferDomainError(TransferFailureReason.INSUFFICIENT_FUNDS),
    );
    await expect(service.create('sender', dto, 'transfer-key')).rejects.toMatchObject({
      response: { code: TransferFailureReason.INSUFFICIENT_FUNDS },
    });
  });
  it('maps idempotency conflicts to 409', async () => {
    repository.executeInternal.mockRejectedValue(
      new TransferDomainError(TransferFailureReason.IDEMPOTENCY_CONFLICT),
    );
    await expect(service.create('sender', dto, 'transfer-key')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
