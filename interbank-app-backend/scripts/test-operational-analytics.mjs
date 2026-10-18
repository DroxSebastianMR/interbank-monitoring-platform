// SQL contract integration against disposable PostgreSQL only. No real users or funds.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');
const { OperationalAnalyticsRepository } = require('../dist/modules/operational-analytics/repositories/operational-analytics.repository.js');
const target = new URL(process.env.DATABASE_URL ?? '');
if (target.hostname !== '127.0.0.1' || target.pathname !== '/monitoring_v2_test' || target.port === '5432') throw new Error('Disposable test database required');
const prisma = new PrismaClient();
try {
  await prisma.$executeRaw`CREATE SCHEMA app`;
  // Minimal contract fixtures matching timestamp(3) UTC and column names in Prisma migrations.
  await prisma.$executeRaw`CREATE TABLE app.transfers (id text PRIMARY KEY, "createdAt" timestamp(3), status text)`;
  await prisma.$executeRaw`CREATE TABLE app.plin_payments (id text PRIMARY KEY, "transferId" text UNIQUE)`;
  await prisma.$executeRaw`CREATE TABLE app.service_payments (id text PRIMARY KEY, "createdAt" timestamp(3), status text)`;
  await prisma.$executeRaw`INSERT INTO app.transfers VALUES ('t1','2026-10-19 03:00:00','COMPLETED'),('t2','2026-10-19 05:00:00','PENDING')`;
  await prisma.$executeRaw`INSERT INTO app.plin_payments VALUES ('p1','t1')`;
  await prisma.$executeRaw`INSERT INTO app.service_payments VALUES ('s1','2026-10-18 06:00:00','FAILED')`;
  const repository = new OperationalAnalyticsRepository(prisma);
  const rows = await repository.aggregate(new Date('2026-10-18T05:00:00Z'), new Date('2026-10-20T05:00:00Z'));
  assert.deepEqual(rows, [
    { date: '2026-10-18', hour: 1, category: 'SERVICE_PAYMENT', status: 'FAILED', count: 1 },
    { date: '2026-10-18', hour: 22, category: 'PLIN', status: 'COMPLETED', count: 1 },
    { date: '2026-10-19', hour: 0, category: 'TRANSFER', status: 'PENDING', count: 1 },
  ]);
  console.log(JSON.stringify({ passed: true, checks: ['real PostgreSQL SQL', 'UTC to Lima boundaries', 'Plin not double-counted', 'pending and failed preserved'], operations: 3, environment: 'isolated minimal SQL contract fixtures' }));
} finally { await prisma.$disconnect(); }
