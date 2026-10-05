import { AccountStatus, Currency } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import { TransfersRepository } from '@/modules/transfers/repositories/transfers.repository';
import {
  TransferDomainError,
  TransferFailureReason,
} from '@/modules/transfers/types/transfer.types';

describe('TransfersRepository account eligibility', () => {
  const transaction = {
    account: { findFirst: jest.fn(), findUnique: jest.fn(), updateMany: jest.fn() },
    transfer: { create: jest.fn() },
    transaction: { createMany: jest.fn() },
  };
  const prisma = { $transaction: jest.fn<Promise<unknown>, [(tx: unknown) => Promise<unknown>]>() };
  const repository = new TransfersRepository(prisma as unknown as PrismaService);
  const source = {
    id: 'source',
    currency: Currency.PEN,
    status: AccountStatus.ACTIVE,
    accountType: { allowsDebits: true },
  };
  const destination = { ...source, id: 'destination', displayName: 'Destino' };
  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation((callback) => callback(transaction));
    transaction.account.findFirst.mockResolvedValue(source);
    transaction.account.findUnique.mockResolvedValue(destination);
  });
  it.each([AccountStatus.BLOCKED, AccountStatus.CLOSED])(
    'rejects a %s source before debiting',
    async (status) => {
      transaction.account.findFirst.mockResolvedValue({ ...source, status });
      await expect(
        repository.executeInternal('owner', {
          fromAccountId: 'source',
          toAccountId: 'destination',
          amount: 1,
        }),
      ).rejects.toMatchObject({ reason: TransferFailureReason.ACCOUNT_UNAVAILABLE });
      expect(transaction.account.updateMany).not.toHaveBeenCalled();
    },
  );
  it('rejects CTS/term deposits before debiting', async () => {
    transaction.account.findFirst.mockResolvedValue({
      ...source,
      accountType: { allowsDebits: false },
    });
    await expect(
      repository.executeInternal('owner', {
        fromAccountId: 'source',
        toAccountId: 'destination',
        amount: 1,
      }),
    ).rejects.toBeInstanceOf(TransferDomainError);
    expect(transaction.account.updateMany).not.toHaveBeenCalled();
  });
  it('rejects an inactive destination before debiting', async () => {
    transaction.account.findUnique.mockResolvedValue({
      ...destination,
      status: AccountStatus.BLOCKED,
    });
    await expect(
      repository.executeInternal('owner', {
        fromAccountId: 'source',
        toAccountId: 'destination',
        amount: 1,
      }),
    ).rejects.toMatchObject({ reason: TransferFailureReason.ACCOUNT_UNAVAILABLE });
    expect(transaction.account.updateMany).not.toHaveBeenCalled();
  });
  it('rechecks eligibility during balance updates and aborts if the destination changed state', async () => {
    transaction.account.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });
    await expect(
      repository.executeInternal('owner', {
        fromAccountId: 'source',
        toAccountId: 'destination',
        amount: 1,
      }),
    ).rejects.toMatchObject({ reason: TransferFailureReason.ACCOUNT_UNAVAILABLE });
    expect(transaction.account.updateMany).toHaveBeenNthCalledWith(1, {
      where: {
        id: 'source',
        userId: 'owner',
        status: AccountStatus.ACTIVE,
        accountType: { allowsDebits: true },
        balance: { gte: 1 },
      },
      data: { balance: { decrement: 1 } },
    });
    expect(transaction.transfer.create).not.toHaveBeenCalled();
  });
});
