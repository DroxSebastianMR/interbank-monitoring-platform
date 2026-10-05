BEGIN;

-- CreateEnum
CREATE TYPE "app"."AccountStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'CLOSED');

-- CreateEnum
CREATE TYPE "app"."CardKind" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "app"."CardStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "app"."CardNetwork" AS ENUM ('VISA', 'MASTERCARD', 'AMEX');

-- CreateEnum
CREATE TYPE "app"."CardFormat" AS ENUM ('PHYSICAL', 'DIGITAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.



-- AlterTable
ALTER TABLE "app"."accounts" ADD COLUMN     "accountTypeId" UUID NOT NULL DEFAULT '50000000-0000-4000-8000-000000000001',
ADD COLUMN     "cci" CHAR(20),
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "status" "app"."AccountStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "app"."account_types" (
    "id" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(300) NOT NULL,
    "type" "app"."AccountType" NOT NULL,
    "supportedCurrencies" "app"."Currency"[],
    "allowsDebits" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."card_types" (
    "id" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(300) NOT NULL,
    "kind" "app"."CardKind" NOT NULL,
    "network" "app"."CardNetwork" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."cards" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "cardTypeId" UUID NOT NULL,
    "kind" "app"."CardKind" NOT NULL,
    "lastFour" CHAR(4) NOT NULL,
    "displayName" VARCHAR(100) NOT NULL,
    "status" "app"."CardStatus" NOT NULL DEFAULT 'ACTIVE',
    "format" "app"."CardFormat" NOT NULL DEFAULT 'PHYSICAL',
    "expiresAt" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."account_cards" (
    "accountId" UUID NOT NULL,
    "cardId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "kind" "app"."CardKind" NOT NULL DEFAULT 'DEBIT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_cards_pkey" PRIMARY KEY ("accountId","cardId")
);

-- CreateTable
CREATE TABLE "app"."card_credit_balances" (
    "cardId" UUID NOT NULL,
    "currency" "app"."Currency" NOT NULL,
    "kind" "app"."CardKind" NOT NULL DEFAULT 'CREDIT',
    "creditLimit" DECIMAL(14,2) NOT NULL,
    "outstandingBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_credit_balances_pkey" PRIMARY KEY ("cardId","currency")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_types_code_key" ON "app"."account_types"("code");

-- CreateIndex
CREATE INDEX "account_types_isActive_displayOrder_idx" ON "app"."account_types"("isActive", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "account_types_id_type_key" ON "app"."account_types"("id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "card_types_code_key" ON "app"."card_types"("code");

-- CreateIndex
CREATE INDEX "card_types_isActive_kind_displayOrder_idx" ON "app"."card_types"("isActive", "kind", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "card_types_id_kind_key" ON "app"."card_types"("id", "kind");

-- CreateIndex
CREATE INDEX "cards_userId_status_kind_idx" ON "app"."cards"("userId", "status", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "cards_id_userId_kind_key" ON "app"."cards"("id", "userId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "cards_id_kind_key" ON "app"."cards"("id", "kind");

-- CreateIndex
CREATE INDEX "account_cards_cardId_idx" ON "app"."account_cards"("cardId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_cci_key" ON "app"."accounts"("cci");

-- CreateIndex
CREATE INDEX "accounts_userId_status_accountTypeId_idx" ON "app"."accounts"("userId", "status", "accountTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_id_userId_key" ON "app"."accounts"("id", "userId");

DROP INDEX "app"."transactions_accountId_occurredAt_idx";
CREATE INDEX "transactions_accountId_occurredAt_id_idx" ON "app"."transactions"("accountId", "occurredAt" DESC, "id" DESC);

-- Catalogs are required before adding the account foreign key. Existing balances
-- and transactions are preserved; legacy savings/checking keep their family.
INSERT INTO "app"."account_types"
    ("id", "code", "name", "description", "type", "supportedCurrencies", "allowsDebits", "displayOrder", "updatedAt")
VALUES
    ('50000000-0000-4000-8000-000000000001', 'SIMPLE', 'Cuenta Simple', 'Cuenta de ahorro de libre disponibilidad', 'SAVINGS', ARRAY['PEN','USD']::"app"."Currency"[], true, 10, CURRENT_TIMESTAMP),
    ('50000000-0000-4000-8000-000000000002', 'SALARY', 'Cuenta Sueldo', 'Cuenta de ahorro para recibir remuneraciones', 'SAVINGS', ARRAY['PEN','USD']::"app"."Currency"[], true, 20, CURRENT_TIMESTAMP),
    ('50000000-0000-4000-8000-000000000003', 'SUPER_RATE', 'Cuenta Súper Tasa', 'Cuenta de ahorro con rendimiento según condiciones del producto', 'SAVINGS', ARRAY['PEN','USD']::"app"."Currency"[], true, 30, CURRENT_TIMESTAMP),
    ('50000000-0000-4000-8000-000000000004', 'CHECKING', 'Cuenta Corriente', 'Cuenta corriente de libre disponibilidad', 'CHECKING', ARRAY['PEN','USD']::"app"."Currency"[], true, 40, CURRENT_TIMESTAMP),
    ('50000000-0000-4000-8000-000000000005', 'CTS', 'Cuenta CTS', 'Depósito CTS; retiros requieren un flujo específico', 'CTS', ARRAY['PEN','USD']::"app"."Currency"[], false, 50, CURRENT_TIMESTAMP),
    ('50000000-0000-4000-8000-000000000006', 'TERM_DEPOSIT', 'Depósito a Plazo', 'Depósito con vencimiento; no admite débitos transaccionales', 'TERM_DEPOSIT', ARRAY['PEN','USD']::"app"."Currency"[], false, 60, CURRENT_TIMESTAMP);

INSERT INTO "app"."card_types"
    ("id", "code", "name", "description", "kind", "network", "displayOrder", "updatedAt")
VALUES
    ('60000000-0000-4000-8000-000000000001', 'VISA_DEBIT_CLASSIC', 'Visa Débito Clásica', 'Tarjeta de débito vinculada a cuentas de depósito', 'DEBIT', 'VISA', 10, CURRENT_TIMESTAMP),
    ('60000000-0000-4000-8000-000000000002', 'VISA_DEBIT_BENEFIT', 'Visa Débito Benefit', 'Tarjeta de débito con programa de beneficios', 'DEBIT', 'VISA', 20, CURRENT_TIMESTAMP),
    ('60000000-0000-4000-8000-000000000003', 'VISA_CREDIT_CLASSIC', 'Visa Crédito Clásica', 'Tarjeta de crédito con saldos separados por moneda', 'CREDIT', 'VISA', 30, CURRENT_TIMESTAMP);

UPDATE "app"."accounts" SET "accountTypeId" = '50000000-0000-4000-8000-000000000004' WHERE "type" = 'CHECKING';

-- Simulation identifiers, not Interbank's real issuance/check-digit algorithm.
-- Identical to SimulatedCciPolicy; uniqueness is enforced by the database.
UPDATE "app"."accounts"
SET "cci" = '003' || lpad((('x' || substr(md5("id"::text), 1, 14))::bit(56)::bigint)::text, 17, '0');
ALTER TABLE "app"."accounts" ALTER COLUMN "cci" SET NOT NULL;

ALTER TABLE "app"."accounts" ADD CONSTRAINT "accounts_cci_format_check" CHECK ("cci" ~ '^[0-9]{20}$');
ALTER TABLE "app"."accounts" ADD CONSTRAINT "accounts_closed_at_check" CHECK (("status" = 'CLOSED') = ("closedAt" IS NOT NULL));
ALTER TABLE "app"."account_types" ALTER COLUMN "supportedCurrencies" SET NOT NULL;
ALTER TABLE "app"."account_types" ADD CONSTRAINT "account_types_currencies_check" CHECK (cardinality("supportedCurrencies") > 0);
ALTER TABLE "app"."cards" ADD CONSTRAINT "cards_last_four_check" CHECK ("lastFour" ~ '^[0-9]{4}$');
ALTER TABLE "app"."account_cards" ADD CONSTRAINT "account_cards_debit_only_check" CHECK ("kind" = 'DEBIT');
ALTER TABLE "app"."card_credit_balances" ADD CONSTRAINT "card_credit_balances_credit_only_check" CHECK ("kind" = 'CREDIT');
ALTER TABLE "app"."card_credit_balances" ADD CONSTRAINT "card_credit_balances_amounts_check" CHECK ("creditLimit" >= 0 AND "outstandingBalance" >= 0);

-- AddForeignKey
ALTER TABLE "app"."accounts" ADD CONSTRAINT "accounts_accountTypeId_type_fkey" FOREIGN KEY ("accountTypeId", "type") REFERENCES "app"."account_types"("id", "type") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."cards" ADD CONSTRAINT "cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."cards" ADD CONSTRAINT "cards_cardTypeId_kind_fkey" FOREIGN KEY ("cardTypeId", "kind") REFERENCES "app"."card_types"("id", "kind") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."account_cards" ADD CONSTRAINT "account_cards_accountId_userId_fkey" FOREIGN KEY ("accountId", "userId") REFERENCES "app"."accounts"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."account_cards" ADD CONSTRAINT "account_cards_cardId_userId_kind_fkey" FOREIGN KEY ("cardId", "userId", "kind") REFERENCES "app"."cards"("id", "userId", "kind") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."card_credit_balances" ADD CONSTRAINT "card_credit_balances_cardId_kind_fkey" FOREIGN KEY ("cardId", "kind") REFERENCES "app"."cards"("id", "kind") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
