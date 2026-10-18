import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { SimulatedCciPolicy } from '@/modules/accounts/policies/simulated-cci.policy';

void test('banking modules migration adds isolated, constrained data', async () => {
  const db = new PGlite();
  try {
    const root = join(process.cwd(), 'prisma', 'migrations');
    for (const name of (await readdir(root)).filter((entry) => /^\d/.test(entry)).sort()) {
      await db.exec(await readFile(join(root, name, 'migration.sql'), 'utf8'));
    }
    await db.exec(`
      INSERT INTO app.users (id, "documentNumber", email, "passwordHash", "updatedAt", "phoneNumber") VALUES
        ('80000000-0000-4000-8000-000000000001', '12345678', 'one@test.invalid', 'unused', now(), '987654321'),
        ('80000000-0000-4000-8000-000000000002', '87654321', 'two@test.invalid', 'unused', now(), NULL);
      INSERT INTO app.promotions (id, title, description, category, "startsAt", "endsAt", "updatedAt") VALUES
        ('60000000-0000-4000-8000-000000000001', 'Demo', 'Oferta ficticia', 'DINING', now(), now() + interval '1 day', now());
      INSERT INTO app.promotion_favorites ("userId", "promotionId") VALUES
        ('80000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001');
      INSERT INTO app.accounts (id, "userId", "displayName", "accountNumber", cci, "updatedAt") VALUES
        ('81000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-000000000001', 'Demo', '2003000000001', '${SimulatedCciPolicy.generate('81000000-0000-4000-8000-000000000001')}', now());
    `);
    await assert.rejects(
      db.exec(`INSERT INTO app.plin_enrollments ("userId", "phoneNumber", "accountId", "updatedAt") VALUES
      ('80000000-0000-4000-8000-000000000002', '912345678', '81000000-0000-4000-8000-000000000001', now())`),
      { code: '23503' },
    );
    await assert.rejects(
      db.exec(`INSERT INTO app.loan_applications (id, "userId", "destinationAccountId", "idempotencyKey", "requestFingerprint", principal, "annualEffectiveRate", "monthlyPayment", "totalRepayment", months, "updatedAt") VALUES
      ('70000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-000000000002', '81000000-0000-4000-8000-000000000001', 'test-key-123', repeat('a',64), 1000, 24, 100, 1200, 12, now())`),
      { code: '23503' },
    );
    await assert.rejects(
      db.exec(
        `UPDATE app.users SET "phoneNumber" = '123' WHERE id = '80000000-0000-4000-8000-000000000002'`,
      ),
      { code: '23514' },
    );
    await assert.rejects(
      db.exec(
        `UPDATE app.users SET "phoneNumber" = '987654321' WHERE id = '80000000-0000-4000-8000-000000000002'`,
      ),
      { code: '23505' },
    );
    await assert.rejects(
      db.exec(
        `UPDATE app.promotions SET "endsAt" = "startsAt" WHERE id = '60000000-0000-4000-8000-000000000001'`,
      ),
      { code: '23514' },
    );
    await assert.rejects(
      db.exec(
        `INSERT INTO app.promotion_favorites ("userId", "promotionId") VALUES ('80000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001')`,
      ),
      { code: '23505' },
    );
    await assert.rejects(
      db.exec(`INSERT INTO app.customer_details ("userId", "nationalityCode", "updatedAt") VALUES
        ('80000000-0000-4000-8000-000000000001', 'P1', now())`),
      { code: '23514' },
    );
    await assert.rejects(
      db.exec(`INSERT INTO app.plin_favorites ("userId", "phoneNumber", "preferredNetwork", "updatedAt") VALUES
        ('80000000-0000-4000-8000-000000000001', '987654322', 'UNVERIFIED', now())`),
      { code: '23514' },
    );
    await db.exec(`INSERT INTO app.promotion_vouchers
      (id, "promotionId", "userId", code, "expiresAt") VALUES
      ('62000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001',
       '80000000-0000-4000-8000-000000000001', 'DEMOCINE-TEST', now() + interval '1 day')`);
    await assert.rejects(
      db.exec(`INSERT INTO app.promotion_vouchers
        (id, "promotionId", "userId", code, "expiresAt") VALUES
        ('62000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000001',
         '80000000-0000-4000-8000-000000000001', 'DEMOCINE-OTHER', now() + interval '1 day')`),
      { code: '23505' },
    );
    const result = await db.query<{ count: number }>(`SELECT count(*)::int FROM app.promotions`);
    assert.equal(result.rows[0].count, 1);
  } finally {
    await db.close();
  }
});
