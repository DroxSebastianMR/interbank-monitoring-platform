import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { SimulatedCciPolicy } from '@/modules/accounts/policies/simulated-cci.policy';

const sender = '90000000-0000-4000-8000-000000000001';
const recipient = '90000000-0000-4000-8000-000000000002';
const source = '91000000-0000-4000-8000-000000000001';
const destination = '91000000-0000-4000-8000-000000000002';
const ownDestination = '91000000-0000-4000-8000-000000000003';
const first = '92000000-0000-4000-8000-000000000001';
const second = '92000000-0000-4000-8000-000000000002';

void test('transfer migration preserves history and enforces financial invariants', async (context) => {
  const db = new PGlite();
  try {
    const root = join(process.cwd(), 'prisma', 'migrations');
    for (const migration of (await readdir(root)).filter((name) => /^\d/.test(name)).sort()) {
      if (migration === '20261005190000_transfer_execution_contract') {
        await db.exec(`
          INSERT INTO app.users (id, "documentNumber", email, "passwordHash", "updatedAt") VALUES
            ('${sender}', '33333333', 'sender@test.invalid', 'unused', now()),
            ('${recipient}', '44444444', 'recipient@test.invalid', 'unused', now());
          INSERT INTO app.accounts (id, "userId", "displayName", "accountNumber", cci, balance, "updatedAt") VALUES
            ('${source}', '${sender}', 'Origen', '2003000000001', '${SimulatedCciPolicy.generate(source)}', 75.00, now()),
            ('${destination}', '${recipient}', 'Destino', '2003000000002', '${SimulatedCciPolicy.generate(destination)}', 10.00, now()),
            ('${ownDestination}', '${sender}', 'Destino propio', '2003000000003', '${SimulatedCciPolicy.generate(ownDestination)}', 15.00, now());
          INSERT INTO app.transfers (id, "sourceAccountId", "destinationAccountId", amount, currency, "completedAt") VALUES
            ('${first}', '${source}', '${destination}', 10.00, 'PEN', now()),
            ('${second}', '${source}', '${ownDestination}', 15.00, 'PEN', now());
          INSERT INTO app.transactions (id, "accountId", "transferId", type, direction, amount, currency, description) VALUES
            ('93000000-0000-4000-8000-000000000001', '${source}', '${first}', 'TRANSFER', 'DEBIT', 10.00, 'PEN', 'Existing debit'),
            ('93000000-0000-4000-8000-000000000002', '${destination}', '${first}', 'TRANSFER', 'CREDIT', 10.00, 'PEN', 'Existing credit');
        `);
      }
      await db.exec(await readFile(join(root, migration, 'migration.sql'), 'utf8'));
    }
    await context.test(
      'backfills owner, kind, operation numbers and keys without changing balances',
      async () => {
        const transfers = await db.query<{
          id: string;
          userId: string;
          kind: string;
          operationNumber: string;
          idempotencyKey: string;
        }>(
          'SELECT id, "userId", kind, "operationNumber", "idempotencyKey" FROM app.transfers ORDER BY id',
        );
        assert.equal(transfers.rows.length, 2);
        assert.equal(transfers.rows[0].kind, 'THIRD_PARTY');
        assert.equal(transfers.rows[1].kind, 'OWN_ACCOUNTS');
        assert.equal(transfers.rows[0].userId, sender);
        assert.notEqual(transfers.rows[0].operationNumber, transfers.rows[1].operationNumber);
        assert.equal(transfers.rows[0].idempotencyKey, `legacy:${first}`);
        const balances = await db.query<{ balance: string }>(
          'SELECT balance::text FROM app.accounts ORDER BY id',
        );
        assert.deepEqual(
          balances.rows.map((row) => row.balance),
          ['75.00', '10.00', '15.00'],
        );
        assert.equal(
          (await db.query<{ count: number }>('SELECT count(*)::int FROM app.transactions')).rows[0]
            .count,
          2,
        );
      },
    );
    const violations: [string, string, string][] = [
      [
        'rejects a negative account balance',
        `UPDATE app.accounts SET balance = -0.01 WHERE id = '${source}'`,
        '23514',
      ],
      [
        'rejects zero transfer amounts',
        `UPDATE app.transfers SET amount = 0 WHERE id = '${first}'`,
        '23514',
      ],
      [
        'rejects negative transfer amounts',
        `UPDATE app.transfers SET amount = -1 WHERE id = '${first}'`,
        '23514',
      ],
      [
        'rejects identical source and destination',
        `UPDATE app.transfers SET "destinationAccountId" = "sourceAccountId" WHERE id = '${first}'`,
        '23514',
      ],
      [
        'rejects an initiator who does not own the source',
        `UPDATE app.transfers SET "userId" = '${recipient}' WHERE id = '${first}'`,
        '23503',
      ],
      [
        'rejects repeated user/idempotency keys',
        `UPDATE app.transfers SET "idempotencyKey" = 'legacy:${first}' WHERE id = '${second}'`,
        '23505',
      ],
      [
        'rejects duplicate operation numbers',
        `UPDATE app.transfers SET "operationNumber" = (SELECT "operationNumber" FROM app.transfers WHERE id = '${first}') WHERE id = '${second}'`,
        '23505',
      ],
      [
        'rejects a second debit movement for the same transfer',
        `INSERT INTO app.transactions (id, "accountId", "transferId", type, direction, amount, currency, description) VALUES ('93000000-0000-4000-8000-000000000003', '${source}', '${first}', 'TRANSFER', 'DEBIT', 10, 'PEN', 'Duplicate')`,
        '23505',
      ],
    ];
    for (const [name, sql, code] of violations)
      await context.test(name, async () => {
        await assert.rejects(db.exec(sql), { code });
      });
    await context.test('allows the same request key for independent users', async () => {
      await db.exec(
        `INSERT INTO app.transfers (id, "userId", "sourceAccountId", "destinationAccountId", amount, currency, kind, "operationNumber", "idempotencyKey", "requestFingerprint") VALUES ('92000000-0000-4000-8000-000000000003', '${recipient}', '${destination}', '${source}', 1, 'PEN', 'THIRD_PARTY', 'RECIPIENT-TEST', 'legacy:${first}', '${'a'.repeat(64)}')`,
      );
    });
    await context.test(
      'rolls back a debit if any statement in the financial transaction fails',
      async () => {
        await assert.rejects(
          db.transaction(async (tx) => {
            await tx.query('UPDATE app.accounts SET balance = balance - 10 WHERE id = $1', [
              source,
            ]);
            await tx.query('UPDATE app.accounts SET balance = balance + 10 WHERE id = $1', [
              destination,
            ]);
            await tx.query('UPDATE app.transfers SET amount = -1 WHERE id = $1', [first]);
          }),
          { code: '23514' },
        );
        const balances = await db.query<{ balance: string }>(
          'SELECT balance::text FROM app.accounts ORDER BY id',
        );
        assert.deepEqual(
          balances.rows.map((row) => row.balance),
          ['75.00', '10.00', '15.00'],
        );
      },
    );
  } finally {
    await db.close();
  }
});
