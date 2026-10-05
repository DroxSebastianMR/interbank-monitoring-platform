import { Global, Module, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AccountStatus, Currency, Prisma, TransactionStatus, TransferKind } from '@prisma/client';
import type { Server } from 'node:http';
import * as request from 'supertest';
import { PrismaService } from '@/common/prisma/prisma.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { createValidationPipe } from '@/config/validation/validation.config';
import { AuthModule } from '@/modules/auth/auth.module';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import { HomeModule } from '@/modules/home/home.module';
import { HomeCacheService } from '@/modules/home/services/home-cache.service';
import { SimulationService } from '@/modules/simulation/services/simulation.service';
import { TransfersModule } from '@/modules/transfers/transfers.module';

const userId = '80000000-0000-4000-8000-000000000001';
const recipientId = '80000000-0000-4000-8000-000000000002';
const sourceId = '81000000-0000-4000-8000-000000000001';
const destinationId = '81000000-0000-4000-8000-000000000002';
const transferId = '82000000-0000-4000-8000-000000000001';
const source = {
  id: sourceId,
  userId,
  displayName: 'Cuenta origen',
  accountNumber: '2003000000001',
  currency: Currency.PEN,
  balance: new Prisma.Decimal('100'),
  status: AccountStatus.ACTIVE,
  accountType: { name: 'Cuenta Simple', allowsDebits: true },
};
const destination = {
  ...source,
  id: destinationId,
  userId: recipientId,
  displayName: 'Cuenta destino',
  accountNumber: '2003000000002',
  user: { firstName: 'Ana', lastName: 'Prueba' },
};
const receipt = {
  id: transferId,
  userId,
  sourceAccountId: sourceId,
  destinationAccountId: destinationId,
  operationNumber: 'TRF-TEST',
  kind: TransferKind.THIRD_PARTY,
  status: TransactionStatus.COMPLETED,
  amount: new Prisma.Decimal('25.50'),
  currency: Currency.PEN,
  description: null,
  requestFingerprint: 'hash',
  idempotencyKey: 'key',
  createdAt: new Date('2026-10-05'),
  completedAt: new Date('2026-10-05'),
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
  account: {
    findFirst: jest.fn(),
    findMany: jest.fn<Promise<unknown[]>, [Prisma.AccountFindManyArgs]>(),
    findUnique: jest.fn(),
  },
  transfer: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn<Promise<unknown[]>, [Prisma.TransferFindManyArgs]>(),
  },
  $transaction: jest.fn<Promise<unknown>, [(tx: unknown) => Promise<unknown>, unknown]>(),
};
const cache = { invalidate: jest.fn() };

@Module({
  imports: [
    JwtModule.register({
      secret: 'transfer-test-secret-at-least-32-characters',
      signOptions: { expiresIn: 120 },
    }),
    ThrottlerModule.forRoot([{ limit: 1000, ttl: 60000 }]),
  ],
  providers: [JwtAccessGuard, { provide: APP_GUARD, useClass: ThrottlerGuard }],
  exports: [JwtModule, JwtAccessGuard],
})
class TestAuthModule {}
@Module({
  providers: [{ provide: HomeCacheService, useValue: cache }],
  exports: [HomeCacheService],
})
class TestHomeModule {}
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

describe('Transfers HTTP contract', () => {
  let app: INestApplication;
  let server: Server;
  let token: string;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [TestInfrastructureModule, TransfersModule],
    })
      .overrideModule(AuthModule)
      .useModule(TestAuthModule)
      .overrideModule(HomeModule)
      .useModule(TestHomeModule)
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(createValidationPipe());
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    server = app.getHttpServer() as Server;
    token = module
      .get(JwtService)
      .sign({ sub: userId, email: 'test@test.invalid', sessionId: 'session' });
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => {
    jest.resetAllMocks();
    cache.invalidate.mockResolvedValue(undefined);
    prisma.account.findFirst.mockImplementation((arg: { where: { id: string; userId: string } }) =>
      Promise.resolve(arg.where.id === sourceId && arg.where.userId === userId ? source : null),
    );
    prisma.account.findMany.mockResolvedValue([source]);
    prisma.account.findUnique.mockResolvedValue(destination);
    prisma.transfer.findUnique.mockResolvedValue(null);
    prisma.transfer.findFirst.mockImplementation((arg: { where: { id: string } }) =>
      Promise.resolve(arg.where.id === transferId ? receipt : null),
    );
    prisma.transfer.findMany.mockResolvedValue([receipt]);
    prisma.$transaction.mockImplementation((callback) => callback(tx));
    tx.$executeRaw.mockResolvedValue(0);
    tx.$queryRaw.mockResolvedValue([
      { ...source, allowsDebits: true },
      { ...destination, allowsDebits: true },
    ]);
    tx.transfer.findUnique.mockResolvedValue(null);
    tx.transfer.create.mockResolvedValue(receipt);
    tx.account.updateMany.mockResolvedValue({ count: 1 });
    tx.transaction.createMany.mockResolvedValue({ count: 2 });
  });
  const body = { fromAccountId: sourceId, toAccountId: destinationId, amount: 25.5 };
  it('keeps health public', async () => {
    await request(server).get('/transfers/health').expect(200);
  });
  it.each(['/transfers', '/transfers/sources', `/transfers/${transferId}`])(
    'requires JWT on GET %s',
    async (path) => {
      await request(server).get(path).expect(401);
    },
  );
  it.each(['/transfers', '/transfers/beneficiaries/resolve'])(
    'requires JWT on POST %s',
    async (path) => {
      await request(server).post(path).send(body).expect(401);
    },
  );
  it('requires the key before entering a DB transaction', async () => {
    const response = await request(server)
      .post('/transfers')
      .auth(token, { type: 'bearer' })
      .send(body)
      .expect(400);
    expect(response.body).toMatchObject({ code: 'INVALID_IDEMPOTENCY_KEY' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it.each([0, -1, 0.001, 1000000000000])(
    'rejects invalid amount %s before querying the DB',
    async (amount) => {
      await request(server)
        .post('/transfers')
        .auth(token, { type: 'bearer' })
        .set('Idempotency-Key', 'transfer-key')
        .send({ ...body, amount })
        .expect(400);
      expect(prisma.account.findFirst).not.toHaveBeenCalled();
    },
  );
  it('rejects malformed account IDs', async () => {
    await request(server)
      .post('/transfers')
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', 'transfer-key')
      .send({ ...body, fromAccountId: 'invalid' })
      .expect(400);
  });
  it('rejects overspending without a write transaction', async () => {
    const response = await request(server)
      .post('/transfers')
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', 'transfer-key')
      .send({ ...body, amount: 100.01 })
      .expect(400);
    expect(response.body).toMatchObject({ code: 'INSUFFICIENT_FUNDS' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('rejects a source not owned by the JWT user', async () => {
    await request(server)
      .post('/transfers')
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', 'transfer-key')
      .send({ ...body, fromAccountId: destinationId, toAccountId: sourceId })
      .expect(404);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('creates a receipt with source/destination and two movements', async () => {
    const response = await request(server)
      .post('/transfers')
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', 'transfer-key')
      .send(body)
      .expect(201);
    expect(response.body).toMatchObject({
      fromAccountId: sourceId,
      toAccountId: destinationId,
      amount: '25.50',
      kind: 'THIRD_PARTY',
      source: { maskedAccountNumber: '*********0001' },
      destination: { maskedAccountNumber: '*********0002' },
    });
    expect(tx.transaction.createMany).toHaveBeenCalledTimes(1);
    expect(cache.invalidate).toHaveBeenCalledWith(recipientId);
  });
  it('returns 409 for a key already used with different data', async () => {
    prisma.transfer.findUnique.mockResolvedValue(receipt);
    await request(server)
      .post('/transfers')
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', 'transfer-key')
      .send(body)
      .expect(409);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('selects only active own accounts that admit debits', async () => {
    await request(server)
      .get('/transfers/sources?currency=PEN')
      .auth(token, { type: 'bearer' })
      .expect(200);
    expect(prisma.account.findMany.mock.calls[0][0]).toMatchObject({
      where: { userId, currency: 'PEN', status: 'ACTIVE', accountType: { allowsDebits: true } },
    });
  });
  it('resolves a formatted account number without exposing balance or full name', async () => {
    const response = await request(server)
      .post('/transfers/beneficiaries/resolve')
      .auth(token, { type: 'bearer' })
      .send({ accountNumber: '200-300 0000002' })
      .expect(200);
    expect(response.body).toMatchObject({
      id: destinationId,
      beneficiaryName: 'Ana P',
      maskedAccountNumber: '*********0002',
    });
    expect(response.body).not.toHaveProperty('balance');
    expect(response.body).not.toHaveProperty('userId');
    expect(prisma.account.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { accountNumber: '2003000000002' } }),
    );
  });
  it('rejects partial or nonnumeric beneficiary searches', async () => {
    await request(server)
      .post('/transfers/beneficiaries/resolve')
      .auth(token, { type: 'bearer' })
      .send({ accountNumber: '20abc' })
      .expect(400);
    expect(prisma.account.findUnique).not.toHaveBeenCalled();
  });
  it('returns 404 for a missing receipt', async () => {
    await request(server)
      .get(`/transfers/${destinationId}`)
      .auth(token, { type: 'bearer' })
      .expect(404);
  });
  it('scopes history to transfer participants', async () => {
    await request(server)
      .get('/transfers?limit=1&direction=INCOMING')
      .auth(token, { type: 'bearer' })
      .expect(200);
    expect(prisma.transfer.findMany.mock.calls[0][0]).toMatchObject({
      where: {
        AND: [
          { OR: [{ userId }, { destinationAccount: { userId } }] },
          { destinationAccount: { userId } },
        ],
      },
      take: 2,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  });
  it('returns 400 for an invalid history cursor UUID', async () => {
    await request(server)
      .get('/transfers?cursor=invalid')
      .auth(token, { type: 'bearer' })
      .expect(400);
  });
  it('limits repeated beneficiary enumeration requests', async () => {
    let limited = false;
    for (let attempt = 0; attempt < 13; attempt++) {
      const response = await request(server)
        .post('/transfers/beneficiaries/resolve')
        .auth(token, { type: 'bearer' })
        .send({ accountNumber: '2003000000002' });
      if (response.status === 429) {
        limited = true;
        break;
      }
    }
    expect(limited).toBe(true);
  });
});
