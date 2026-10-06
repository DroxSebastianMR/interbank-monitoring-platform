BEGIN;

CREATE TYPE "app"."TransferKind" AS ENUM ('OWN_ACCOUNTS', 'THIRD_PARTY');
ALTER TABLE "app"."transfers"
  ADD COLUMN "userId" UUID,
  ADD COLUMN "kind" "app"."TransferKind",
  ADD COLUMN "operationNumber" VARCHAR(32),
  ADD COLUMN "idempotencyKey" VARCHAR(80),
  ADD COLUMN "requestFingerprint" CHAR(64);

-- Preserve completed operations, balances, and movements. Legacy operations
-- receive a namespaced key; they cannot be replayed as a newly submitted request.
UPDATE "app"."transfers" AS t SET
  "userId" = source."userId",
  "kind" = CASE WHEN source."userId" = destination."userId" THEN 'OWN_ACCOUNTS'::"app"."TransferKind" ELSE 'THIRD_PARTY'::"app"."TransferKind" END,
  "operationNumber" = upper(replace(t.id::text, '-', '')),
  "idempotencyKey" = 'legacy:' || t.id::text,
  "requestFingerprint" = md5(t.id::text) || md5(t.id::text)
FROM "app"."accounts" source, "app"."accounts" destination
WHERE source.id = t."sourceAccountId" AND destination.id = t."destinationAccountId";

ALTER TABLE "app"."transfers"
  ALTER COLUMN "userId" SET NOT NULL,
  ALTER COLUMN "kind" SET NOT NULL,
  ALTER COLUMN "operationNumber" SET NOT NULL,
  ALTER COLUMN "idempotencyKey" SET NOT NULL,
  ALTER COLUMN "requestFingerprint" SET NOT NULL;

ALTER TABLE "app"."transfers" DROP CONSTRAINT "transfers_sourceAccountId_fkey";
ALTER TABLE "app"."transfers" ADD CONSTRAINT "transfers_sourceAccountId_userId_fkey"
  FOREIGN KEY ("sourceAccountId", "userId") REFERENCES "app"."accounts"(id, "userId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "app"."transfers" ADD CONSTRAINT "transfers_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "app"."users"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "app"."transfers" ADD CONSTRAINT "transfers_amount_positive_check" CHECK (amount > 0);
ALTER TABLE "app"."transfers" ADD CONSTRAINT "transfers_distinct_accounts_check" CHECK ("sourceAccountId" <> "destinationAccountId");
ALTER TABLE "app"."accounts" ADD CONSTRAINT "accounts_nonnegative_balance_check" CHECK (balance >= 0);

CREATE UNIQUE INDEX "transfers_operationNumber_key" ON "app"."transfers"("operationNumber");
CREATE UNIQUE INDEX "transfers_userId_idempotencyKey_key" ON "app"."transfers"("userId", "idempotencyKey");
CREATE INDEX "transfers_userId_createdAt_id_idx" ON "app"."transfers"("userId", "createdAt" DESC, id DESC);
DROP INDEX "app"."transfers_sourceAccountId_createdAt_idx";
DROP INDEX "app"."transfers_destinationAccountId_createdAt_idx";
CREATE INDEX "transfers_sourceAccountId_createdAt_id_idx" ON "app"."transfers"("sourceAccountId", "createdAt" DESC, id DESC);
CREATE INDEX "transfers_destinationAccountId_createdAt_id_idx" ON "app"."transfers"("destinationAccountId", "createdAt" DESC, id DESC);
CREATE UNIQUE INDEX "transactions_transferId_direction_key" ON "app"."transactions"("transferId", direction);

COMMIT;
