import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { SimulatedCciPolicy } from '@/modules/accounts/policies/simulated-cci.policy';

const owner = '80000000-0000-4000-8000-000000000001';
const other = '80000000-0000-4000-8000-000000000002';
const savings = '81000000-0000-4000-8000-000000000001';
const checking = '81000000-0000-4000-8000-000000000002';
const debit = '82000000-0000-4000-8000-000000000001';
const credit = '82000000-0000-4000-8000-000000000002';

void test('accounts migrations preserve legacy data and enforce ownership and product invariants', async (context) => {
  const db = new PGlite();
  try {
    const root = join(process.cwd(), 'prisma', 'migrations');
    const migrations = (await readdir(root)).filter((name) => /^\d/.test(name)).sort();
    for (const migration of migrations) {
      if (migration === '20261005145900_account_product_families') {
        await db.exec(`
          INSERT INTO app.users (id, "documentNumber", email, "passwordHash", "updatedAt") VALUES
            ('${owner}', '11111111', 'one@test.invalid', 'unused', now()),
            ('${other}', '22222222', 'two@test.invalid', 'unused', now());
          INSERT INTO app.accounts (id, "userId", "displayName", "accountNumber", balance, currency, type, "updatedAt") VALUES
            ('${savings}', '${owner}', 'Legacy Savings', '1000000000001', 4250.50, 'PEN', 'SAVINGS', now()),
            ('${checking}', '${owner}', 'Legacy Checking', '1000000000002', 850.75, 'USD', 'CHECKING', now());
          INSERT INTO app.transactions (id, "accountId", type, direction, amount, currency, description)
            VALUES ('83000000-0000-4000-8000-000000000001', '${savings}', 'DEPOSIT', 'CREDIT', 4250.50, 'PEN', 'Legacy deposit');
        `);
      }
      await db.exec(await readFile(join(root, migration, 'migration.sql'), 'utf8'));
    }
    await context.test(
      'backfills CCI and product without changing balances or transactions',
      async () => {
        const result = await db.query<{ id: string; balance: string; cci: string; code: string }>(`
        SELECT a.id, a.balance::text, a.cci, p.code FROM app.accounts a
        JOIN app.account_types p ON p.id = a."accountTypeId" ORDER BY a.id`);
        assert.deepEqual(result.rows, [
          {
            id: savings,
            balance: '4250.50',
            cci: SimulatedCciPolicy.generate(savings),
            code: 'SIMPLE',
          },
          {
            id: checking,
            balance: '850.75',
            cci: SimulatedCciPolicy.generate(checking),
            code: 'CHECKING',
          },
        ]);
        assert.equal(
          (await db.query<{ count: number }>('SELECT count(*)::int FROM app.transactions')).rows[0]
            .count,
          1,
        );
        assert.equal(
          (await db.query<{ count: number }>('SELECT count(*)::int FROM app.account_types')).rows[0]
            .count,
          6,
        );
      },
    );
    await db.exec(`
      INSERT INTO app.cards (id, "userId", "cardTypeId", kind, "lastFour", "displayName", "expiresAt", "updatedAt") VALUES
        ('${debit}', '${owner}', '60000000-0000-4000-8000-000000000001', 'DEBIT', '1234', 'Demo debit', '2030-12-31', now()),
        ('${credit}', '${owner}', '60000000-0000-4000-8000-000000000003', 'CREDIT', '5678', 'Demo credit', '2030-12-31', now());
      INSERT INTO app.account_cards ("accountId", "cardId", "userId") VALUES ('${savings}', '${debit}', '${owner}');
      INSERT INTO app.card_credit_balances ("cardId", currency, "creditLimit", "outstandingBalance", "updatedAt") VALUES
        ('${credit}', 'PEN', 5000.00, 125.50, now()), ('${credit}', 'USD', 1500.00, 75.25, now());
    `);
    const invalidQueries: [string, string, string][] = [
      [
        'rejects cross-owner card links',
        `INSERT INTO app.account_cards ("accountId", "cardId", "userId") VALUES ('${checking}', '${debit}', '${other}')`,
        '23503',
      ],
      [
        'rejects credit cards as deposit debit instruments',
        `INSERT INTO app.account_cards ("accountId", "cardId", "userId", kind) VALUES ('${savings}', '${credit}', '${owner}', 'CREDIT')`,
        '23514',
      ],
      [
        'rejects credit balances on debit cards',
        `INSERT INTO app.card_credit_balances ("cardId", currency, kind, "creditLimit", "updatedAt") VALUES ('${debit}', 'PEN', 'DEBIT', 10, now())`,
        '23514',
      ],
      [
        'rejects account family/product mismatch',
        `UPDATE app.accounts SET "accountTypeId" = '50000000-0000-4000-8000-000000000004' WHERE id = '${savings}'`,
        '23503',
      ],
      [
        'rejects invalid CCI',
        `UPDATE app.accounts SET cci = 'letters' WHERE id = '${savings}'`,
        '23514',
      ],
      [
        'rejects duplicate CCI',
        `UPDATE app.accounts SET cci = (SELECT cci FROM app.accounts WHERE id = '${savings}') WHERE id = '${checking}'`,
        '23505',
      ],
      [
        'rejects negative credit debt',
        `UPDATE app.card_credit_balances SET "outstandingBalance" = -1 WHERE "cardId" = '${credit}'`,
        '23514',
      ],
      [
        'rejects closing without a closure timestamp',
        `UPDATE app.accounts SET status = 'CLOSED' WHERE id = '${savings}'`,
        '23514',
      ],
      [
        'rejects storing a complete card number',
        `UPDATE app.cards SET "lastFour" = '1234567890123456' WHERE id = '${debit}'`,
        '22001',
      ],
    ];
    for (const [name, sql, code] of invalidQueries) {
      await context.test(name, async () => {
        await assert.rejects(db.exec(sql), { code });
      });
    }
    await context.test(
      'supports one debit card linked to both currencies and bimonetary credit',
      async () => {
        await db.exec(
          `INSERT INTO app.account_cards ("accountId", "cardId", "userId") VALUES ('${checking}', '${debit}', '${owner}')`,
        );
        assert.equal(
          (await db.query<{ count: number }>('SELECT count(*)::int FROM app.account_cards')).rows[0]
            .count,
          2,
        );
        assert.equal(
          (await db.query<{ count: number }>('SELECT count(*)::int FROM app.card_credit_balances'))
            .rows[0].count,
          2,
        );
      },
    );
  } finally {
    await db.close();
  }
});
