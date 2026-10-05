import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  TransactionDirection,
  TransactionStatus,
  TransactionType,
  Currency,
} from '@prisma/client';
import { ListTransactionsQueryDto } from '@/modules/accounts/dto/list-transactions-query.dto';
import { AccountTransactionsRepository } from '@/modules/accounts/repositories/account-transactions.repository';
import { AccountsService } from '@/modules/accounts/services/accounts.service';
import { AccountTransactionsService } from '@/modules/accounts/services/account-transactions.service';
import { SimulationService } from '@/modules/simulation/services/simulation.service';

describe('AccountTransactionsService', () => {
  const repository = { findPage: jest.fn(), findPosition: jest.fn() };
  const accounts = { requireOwnedAccount: jest.fn() };
  const simulation = { apply: jest.fn().mockResolvedValue(undefined) };
  const service = new AccountTransactionsService(
    repository as unknown as AccountTransactionsRepository,
    accounts as unknown as AccountsService,
    simulation as unknown as SimulationService,
  );
  const movement = (id: string) => ({
    id,
    type: TransactionType.DEPOSIT,
    direction: TransactionDirection.CREDIT,
    status: TransactionStatus.COMPLETED,
    amount: new Prisma.Decimal('10.05'),
    currency: Currency.PEN,
    description: 'Abono',
    reference: null,
    occurredAt: new Date('2026-10-05T00:00:00Z'),
  });
  beforeEach(() => {
    jest.resetAllMocks();
    simulation.apply.mockResolvedValue(undefined);
    accounts.requireOwnedAccount.mockResolvedValue({ id: 'account' });
  });
  it('returns the last visible ID as cursor and does not expose the lookahead row', async () => {
    repository.findPage.mockResolvedValue([movement('3'), movement('2'), movement('1')]);
    const result = await service.page('owner', 'account', {
      ...new ListTransactionsQueryDto(),
      limit: 2,
    });
    expect(result.items.map((item) => item.id)).toEqual(['3', '2']);
    expect(result.nextCursor).toBe('2');
    expect(result.hasMore).toBe(true);
    expect(result.items[0].amount).toBe('10.05');
  });
  it('returns no cursor for the final page', async () => {
    repository.findPage.mockResolvedValue([movement('1')]);
    expect(await service.page('owner', 'account', new ListTransactionsQueryDto())).toMatchObject({
      hasMore: false,
      nextCursor: null,
    });
  });
  it('rejects a cursor belonging to a different account', async () => {
    repository.findPosition.mockResolvedValue(null);
    await expect(
      service.page('owner', 'account', { ...new ListTransactionsQueryDto(), cursor: 'foreign' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.findPage).not.toHaveBeenCalled();
  });
  it('checks ownership before querying transactions', async () => {
    accounts.requireOwnedAccount.mockRejectedValue(new NotFoundException());
    await expect(
      service.page('owner', 'foreign', new ListTransactionsQueryDto()),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.findPage).not.toHaveBeenCalled();
  });
  it('rejects a reversed date range', async () => {
    await expect(
      service.page('owner', 'account', {
        ...new ListTransactionsQueryDto(),
        from: '2026-10-06',
        to: '2026-10-05',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.findPage).not.toHaveBeenCalled();
  });
});
