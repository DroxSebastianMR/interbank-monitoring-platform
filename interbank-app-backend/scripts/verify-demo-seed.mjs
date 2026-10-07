import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  const user = await prisma.user.findUnique({
    where: { email: 'demo@interbank.test' },
    select: {
      id: true,
      documentNumber: true,
      email: true,
      firstName: true,
      lastName: true,
      accounts: {
        orderBy: { accountNumber: 'asc' },
        select: {
          id: true,
          displayName: true,
          accountNumber: true,
          cci: true,
          balance: true,
          currency: true,
          type: true,
          status: true,
          accountType: { select: { code: true, name: true } },
        },
      },
      cards: {
        orderBy: { lastFour: 'asc' },
        select: {
          id: true,
          displayName: true,
          lastFour: true,
          kind: true,
          format: true,
          status: true,
          expiresAt: true,
          cardType: { select: { code: true, name: true, network: true } },
          creditBalances: {
            select: { currency: true, creditLimit: true, outstandingBalance: true },
          },
        },
      },
    },
  });

  if (!user) throw new Error('Demo seed user was not found');

  const [
    categories,
    providers,
    agreements,
    debts,
    transactions,
    demoDebts,
    payments,
    savedPayments,
  ] = await Promise.all([
    prisma.serviceCategory.count(),
    prisma.serviceProvider.count(),
    prisma.serviceAgreement.count(),
    prisma.serviceDebt.count(),
    prisma.transaction.count(),
    prisma.serviceDebt.findMany({
      orderBy: { invoiceNumber: 'asc' },
      select: {
        id: true,
        customerReference: true,
        invoiceNumber: true,
        amount: true,
        currency: true,
        status: true,
        serviceAgreement: {
          select: {
            code: true,
            name: true,
            provider: { select: { code: true, name: true } },
          },
        },
      },
    }),
    prisma.servicePayment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        accountId: true,
        debtId: true,
        idempotencyKey: true,
        customerReference: true,
        amount: true,
        status: true,
        serviceAgreement: { select: { code: true } },
      },
    }),
    prisma.savedServicePayment.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        alias: true,
        customerReference: true,
        serviceAgreement: { select: { code: true } },
      },
    }),
  ]);

  process.stdout.write(
    `${JSON.stringify(
      {
        user,
        counts: { categories, providers, agreements, debts, transactions },
        demoDebts,
        payments,
        savedPayments,
      },
      null,
      2,
    )}\n`,
  );
} finally {
  await prisma.$disconnect();
}
