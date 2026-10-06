import { AccountStatus, Currency, Prisma, TransactionStatus, TransferKind } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import { TransfersRepository } from '@/modules/transfers/repositories/transfers.repository';
import {
  TransferFailureReason,
  type InternalTransferInput,
} from '@/modules/transfers/types/transfer.types';

describe('TransfersRepository atomic execution', () => {
  const source = {
    id: 'source',
    userId: 'owner',
    displayName: 'Origen',
    accountNumber: '2003000000001',
    currency: Currency.PEN,
    status: AccountStatus.ACTIVE,
    balance: new Prisma.Decimal('100'),
    allowsDebits: true,
  };
  const destination = {
    ...source,
    id: 'destination',
    userId: 'recipient',
    displayName: 'Destino',
    balance: new Prisma.Decimal('0'),
  };
  const input: InternalTransferInput = {
    fromAccountId: 'source',
    toAccountId: 'destination',
    amount: new Prisma.Decimal('25.50'),
    idempotencyKey: 'test-key',
    requestFingerprint: 'hash',
    operationNumber: 'TRF-TEST',
  };
  const receipt = {
    id: 'transfer',
    userId: 'owner',
    requestFingerprint: 'hash',
    amount: input.amount,
    currency: Currency.PEN,
    status: TransactionStatus.COMPLETED,
    kind: TransferKind.THIRD_PARTY,
    sourceAccount: source,
    destinationAccount: destination,
  };
  const tx = {
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
    account: { updateMany: jest.fn() },
    transfer: { findUnique: jest.fn(), create: jest.fn() },
    transaction: { createMany: jest.fn() },
  };
  const prisma = {
    account: { findFirst: jest.fn() },
    transfer: { findUnique: jest.fn() },
    $transaction: jest.fn<Promise<unknown>, [(tx: unknown) => Promise<unknown>, unknown]>(),
  };
  const repository = new TransfersRepository(prisma as unknown as PrismaService);
  beforeEach(() => {
    jest.resetAllMocks();
    prisma.account.findFirst.mockResolvedValue({ ...source, accountType: { allowsDebits: true } });
    prisma.transfer.findUnique.mockResolvedValue(null);
    prisma.$transaction.mockImplementation((callback) => callback(tx));
    tx.$queryRaw.mockResolvedValue([source, destination]);
    tx.$executeRaw.mockResolvedValue(0);
    tx.transfer.findUnique.mockResolvedValue(null);
    tx.transfer.create.mockResolvedValue(receipt);
    tx.account.updateMany.mockResolvedValue({ count: 1 });
    tx.transaction.createMany.mockResolvedValue({ count: 2 });
  });
  it('rejects insufficient funds without starting a transaction', async () => {
    prisma.account.findFirst.mockResolvedValue({
      ...source,
      balance: new Prisma.Decimal('10'),
      accountType: { allowsDebits: true },
    });
    await expect(repository.executeInternal('owner', input)).rejects.toMatchObject({
      reason: TransferFailureReason.INSUFFICIENT_FUNDS,
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('rejects insufficient funds found after locking (concurrent debit)', async () => {
    tx.$queryRaw.mockResolvedValue([{ ...source, balance: new Prisma.Decimal('10') }, destination]);
    await expect(repository.executeInternal('owner', input)).rejects.toMatchObject({
      reason: TransferFailureReason.INSUFFICIENT_FUNDS,
    });
    expect(tx.account.updateMany).not.toHaveBeenCalled();
  });
  it.each([AccountStatus.BLOCKED, AccountStatus.CLOSED])(
    'rejects %s accounts before a write transaction',
    async (status) => {
      prisma.account.findFirst.mockResolvedValue({
        ...source,
        status,
        accountType: { allowsDebits: true },
      });
      await expect(repository.executeInternal('owner', input)).rejects.toMatchObject({
        reason: TransferFailureReason.ACCOUNT_UNAVAILABLE,
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    },
  );
  it('rejects a source owned by another user even if it changes before locking', async () => {
    tx.$queryRaw.mockResolvedValue([{ ...source, userId: 'foreign' }, destination]);
    await expect(repository.executeInternal('owner', input)).rejects.toMatchObject({
      reason: TransferFailureReason.SOURCE_NOT_FOUND,
    });
    expect(tx.account.updateMany).not.toHaveBeenCalled();
  });
  it('rejects a different-currency destination', async () => {
    tx.$queryRaw.mockResolvedValue([source, { ...destination, currency: Currency.USD }]);
    await expect(repository.executeInternal('owner', input)).rejects.toMatchObject({
      reason: TransferFailureReason.CURRENCY_MISMATCH,
    });
    expect(tx.account.updateMany).not.toHaveBeenCalled();
  });
  it('replays a completed request without opening a transaction or debiting', async () => {
    prisma.transfer.findUnique.mockResolvedValue(receipt);
    expect(await repository.executeInternal('owner', input)).toMatchObject({ replayed: true });
    expect(prisma.account.findFirst).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('rejects reuse of a key with different input', async () => {
    prisma.transfer.findUnique.mockResolvedValue({ ...receipt, requestFingerprint: 'other' });
    await expect(repository.executeInternal('owner', input)).rejects.toMatchObject({
      reason: TransferFailureReason.IDEMPOTENCY_CONFLICT,
    });
  });
  it('rechecks idempotency after row locks when another request committed', async () => {
    tx.transfer.findUnique.mockResolvedValue(receipt);
    expect(await repository.executeInternal('owner', input)).toMatchObject({ replayed: true });
    expect(tx.account.updateMany).not.toHaveBeenCalled();
  });
  it('recognizes a committed replay before reporting insufficient balance', async () => {
    prisma.account.findFirst.mockResolvedValue({
      ...source,
      balance: new Prisma.Decimal(0),
      accountType: { allowsDebits: true },
    });
    prisma.transfer.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(receipt);
    expect(await repository.executeInternal('owner', input)).toMatchObject({ replayed: true });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('creates two ledger movements and an operation in the same transaction', async () => {
    expect(await repository.executeInternal('owner', input)).toMatchObject({ replayed: false });
    expect(tx.account.updateMany).toHaveBeenCalledTimes(2);
    const call = (tx.transaction.createMany.mock.calls as unknown[][])[0][0] as {
      data: { direction: string; amount: Prisma.Decimal; reference: string }[];
    };
    expect(call.data.map((entry) => entry.direction)).toEqual(['DEBIT', 'CREDIT']);
    expect(
      call.data.every(
        (entry) => entry.amount.eq('25.50') && entry.reference === input.operationNumber,
      ),
    ).toBe(true);
    const query = ((tx.$queryRaw.mock.calls as unknown[][])[0][0] as TemplateStringsArray).join(
      '?',
    );
    expect(query).toContain('ORDER BY a.id FOR UPDATE OF a');
  });
  it('aborts the transaction if the destination credit cannot be applied', async () => {
    tx.account.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    await expect(repository.executeInternal('owner', input)).rejects.toMatchObject({
      reason: TransferFailureReason.ACCOUNT_UNAVAILABLE,
    });
    expect(tx.transfer.create).not.toHaveBeenCalled();
  });
  it('maps a PostgreSQL lock timeout to a retryable business error', async () => {
    tx.$queryRaw.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('lock timeout', {
        code: 'P2010',
        clientVersion: '6',
        meta: { code: '55P03' },
      }),
    );
    await expect(repository.executeInternal('owner', input)).rejects.toMatchObject({
      reason: TransferFailureReason.TRANSFER_BUSY,
    });
  });
});
