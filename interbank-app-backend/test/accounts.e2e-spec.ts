import { Global, Module, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import {
  AccountStatus,
  AccountType,
  CardFormat,
  CardKind,
  CardNetwork,
  CardStatus,
  Currency,
  Prisma,
  TransactionDirection,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import type { Server } from 'node:http';
import * as request from 'supertest';

import { PrismaService } from '@/common/prisma/prisma.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { createValidationPipe } from '@/config/validation/validation.config';
import { AccountsModule } from '@/modules/accounts/accounts.module';
import type { AccountSnapshot, CardSnapshot } from '@/modules/accounts/types/accounts.types';
import { AuthModule } from '@/modules/auth/auth.module';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import { SimulationService } from '@/modules/simulation/services/simulation.service';

const owner = '80000000-0000-4000-8000-000000000001';
const ownAccount = '81000000-0000-4000-8000-000000000001';
const foreignAccount = '81000000-0000-4000-8000-000000000002';
const cardId = '82000000-0000-4000-8000-000000000001';
const transactionId = '83000000-0000-4000-8000-000000000001';
const account: AccountSnapshot = {
  id: ownAccount,
  displayName: 'Cuenta Simple Soles',
  accountNumber: '2003000000001',
  cci: '00300000000000000001',
  balance: new Prisma.Decimal('4250.50'),
  currency: Currency.PEN,
  type: AccountType.SAVINGS,
  status: AccountStatus.ACTIVE,
  createdAt: new Date('2026-10-05T00:00:00Z'),
  closedAt: null,
  accountType: {
    id: '50000000-0000-4000-8000-000000000001',
    code: 'SIMPLE',
    name: 'Cuenta Simple',
    description: 'Ahorro',
    type: AccountType.SAVINGS,
    supportedCurrencies: [Currency.PEN, Currency.USD],
    allowsDebits: true,
    isActive: true,
  },
};
const card: CardSnapshot = {
  id: cardId,
  displayName: 'Crédito Visa',
  lastFour: '5678',
  kind: CardKind.CREDIT,
  status: CardStatus.ACTIVE,
  format: CardFormat.PHYSICAL,
  expiresAt: new Date('2030-12-31'),
  cardType: {
    id: '60000000-0000-4000-8000-000000000003',
    code: 'VISA_CREDIT_CLASSIC',
    name: 'Visa Crédito Clásica',
    description: 'Crédito',
    kind: CardKind.CREDIT,
    network: CardNetwork.VISA,
  },
  creditBalances: [
    {
      currency: Currency.PEN,
      creditLimit: new Prisma.Decimal('5000'),
      outstandingBalance: new Prisma.Decimal('125.50'),
    },
  ],
};
const prisma = {
  account: {
    findMany: jest.fn<Promise<AccountSnapshot[]>, [Prisma.AccountFindManyArgs]>(),
    findFirst: jest.fn(),
  },
  card: { findMany: jest.fn(), findFirst: jest.fn() },
  accountTypeDefinition: { findMany: jest.fn() },
  cardType: { findMany: jest.fn() },
  transaction: {
    findMany: jest.fn<Promise<unknown[]>, [Prisma.TransactionFindManyArgs]>(),
    findFirst: jest.fn(),
  },
};

@Module({
  imports: [
    JwtModule.register({
      secret: 'accounts-e2e-test-secret-at-least-32-characters',
      signOptions: { expiresIn: 60 },
    }),
  ],
  providers: [JwtAccessGuard],
  exports: [JwtModule, JwtAccessGuard],
})
class TestAuthModule {}

@Global()
@Module({
  providers: [
    { provide: PrismaService, useValue: prisma },
    { provide: ConfigService, useValue: new ConfigService({ app: { env: 'development' } }) },
    SimulationService,
  ],
  exports: [PrismaService, SimulationService],
})
class TestInfrastructureModule {}

describe('Accounts HTTP contract (real JWT guard, isolated repositories)', () => {
  let app: INestApplication;
  let server: Server;
  let token: string;
  let jwt: JwtService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [TestInfrastructureModule, AccountsModule],
    })
      .overrideModule(AuthModule)
      .useModule(TestAuthModule)
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(createValidationPipe());
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    server = app.getHttpServer() as Server;
    jwt = module.get(JwtService);
    token = jwt.sign({ sub: owner, email: 'owner@test.invalid', sessionId: 'session' });
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => {
    jest.resetAllMocks();
    prisma.account.findMany.mockResolvedValue([account]);
    prisma.account.findFirst.mockImplementation(
      (input: { where: { id: string; userId: string } }) =>
        Promise.resolve(
          input.where.id === ownAccount && input.where.userId === owner ? account : null,
        ),
    );
    prisma.card.findMany.mockResolvedValue([card]);
    prisma.card.findFirst.mockImplementation((input: { where: { id: string; userId: string } }) =>
      Promise.resolve(input.where.id === cardId && input.where.userId === owner ? card : null),
    );
    prisma.accountTypeDefinition.findMany.mockResolvedValue([account.accountType]);
    prisma.cardType.findMany.mockResolvedValue([card.cardType]);
    prisma.transaction.findMany.mockResolvedValue([]);
    prisma.transaction.findFirst.mockResolvedValue(null);
  });

  it('keeps the monitoring health endpoint public', async () => {
    await request(server)
      .get('/accounts/health')
      .expect(200)
      .expect({ status: 'ok', service: 'accounts' });
  });
  it.each([
    '/accounts',
    '/accounts/types',
    '/accounts/card-types',
    '/accounts/cards',
    `/accounts/cards/${cardId}`,
    `/accounts/${ownAccount}`,
    `/accounts/${ownAccount}/identifiers`,
    `/accounts/${ownAccount}/balance`,
    `/accounts/${ownAccount}/cards`,
    `/accounts/${ownAccount}/transactions`,
    `/accounts/${ownAccount}/statement`,
  ])('requires JWT on %s', async (path) => {
    await request(server).get(path).expect(401);
  });
  it('rejects an expired token', async () => {
    const expired = jwt.sign(
      { sub: owner, email: 'owner@test.invalid', sessionId: 'session' },
      { expiresIn: -1 },
    );
    await request(server).get('/accounts').auth(expired, { type: 'bearer' }).expect(401);
  });
  it('preserves the array contract, masks identifiers, and scopes filters to the JWT owner', async () => {
    const response = await request(server)
      .get('/accounts?currency=PEN&status=ACTIVE&type=SAVINGS')
      .auth(token, { type: 'bearer' })
      .expect(200);
    expect(response.body).toHaveLength(1);
    expect(response.body).toMatchObject([
      { accountNumber: '*********0001', balance: '4250.50', canDebit: true },
    ]);
    expect(JSON.stringify(response.body)).not.toContain(account.cci);
    expect(prisma.account.findMany.mock.calls[0][0] as unknown).toMatchObject({
      where: { userId: owner, currency: Currency.PEN, status: AccountStatus.ACTIVE },
    });
  });
  it.each(['currency=EUR', 'status=UNKNOWN', 'userId=another', 'accountTypeId=bad'])(
    'rejects an invalid accounts query %s',
    async (query) => {
      await request(server).get(`/accounts?${query}`).auth(token, { type: 'bearer' }).expect(400);
      expect(prisma.account.findMany).not.toHaveBeenCalled();
    },
  );
  it('resolves static catalogs before the dynamic UUID route', async () => {
    await request(server)
      .get('/accounts/types')
      .auth(token, { type: 'bearer' })
      .expect(200)
      .expect([account.accountType]);
    await request(server)
      .get('/accounts/card-types')
      .auth(token, { type: 'bearer' })
      .expect(200)
      .expect([card.cardType]);
  });
  it('exposes complete account identifiers only to the owner', async () => {
    await request(server)
      .get(`/accounts/${ownAccount}/identifiers`)
      .auth(token, { type: 'bearer' })
      .expect(200)
      .expect({
        accountId: ownAccount,
        accountNumber: account.accountNumber,
        cci: account.cci,
        currency: 'PEN',
        isSimulated: true,
      });
  });
  it.each(['', '/identifiers', '/balance', '/cards', '/transactions', '/statement'])(
    'returns 404 for a foreign account%s',
    async (suffix) => {
      await request(server)
        .get(`/accounts/${foreignAccount}${suffix}`)
        .auth(token, { type: 'bearer' })
        .expect(404);
      expect(prisma.transaction.findMany).not.toHaveBeenCalled();
    },
  );
  it('rejects malformed account UUIDs before persistence', async () => {
    await request(server)
      .get('/accounts/not-a-uuid/balance')
      .auth(token, { type: 'bearer' })
      .expect(400);
    expect(prisma.account.findFirst).not.toHaveBeenCalled();
  });
  it('returns typed credit data as precise decimals and a masked card number', async () => {
    const response = await request(server)
      .get(`/accounts/cards/${cardId}`)
      .auth(token, { type: 'bearer' })
      .expect(200);
    expect(response.body).toMatchObject({
      kind: 'CREDIT',
      maskedCardNumber: '**** **** **** 5678',
      creditBalances: [
        {
          currency: 'PEN',
          creditLimit: '5000.00',
          outstandingBalance: '125.50',
          availableCredit: '4874.50',
        },
      ],
    });
  });
  it('returns 404 for another user card', async () => {
    await request(server)
      .get(`/accounts/cards/${foreignAccount}`)
      .auth(token, { type: 'bearer' })
      .expect(404);
  });
  it('checks the account owner before selecting associated cards', async () => {
    await request(server)
      .get(`/accounts/${ownAccount}/cards?kind=DEBIT`)
      .auth(token, { type: 'bearer' })
      .expect(200);
    expect(prisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: owner,
          kind: CardKind.DEBIT,
          status: undefined,
          accountLinks: { some: { accountId: ownAccount, userId: owner } },
        },
      }),
    );
  });
  it.each(['limit=0', 'limit=51', 'limit=abc', 'cursor=bad', 'from=2026-02-30', 'direction=OTHER'])(
    'rejects an invalid movement query %s',
    async (query) => {
      await request(server)
        .get(`/accounts/${ownAccount}/statement?${query}`)
        .auth(token, { type: 'bearer' })
        .expect(400);
    },
  );
  it('paginates deterministically using occurrence time and ID', async () => {
    const position = { id: transactionId, occurredAt: new Date('2026-10-05T00:00:00Z') };
    prisma.transaction.findFirst.mockResolvedValue(position);
    prisma.transaction.findMany.mockResolvedValue([
      {
        ...position,
        type: TransactionType.DEPOSIT,
        direction: TransactionDirection.CREDIT,
        status: TransactionStatus.COMPLETED,
        amount: new Prisma.Decimal('10.05'),
        currency: Currency.PEN,
        description: 'Abono',
        reference: null,
      },
    ]);
    const response = await request(server)
      .get(
        `/accounts/${ownAccount}/statement?limit=2&cursor=${transactionId}&from=2026-10-01&to=2026-10-06`,
      )
      .auth(token, { type: 'bearer' })
      .expect(200);
    expect(response.body).toMatchObject({
      hasMore: false,
      nextCursor: null,
      items: [{ amount: '10.05' }],
    });
    expect(prisma.transaction.findMany.mock.calls[0][0] as unknown).toMatchObject({
      take: 3,
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      where: {
        accountId: ownAccount,
        account: { userId: owner },
        OR: [
          { occurredAt: { lt: position.occurredAt } },
          { occurredAt: position.occurredAt, id: { lt: transactionId } },
        ],
      },
    });
  });
});
