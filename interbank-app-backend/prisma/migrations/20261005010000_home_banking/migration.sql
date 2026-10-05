CREATE TYPE "app"."Currency" AS ENUM ('PEN', 'USD');
CREATE TYPE "app"."AccountType" AS ENUM ('SAVINGS', 'CHECKING');
CREATE TYPE "app"."TransactionType" AS ENUM ('DEPOSIT', 'TRANSFER', 'SERVICE_PAYMENT');
CREATE TYPE "app"."TransactionDirection" AS ENUM ('CREDIT', 'DEBIT');
CREATE TYPE "app"."TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED');

ALTER TABLE "app"."Account" RENAME TO "accounts";
ALTER TABLE "app"."accounts" RENAME COLUMN "ownerName" TO "displayName";
ALTER TABLE "app"."accounts"
  ADD COLUMN "userId" UUID,
  ADD COLUMN "accountNumber" VARCHAR(20),
  ADD COLUMN "type" "app"."AccountType" NOT NULL DEFAULT 'SAVINGS',
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "app"."accounts"
  ALTER COLUMN "displayName" TYPE VARCHAR(100),
  ALTER COLUMN "currency" DROP DEFAULT,
  ALTER COLUMN "currency" TYPE "app"."Currency" USING ("currency"::"app"."Currency"),
  ALTER COLUMN "currency" SET DEFAULT 'PEN';

UPDATE "app"."accounts"
SET
  "userId" = (SELECT "id" FROM "app"."users" ORDER BY "createdAt" LIMIT 1),
  "accountNumber" = '20' || substr(md5("id"::text), 1, 16)
WHERE "userId" IS NULL;

ALTER TABLE "app"."accounts"
  ALTER COLUMN "userId" SET NOT NULL,
  ALTER COLUMN "accountNumber" SET NOT NULL,
  ALTER COLUMN "updatedAt" DROP DEFAULT;

CREATE UNIQUE INDEX "accounts_accountNumber_key" ON "app"."accounts"("accountNumber");
CREATE INDEX "accounts_userId_currency_idx" ON "app"."accounts"("userId", "currency");

ALTER TABLE "app"."accounts"
  ADD CONSTRAINT "accounts_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "app"."transactions" (
  "id" UUID NOT NULL,
  "accountId" UUID NOT NULL,
  "type" "app"."TransactionType" NOT NULL,
  "direction" "app"."TransactionDirection" NOT NULL,
  "status" "app"."TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
  "amount" DECIMAL(14,2) NOT NULL,
  "currency" "app"."Currency" NOT NULL,
  "description" VARCHAR(160) NOT NULL,
  "reference" VARCHAR(80),
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "app"."transfers" (
  "id" UUID NOT NULL,
  "sourceAccountId" UUID NOT NULL,
  "destinationAccountId" UUID NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "currency" "app"."Currency" NOT NULL,
  "status" "app"."TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
  "description" VARCHAR(160),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "app"."service_payments" (
  "id" UUID NOT NULL,
  "accountId" UUID NOT NULL,
  "provider" VARCHAR(100) NOT NULL,
  "customerReference" VARCHAR(80) NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "currency" "app"."Currency" NOT NULL,
  "status" "app"."TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "service_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "transactions_accountId_occurredAt_idx" ON "app"."transactions"("accountId", "occurredAt" DESC);
CREATE INDEX "transfers_sourceAccountId_createdAt_idx" ON "app"."transfers"("sourceAccountId", "createdAt" DESC);
CREATE INDEX "transfers_destinationAccountId_createdAt_idx" ON "app"."transfers"("destinationAccountId", "createdAt" DESC);
CREATE INDEX "service_payments_accountId_createdAt_idx" ON "app"."service_payments"("accountId", "createdAt" DESC);

ALTER TABLE "app"."transactions"
  ADD CONSTRAINT "transactions_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "app"."accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "app"."transfers"
  ADD CONSTRAINT "transfers_sourceAccountId_fkey"
  FOREIGN KEY ("sourceAccountId") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "transfers_destinationAccountId_fkey"
  FOREIGN KEY ("destinationAccountId") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "app"."service_payments"
  ADD CONSTRAINT "service_payments_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
