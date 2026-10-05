import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const categorySeeds = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    code: 'UTILITIES',
    name: 'Servicios básicos',
    description: 'Luz, agua y gas',
    iconKey: 'home-utilities',
    displayOrder: 10,
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    code: 'TELECOMMUNICATIONS',
    name: 'Telefonía e internet',
    description: 'Telefonía fija, móvil, cable e internet',
    iconKey: 'smartphone',
    displayOrder: 20,
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    code: 'EDUCATION',
    name: 'Educación',
    description: 'Colegios, institutos y universidades',
    iconKey: 'graduation-cap',
    displayOrder: 30,
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    code: 'HEALTH',
    name: 'Salud',
    description: 'Clínicas, seguros y centros médicos',
    iconKey: 'heart-pulse',
    displayOrder: 40,
  },
  {
    id: '10000000-0000-4000-8000-000000000005',
    code: 'GOVERNMENT',
    name: 'Tributos y municipalidades',
    description: 'Arbitrios, predial, alcabala y otros tributos',
    iconKey: 'landmark',
    displayOrder: 50,
  },
] as const;

const providerSeeds = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    categoryId: categorySeeds[0].id,
    code: 'LUZ_DEL_SUR',
    name: 'Luz del Sur',
    shortName: 'Luz del Sur',
    legalName: 'Luz del Sur S.A.A.',
    logoUrl: '/assets/service-providers/luz-del-sur.svg',
    searchAliases: ['LUZ', 'ELECTRICIDAD', 'ENERGIA'],
    displayOrder: 10,
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    categoryId: categorySeeds[0].id,
    code: 'SEDAPAL',
    name: 'Sedapal',
    shortName: 'Sedapal',
    legalName: 'Servicio de Agua Potable y Alcantarillado de Lima S.A.',
    logoUrl: '/assets/service-providers/sedapal.svg',
    searchAliases: ['AGUA', 'ALCANTARILLADO'],
    displayOrder: 20,
  },
  {
    id: '20000000-0000-4000-8000-000000000003',
    categoryId: categorySeeds[1].id,
    code: 'CLARO',
    name: 'Claro',
    shortName: 'Claro',
    legalName: 'América Móvil Perú S.A.C.',
    logoUrl: '/assets/service-providers/claro.svg',
    searchAliases: ['CELULAR', 'TELEFONO', 'INTERNET', 'CABLE'],
    displayOrder: 10,
  },
  {
    id: '20000000-0000-4000-8000-000000000004',
    categoryId: categorySeeds[1].id,
    code: 'MOVISTAR',
    name: 'Movistar',
    shortName: 'Movistar',
    legalName: 'Telefónica del Perú S.A.A.',
    logoUrl: '/assets/service-providers/movistar.svg',
    searchAliases: ['CELULAR', 'TELEFONO', 'INTERNET', 'CABLE'],
    displayOrder: 20,
  },
  {
    id: '20000000-0000-4000-8000-000000000005',
    categoryId: categorySeeds[1].id,
    code: 'ENTEL',
    name: 'Entel',
    shortName: 'Entel',
    legalName: 'Entel Perú S.A.',
    logoUrl: '/assets/service-providers/entel.svg',
    searchAliases: ['CELULAR', 'TELEFONO', 'INTERNET'],
    displayOrder: 30,
  },
] as const;

const agreementSeeds = [
  {
    id: '30000000-0000-4000-8000-000000000001',
    providerId: providerSeeds[0].id,
    code: 'LUZ_DEL_SUR_ELECTRICIDAD',
    name: 'Servicio de electricidad',
    description: 'Pago de recibos de energía eléctrica',
    referenceLabel: 'Número de suministro',
    referenceType: 'SUPPLY_NUMBER' as const,
    referencePattern: '^\\d{9}$',
    referenceMinLength: 9,
    referenceMaxLength: 9,
    supportsDebtInquiry: true,
    supportsPartialPayment: false,
    currency: 'PEN' as const,
    commissionAmount: 0,
  },
  {
    id: '30000000-0000-4000-8000-000000000002',
    providerId: providerSeeds[1].id,
    code: 'SEDAPAL_AGUA',
    name: 'Servicio de agua',
    description: 'Pago de recibos de agua y alcantarillado',
    referenceLabel: 'Número de suministro',
    referenceType: 'SUPPLY_NUMBER' as const,
    referencePattern: '^\\d{9}$',
    referenceMinLength: 9,
    referenceMaxLength: 9,
    supportsDebtInquiry: true,
    supportsPartialPayment: false,
    currency: 'PEN' as const,
    commissionAmount: 0,
  },
  ...providerSeeds.slice(2).map((provider, index) => ({
    id: `30000000-0000-4000-8000-00000000000${index + 3}`,
    providerId: provider.id,
    code: `${provider.code}_POSTPAGO`,
    name: 'Telefonía e internet postpago',
    description: 'Pago de recibos postpago',
    referenceLabel: 'Número de teléfono o código de cliente',
    referenceType: 'PHONE_NUMBER' as const,
    referencePattern: '^\\d{9,12}$',
    referenceMinLength: 9,
    referenceMaxLength: 12,
    supportsDebtInquiry: true,
    supportsPartialPayment: false,
    currency: 'PEN' as const,
    commissionAmount: 0,
  })),
];

async function main() {
  const passwordHash = await hash('DemoSecure123!', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@interbank.test' },
    update: {},
    create: {
      documentNumber: '12345678',
      email: 'demo@interbank.test',
      passwordHash,
      firstName: 'Cliente',
      lastName: 'Demo',
    },
  });

  await prisma.account.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {
      userId: user.id,
      displayName: 'Cuenta Simple Soles',
      accountNumber: '2003000000001',
      balance: 4250.5,
      currency: 'PEN',
      type: 'SAVINGS',
    },
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      userId: user.id,
      displayName: 'Cuenta Simple Soles',
      accountNumber: '2003000000001',
      balance: 4250.5,
      currency: 'PEN',
    },
  });

  await prisma.account.upsert({
    where: { id: '00000000-0000-4000-8000-000000000003' },
    update: {
      userId: user.id,
      displayName: 'Cuenta Ahorro Meta',
      accountNumber: '2003000000003',
      balance: 300,
      currency: 'PEN',
      type: 'SAVINGS',
    },
    create: {
      id: '00000000-0000-4000-8000-000000000003',
      userId: user.id,
      displayName: 'Cuenta Ahorro Meta',
      accountNumber: '2003000000003',
      balance: 300,
      currency: 'PEN',
    },
  });

  await prisma.account.upsert({
    where: { id: '00000000-0000-4000-8000-000000000002' },
    update: {
      userId: user.id,
      displayName: 'Cuenta Simple Dólares',
      accountNumber: '2003000000002',
      balance: 850.75,
      currency: 'USD',
      type: 'SAVINGS',
    },
    create: {
      id: '00000000-0000-4000-8000-000000000002',
      userId: user.id,
      displayName: 'Cuenta Simple Dólares',
      accountNumber: '2003000000002',
      balance: 850.75,
      currency: 'USD',
    },
  });

  await prisma.transaction.upsert({
    where: { id: '00000000-0000-4000-8000-000000000101' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000101',
      accountId: '00000000-0000-4000-8000-000000000001',
      type: 'DEPOSIT',
      direction: 'CREDIT',
      amount: 3000,
      currency: 'PEN',
      description: 'Abono de prueba',
      reference: 'SEED-PEN-001',
    },
  });

  await prisma.transaction.upsert({
    where: { id: '00000000-0000-4000-8000-000000000103' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000103',
      accountId: '00000000-0000-4000-8000-000000000003',
      type: 'DEPOSIT',
      direction: 'CREDIT',
      amount: 300,
      currency: 'PEN',
      description: 'Ahorro inicial de prueba',
      reference: 'SEED-PEN-002',
    },
  });

  await prisma.transaction.upsert({
    where: { id: '00000000-0000-4000-8000-000000000102' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000102',
      accountId: '00000000-0000-4000-8000-000000000002',
      type: 'DEPOSIT',
      direction: 'CREDIT',
      amount: 850.75,
      currency: 'USD',
      description: 'Abono en dólares de prueba',
      reference: 'SEED-USD-001',
    },
  });

  for (const category of categorySeeds) {
    await prisma.serviceCategory.upsert({
      where: { code: category.code },
      update: category,
      create: category,
    });
  }

  for (const provider of providerSeeds) {
    await prisma.serviceProvider.upsert({
      where: { code: provider.code },
      update: provider,
      create: provider,
    });
  }

  for (const agreement of agreementSeeds) {
    await prisma.serviceAgreement.upsert({
      where: { code: agreement.code },
      update: agreement,
      create: agreement,
    });
  }

  const now = new Date();
  const issuedAt = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
  const dueDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
  const debtSeeds = [
    {
      id: '40000000-0000-4000-8000-000000000001',
      serviceAgreementId: agreementSeeds[0].id,
      customerReference: '123456789',
      invoiceNumber: 'LDS-DEMO-001',
      description: 'Consumo de energía eléctrica',
      amount: 128.4,
      currency: 'PEN' as const,
    },
    {
      id: '40000000-0000-4000-8000-000000000002',
      serviceAgreementId: agreementSeeds[1].id,
      customerReference: '987654321',
      invoiceNumber: 'SED-DEMO-001',
      description: 'Consumo de agua potable',
      amount: 76.2,
      currency: 'PEN' as const,
    },
    {
      id: '40000000-0000-4000-8000-000000000003',
      serviceAgreementId: agreementSeeds[2].id,
      customerReference: '999888777',
      invoiceNumber: 'CLA-DEMO-001',
      description: 'Plan postpago mensual',
      amount: 89.9,
      currency: 'PEN' as const,
    },
    {
      id: '40000000-0000-4000-8000-000000000004',
      serviceAgreementId: agreementSeeds[3].id,
      customerReference: '988777666',
      invoiceNumber: 'MOV-DEMO-001',
      description: 'Plan postpago mensual',
      amount: 79.9,
      currency: 'PEN' as const,
    },
    {
      id: '40000000-0000-4000-8000-000000000005',
      serviceAgreementId: agreementSeeds[4].id,
      customerReference: '977666555',
      invoiceNumber: 'ENT-DEMO-001',
      description: 'Plan postpago mensual',
      amount: 69.9,
      currency: 'PEN' as const,
    },
  ];

  for (const debt of debtSeeds) {
    await prisma.serviceDebt.upsert({
      where: {
        serviceAgreementId_invoiceNumber: {
          serviceAgreementId: debt.serviceAgreementId,
          invoiceNumber: debt.invoiceNumber,
        },
      },
      update: {
        description: debt.description,
        amount: debt.amount,
        currency: debt.currency,
        issuedAt,
        dueDate,
      },
      create: { ...debt, issuedAt, dueDate },
    });
  }
}
void main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Seed failed: ${message}\n`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
