import {
  AccountType,
  CardFormat,
  CardKind,
  CardNetwork,
  Currency,
  type PrismaClient,
} from '@prisma/client';

const ACCOUNT_TYPES = [
  {
    id: '50000000-0000-4000-8000-000000000001',
    code: 'SIMPLE',
    name: 'Cuenta Simple',
    description: 'Cuenta de ahorro de libre disponibilidad',
    type: AccountType.SAVINGS,
    allowsDebits: true,
    displayOrder: 10,
  },
  {
    id: '50000000-0000-4000-8000-000000000002',
    code: 'SALARY',
    name: 'Cuenta Sueldo',
    description: 'Cuenta de ahorro para recibir remuneraciones',
    type: AccountType.SAVINGS,
    allowsDebits: true,
    displayOrder: 20,
  },
  {
    id: '50000000-0000-4000-8000-000000000003',
    code: 'SUPER_RATE',
    name: 'Cuenta Súper Tasa',
    description: 'Cuenta de ahorro con rendimiento según condiciones del producto',
    type: AccountType.SAVINGS,
    allowsDebits: true,
    displayOrder: 30,
  },
  {
    id: '50000000-0000-4000-8000-000000000004',
    code: 'CHECKING',
    name: 'Cuenta Corriente',
    description: 'Cuenta corriente de libre disponibilidad',
    type: AccountType.CHECKING,
    allowsDebits: true,
    displayOrder: 40,
  },
  {
    id: '50000000-0000-4000-8000-000000000005',
    code: 'CTS',
    name: 'Cuenta CTS',
    description: 'Depósito CTS; retiros requieren un flujo específico',
    type: AccountType.CTS,
    allowsDebits: false,
    displayOrder: 50,
  },
  {
    id: '50000000-0000-4000-8000-000000000006',
    code: 'TERM_DEPOSIT',
    name: 'Depósito a Plazo',
    description: 'Depósito con vencimiento; no admite débitos transaccionales',
    type: AccountType.TERM_DEPOSIT,
    allowsDebits: false,
    displayOrder: 60,
  },
];
const CARD_TYPES = [
  {
    id: '60000000-0000-4000-8000-000000000001',
    code: 'VISA_DEBIT_CLASSIC',
    name: 'Visa Débito Clásica',
    description: 'Tarjeta de débito vinculada a cuentas de depósito',
    kind: CardKind.DEBIT,
    network: CardNetwork.VISA,
    displayOrder: 10,
  },
  {
    id: '60000000-0000-4000-8000-000000000002',
    code: 'VISA_DEBIT_BENEFIT',
    name: 'Visa Débito Benefit',
    description: 'Tarjeta de débito con programa de beneficios',
    kind: CardKind.DEBIT,
    network: CardNetwork.VISA,
    displayOrder: 20,
  },
  {
    id: '60000000-0000-4000-8000-000000000003',
    code: 'VISA_CREDIT_CLASSIC',
    name: 'Visa Crédito Clásica',
    description: 'Tarjeta de crédito con saldos separados por moneda',
    kind: CardKind.CREDIT,
    network: CardNetwork.VISA,
    displayOrder: 30,
  },
];

export async function seedAccountCatalog(prisma: PrismaClient): Promise<void> {
  for (const product of ACCOUNT_TYPES) {
    const data = { ...product, supportedCurrencies: [Currency.PEN, Currency.USD] };
    await prisma.accountTypeDefinition.upsert({
      where: { code: product.code },
      update: {},
      create: data,
    });
  }
  for (const product of CARD_TYPES) {
    await prisma.cardType.upsert({ where: { code: product.code }, update: {}, create: product });
  }
}

export async function seedDemoCards(prisma: PrismaClient, userId: string): Promise<void> {
  const debitId = '70000000-0000-4000-8000-000000000001';
  const creditId = '70000000-0000-4000-8000-000000000002';
  await prisma.card.upsert({
    where: { id: debitId },
    update: {},
    create: {
      id: debitId,
      userId,
      cardTypeId: CARD_TYPES[0].id,
      kind: CardKind.DEBIT,
      lastFour: '1234',
      displayName: 'Débito Digital Demo',
      format: CardFormat.DIGITAL,
      expiresAt: new Date('2030-12-31'),
    },
  });
  for (const accountId of [
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
  ]) {
    await prisma.accountCard.upsert({
      where: { accountId_cardId: { accountId, cardId: debitId } },
      update: {},
      create: { accountId, cardId: debitId, userId },
    });
  }
  await prisma.card.upsert({
    where: { id: creditId },
    update: {},
    create: {
      id: creditId,
      userId,
      cardTypeId: CARD_TYPES[2].id,
      kind: CardKind.CREDIT,
      lastFour: '5678',
      displayName: 'Crédito Visa Demo',
      expiresAt: new Date('2030-12-31'),
    },
  });
  for (const balance of [
    { currency: Currency.PEN, creditLimit: '5000.00', outstandingBalance: '125.50' },
    { currency: Currency.USD, creditLimit: '1500.00', outstandingBalance: '75.25' },
  ]) {
    await prisma.cardCreditBalance.upsert({
      where: { cardId_currency: { cardId: creditId, currency: balance.currency } },
      update: {},
      create: { cardId: creditId, ...balance },
    });
  }
}
