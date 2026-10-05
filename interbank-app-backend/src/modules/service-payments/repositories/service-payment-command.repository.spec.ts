import { AccountStatus, Currency } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import { ServicePaymentFailureReason } from '@/modules/service-payments/enums/service-payment-failure-reason.enum';
import { ServicePaymentCommandRepository } from '@/modules/service-payments/repositories/service-payment-command.repository';
import type { ExecuteServicePaymentInput } from '@/modules/service-payments/types/service-payment.types';

describe('ServicePaymentCommandRepository account eligibility', () => {
  const transaction = {
    servicePayment: { findUnique: jest.fn(), create: jest.fn() },
    account: { findFirst: jest.fn(), updateMany: jest.fn() },
    serviceAgreement: { findFirst: jest.fn() },
  };
  const prisma = {
    servicePayment: { findUnique: jest.fn() },
    $transaction: jest.fn<Promise<unknown>, [(tx: unknown) => Promise<unknown>, unknown]>(),
  };
  const repository = new ServicePaymentCommandRepository(prisma as unknown as PrismaService);
  const account = {
    id: 'account',
    currency: Currency.PEN,
    status: AccountStatus.ACTIVE,
    accountType: { allowsDebits: true },
  };
  const input: ExecuteServicePaymentInput = {
    accountId: 'account',
    serviceCode: 'service',
    customerReference: 'customer',
    amount: 10,
    idempotencyKey: 'key',
    requestFingerprint: 'fingerprint',
    operationNumber: 'operation',
  };
  beforeEach(() => {
    jest.resetAllMocks();
    prisma.servicePayment.findUnique.mockResolvedValue(null);
    prisma.$transaction.mockImplementation((callback) => callback(transaction));
    transaction.servicePayment.findUnique.mockResolvedValue(null);
    transaction.account.findFirst.mockResolvedValue(account);
    transaction.serviceAgreement.findFirst.mockResolvedValue(null);
  });
  it.each([AccountStatus.BLOCKED, AccountStatus.CLOSED])(
    'rejects payments from a %s account before mutation',
    async (status) => {
      transaction.account.findFirst.mockResolvedValue({ ...account, status });
      await expect(repository.execute('owner', input)).rejects.toMatchObject({
        reason: ServicePaymentFailureReason.ACCOUNT_UNAVAILABLE,
      });
      expect(transaction.account.updateMany).not.toHaveBeenCalled();
      expect(transaction.servicePayment.create).not.toHaveBeenCalled();
    },
  );
  it('rejects generic payments from restricted deposit products', async () => {
    transaction.account.findFirst.mockResolvedValue({
      ...account,
      accountType: { allowsDebits: false },
    });
    await expect(repository.execute('owner', input)).rejects.toMatchObject({
      reason: ServicePaymentFailureReason.ACCOUNT_UNAVAILABLE,
    });
    expect(transaction.account.updateMany).not.toHaveBeenCalled();
  });
});
