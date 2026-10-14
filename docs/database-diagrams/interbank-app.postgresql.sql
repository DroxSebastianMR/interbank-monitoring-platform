-- Diagram export from interbank-app-backend/prisma/schema.prisma. Do not apply to a live database.
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "app";

-- CreateEnum
CREATE TYPE "app"."UserStatus" AS ENUM ('ACTIVE', 'LOCKED', 'DISABLED');

-- CreateEnum
CREATE TYPE "app"."Currency" AS ENUM ('PEN', 'USD');

-- CreateEnum
CREATE TYPE "app"."AccountType" AS ENUM ('SAVINGS', 'CHECKING', 'CTS', 'TERM_DEPOSIT');

-- CreateEnum
CREATE TYPE "app"."AccountStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'CLOSED');

-- CreateEnum
CREATE TYPE "app"."TransferKind" AS ENUM ('OWN_ACCOUNTS', 'THIRD_PARTY');

-- CreateEnum
CREATE TYPE "app"."CardKind" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "app"."CardStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "app"."CardNetwork" AS ENUM ('VISA', 'MASTERCARD', 'AMEX');

-- CreateEnum
CREATE TYPE "app"."CardFormat" AS ENUM ('PHYSICAL', 'DIGITAL');

-- CreateEnum
CREATE TYPE "app"."TransactionType" AS ENUM ('DEPOSIT', 'TRANSFER', 'SERVICE_PAYMENT');

-- CreateEnum
CREATE TYPE "app"."TransactionDirection" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "app"."TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "app"."ServiceProviderStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "app"."PaymentReferenceType" AS ENUM ('CUSTOMER_CODE', 'SUPPLY_NUMBER', 'CONTRACT_NUMBER', 'DOCUMENT_NUMBER', 'PHONE_NUMBER', 'OTHER');

-- CreateEnum
CREATE TYPE "app"."ServiceDebtStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "app"."users" (
    "id" UUID NOT NULL,
    "documentNumber" VARCHAR(8) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" VARCHAR(100),
    "lastName" VARCHAR(100),
    "status" "app"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."accounts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "displayName" VARCHAR(100) NOT NULL,
    "accountNumber" VARCHAR(20) NOT NULL,
    "balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" "app"."Currency" NOT NULL DEFAULT 'PEN',
    "type" "app"."AccountType" NOT NULL DEFAULT 'SAVINGS',
    "accountTypeId" UUID NOT NULL DEFAULT '50000000-0000-4000-8000-000000000001',
    "status" "app"."AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "cci" CHAR(20) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "app"."transactions" (
    "id" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "transferId" UUID,
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

-- CreateTable
CREATE TABLE "app"."transfers" (
    "id" UUID NOT NULL,
    "sourceAccountId" UUID NOT NULL,
    "destinationAccountId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "kind" "app"."TransferKind" NOT NULL,
    "operationNumber" VARCHAR(32) NOT NULL,
    "idempotencyKey" VARCHAR(80) NOT NULL,
    "requestFingerprint" CHAR(64) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" "app"."Currency" NOT NULL,
    "status" "app"."TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "description" VARCHAR(160),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."service_payments" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "serviceAgreementId" UUID NOT NULL,
    "debtId" UUID,
    "transactionId" UUID NOT NULL,
    "operationNumber" VARCHAR(32) NOT NULL,
    "idempotencyKey" VARCHAR(80) NOT NULL,
    "requestFingerprint" CHAR(64) NOT NULL,
    "customerReference" VARCHAR(80) NOT NULL,
    "providerNameSnapshot" VARCHAR(120) NOT NULL,
    "serviceNameSnapshot" VARCHAR(120) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "commissionAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "currency" "app"."Currency" NOT NULL,
    "status" "app"."TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."service_categories" (
    "id" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "description" VARCHAR(240),
    "iconKey" VARCHAR(60) NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."service_providers" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "shortName" VARCHAR(60) NOT NULL,
    "legalName" VARCHAR(180),
    "logoUrl" VARCHAR(500),
    "searchAliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "app"."ServiceProviderStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."service_agreements" (
    "id" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "code" VARCHAR(60) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(240),
    "referenceLabel" VARCHAR(80) NOT NULL,
    "referenceType" "app"."PaymentReferenceType" NOT NULL,
    "referencePattern" VARCHAR(160),
    "referenceMinLength" INTEGER NOT NULL DEFAULT 1,
    "referenceMaxLength" INTEGER NOT NULL DEFAULT 80,
    "supportsDebtInquiry" BOOLEAN NOT NULL DEFAULT true,
    "supportsPartialPayment" BOOLEAN NOT NULL DEFAULT false,
    "currency" "app"."Currency" NOT NULL DEFAULT 'PEN',
    "commissionAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "minimumAmount" DECIMAL(14,2),
    "maximumAmount" DECIMAL(14,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."service_debts" (
    "id" UUID NOT NULL,
    "serviceAgreementId" UUID NOT NULL,
    "customerReference" VARCHAR(80) NOT NULL,
    "invoiceNumber" VARCHAR(80) NOT NULL,
    "description" VARCHAR(160) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "minimumPaymentAmount" DECIMAL(14,2),
    "currency" "app"."Currency" NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "app"."ServiceDebtStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."saved_service_payments" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "serviceAgreementId" UUID NOT NULL,
    "alias" VARCHAR(80) NOT NULL,
    "customerReference" VARCHAR(80) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_service_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_documentNumber_key" ON "app"."users"("documentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "app"."users"("email");

-- CreateIndex
CREATE INDEX "users_documentNumber_email_idx" ON "app"."users"("documentNumber", "email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_accountNumber_key" ON "app"."accounts"("accountNumber");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_cci_key" ON "app"."accounts"("cci");

-- CreateIndex
CREATE INDEX "accounts_userId_currency_idx" ON "app"."accounts"("userId", "currency");

-- CreateIndex
CREATE INDEX "accounts_userId_status_accountTypeId_idx" ON "app"."accounts"("userId", "status", "accountTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_id_userId_key" ON "app"."accounts"("id", "userId");

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
CREATE INDEX "transactions_accountId_occurredAt_id_idx" ON "app"."transactions"("accountId", "occurredAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "transactions_transferId_idx" ON "app"."transactions"("transferId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_transferId_direction_key" ON "app"."transactions"("transferId", "direction");

-- CreateIndex
CREATE UNIQUE INDEX "transfers_operationNumber_key" ON "app"."transfers"("operationNumber");

-- CreateIndex
CREATE INDEX "transfers_userId_createdAt_id_idx" ON "app"."transfers"("userId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "transfers_sourceAccountId_createdAt_id_idx" ON "app"."transfers"("sourceAccountId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "transfers_destinationAccountId_createdAt_id_idx" ON "app"."transfers"("destinationAccountId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "transfers_userId_idempotencyKey_key" ON "app"."transfers"("userId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "service_payments_transactionId_key" ON "app"."service_payments"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "service_payments_operationNumber_key" ON "app"."service_payments"("operationNumber");

-- CreateIndex
CREATE INDEX "service_payments_userId_createdAt_idx" ON "app"."service_payments"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "service_payments_accountId_createdAt_idx" ON "app"."service_payments"("accountId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "service_payments_serviceAgreementId_customerReference_idx" ON "app"."service_payments"("serviceAgreementId", "customerReference");

-- CreateIndex
CREATE INDEX "service_payments_debtId_idx" ON "app"."service_payments"("debtId");

-- CreateIndex
CREATE UNIQUE INDEX "service_payments_userId_idempotencyKey_key" ON "app"."service_payments"("userId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "service_categories_code_key" ON "app"."service_categories"("code");

-- CreateIndex
CREATE INDEX "service_categories_isActive_displayOrder_idx" ON "app"."service_categories"("isActive", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "service_providers_code_key" ON "app"."service_providers"("code");

-- CreateIndex
CREATE INDEX "service_providers_categoryId_status_displayOrder_idx" ON "app"."service_providers"("categoryId", "status", "displayOrder");

-- CreateIndex
CREATE INDEX "service_providers_status_name_idx" ON "app"."service_providers"("status", "name");

-- CreateIndex
CREATE UNIQUE INDEX "service_agreements_code_key" ON "app"."service_agreements"("code");

-- CreateIndex
CREATE INDEX "service_agreements_providerId_isActive_name_idx" ON "app"."service_agreements"("providerId", "isActive", "name");

-- CreateIndex
CREATE INDEX "service_debts_serviceAgreementId_customerReference_status_d_idx" ON "app"."service_debts"("serviceAgreementId", "customerReference", "status", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "service_debts_serviceAgreementId_invoiceNumber_key" ON "app"."service_debts"("serviceAgreementId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "saved_service_payments_userId_updatedAt_idx" ON "app"."saved_service_payments"("userId", "updatedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "saved_service_payments_userId_serviceAgreementId_customerRe_key" ON "app"."saved_service_payments"("userId", "serviceAgreementId", "customerReference");

-- AddForeignKey
ALTER TABLE "app"."accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "app"."transactions" ADD CONSTRAINT "transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "app"."accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."transactions" ADD CONSTRAINT "transactions_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "app"."transfers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."transfers" ADD CONSTRAINT "transfers_sourceAccountId_userId_fkey" FOREIGN KEY ("sourceAccountId", "userId") REFERENCES "app"."accounts"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."transfers" ADD CONSTRAINT "transfers_destinationAccountId_fkey" FOREIGN KEY ("destinationAccountId") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."transfers" ADD CONSTRAINT "transfers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."service_payments" ADD CONSTRAINT "service_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."service_payments" ADD CONSTRAINT "service_payments_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."service_payments" ADD CONSTRAINT "service_payments_serviceAgreementId_fkey" FOREIGN KEY ("serviceAgreementId") REFERENCES "app"."service_agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."service_payments" ADD CONSTRAINT "service_payments_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "app"."service_debts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."service_payments" ADD CONSTRAINT "service_payments_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "app"."transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."service_providers" ADD CONSTRAINT "service_providers_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "app"."service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."service_agreements" ADD CONSTRAINT "service_agreements_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "app"."service_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."service_debts" ADD CONSTRAINT "service_debts_serviceAgreementId_fkey" FOREIGN KEY ("serviceAgreementId") REFERENCES "app"."service_agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."saved_service_payments" ADD CONSTRAINT "saved_service_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."saved_service_payments" ADD CONSTRAINT "saved_service_payments_serviceAgreementId_fkey" FOREIGN KEY ("serviceAgreementId") REFERENCES "app"."service_agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

