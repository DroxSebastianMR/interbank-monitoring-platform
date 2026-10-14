import {
  PrismaClient,
  type Currency,
  type TransactionDirection,
  type TransactionType,
} from '@prisma/client';

const prisma = new PrismaClient();
const DEMO_COUNT = 620;
const referenceFor = (index: number) => `DEMO-HISTORY-${String(index).padStart(4, '0')}`;
const idFor = (index: number) => `d3000000-0000-4000-8000-${String(index).padStart(12, '0')}`;

async function main(): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email: 'demo@interbank.test' } });
  if (!user) throw new Error('Demo user is missing; run the regular seed first');

  const accounts = await prisma.account.findMany({
    where: { userId: user.id, status: 'ACTIVE' },
    orderBy: { accountNumber: 'asc' },
    select: { id: true, currency: true },
  });
  if (!accounts.some((account) => account.currency === 'PEN')) {
    throw new Error('Demo user has no active PEN account');
  }

  const now = Date.now();
  const descriptions = [
    'Demo · Compra en supermercado',
    'Demo · Pago de servicios',
    'Demo · Transferencia recibida',
    'Demo · Compra en farmacia',
    'Demo · Abono de prueba',
    'Demo · Recarga celular',
  ];
  const rows = Array.from({ length: DEMO_COUNT }, (_, offset) => {
    const index = offset + 1;
    const account = accounts[offset % accounts.length];
    const credit = index % 4 === 0 || index % 11 === 0;
    const direction: TransactionDirection = credit ? 'CREDIT' : 'DEBIT';
    const type: TransactionType = credit ? 'DEPOSIT' : 'SERVICE_PAYMENT';
    const currency: Currency = account.currency;
    return {
      id: idFor(index),
      accountId: account.id,
      type,
      direction,
      status: 'COMPLETED' as const,
      amount: (((index * 37) % 29500) + 500) / 100,
      currency,
      description: descriptions[offset % descriptions.length],
      reference: referenceFor(index),
      occurredAt: new Date(now - offset * 62 * 60 * 1000),
    };
  });

  for (let offset = 0; offset < rows.length; offset += 100) {
    await prisma.transaction.createMany({
      data: rows.slice(offset, offset + 100),
      skipDuplicates: true,
    });
  }
  const count = await prisma.transaction.count({
    where: { reference: { startsWith: 'DEMO-HISTORY-' }, account: { userId: user.id } },
  });
  process.stdout.write(`Demo history ready: ${count} marked transactions; balances unchanged.\n`);
}

void main()
  .catch((error: unknown) => {
    process.stderr.write(
      `Demo history failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
