CREATE TYPE "app"."ServiceProviderStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');
CREATE TYPE "app"."PaymentReferenceType" AS ENUM ('CUSTOMER_CODE', 'SUPPLY_NUMBER', 'CONTRACT_NUMBER', 'DOCUMENT_NUMBER', 'PHONE_NUMBER', 'OTHER');
CREATE TYPE "app"."ServiceDebtStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'CANCELLED');

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

ALTER TABLE "app"."service_payments" RENAME COLUMN "provider" TO "providerNameSnapshot";
ALTER TABLE "app"."service_payments"
  ADD COLUMN "userId" UUID,
  ADD COLUMN "serviceAgreementId" UUID,
  ADD COLUMN "debtId" UUID,
  ADD COLUMN "transactionId" UUID,
  ADD COLUMN "operationNumber" VARCHAR(32),
  ADD COLUMN "idempotencyKey" VARCHAR(80),
  ADD COLUMN "requestFingerprint" CHAR(64),
  ADD COLUMN "serviceNameSnapshot" VARCHAR(120),
  ADD COLUMN "commissionAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN "totalAmount" DECIMAL(14,2),
  ADD COLUMN "paidAt" TIMESTAMP(3),
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

INSERT INTO "app"."service_categories" (
  "id", "code", "name", "description", "iconKey", "displayOrder", "updatedAt"
)
SELECT
  '00000000-0000-4000-9000-000000000001', 'LEGACY', 'Históricos',
  'Registros conservados de versiones anteriores', 'archive', 999, CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "app"."service_payments");

INSERT INTO "app"."service_providers" (
  "id", "categoryId", "code", "name", "shortName", "displayOrder", "status", "updatedAt"
)
SELECT
  '00000000-0000-4000-9000-000000000002',
  '00000000-0000-4000-9000-000000000001',
  'LEGACY_PROVIDER', 'Proveedor histórico', 'Histórico', 999, 'INACTIVE', CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "app"."service_payments");

INSERT INTO "app"."service_agreements" (
  "id", "providerId", "code", "name", "referenceLabel", "referenceType",
  "supportsDebtInquiry", "currency", "isActive", "updatedAt"
)
SELECT
  '00000000-0000-4000-9000-000000000003',
  '00000000-0000-4000-9000-000000000002',
  'LEGACY_SERVICE', 'Servicio histórico', 'Código', 'OTHER', false, 'PEN', false, CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "app"."service_payments");

UPDATE "app"."service_payments" AS payment
SET
  "userId" = account."userId",
  "serviceAgreementId" = '00000000-0000-4000-9000-000000000003',
  "operationNumber" = 'PSV-LEGACY-' || SUBSTRING(payment."id"::TEXT, 1, 12),
  "idempotencyKey" = 'legacy-' || payment."id"::TEXT,
  "requestFingerprint" = REPEAT('0', 32) || MD5(payment."id"::TEXT),
  "serviceNameSnapshot" = 'Servicio histórico',
  "totalAmount" = payment."amount",
  "paidAt" = payment."createdAt"
FROM "app"."accounts" AS account
WHERE account."id" = payment."accountId";

UPDATE "app"."service_payments" AS payment
SET "transactionId" = movement."id"
FROM "app"."transactions" AS movement
WHERE movement."accountId" = payment."accountId"
  AND movement."type" = 'SERVICE_PAYMENT'
  AND movement."reference" = payment."id"::TEXT;

INSERT INTO "app"."transactions" (
  "id", "accountId", "type", "direction", "status", "amount", "currency",
  "description", "reference", "occurredAt"
)
SELECT
  payment."id", payment."accountId", 'SERVICE_PAYMENT', 'DEBIT', payment."status",
  payment."amount", payment."currency", 'Pago de servicio histórico',
  payment."operationNumber", payment."createdAt"
FROM "app"."service_payments" AS payment
WHERE payment."transactionId" IS NULL;

UPDATE "app"."service_payments"
SET "transactionId" = "id"
WHERE "transactionId" IS NULL;

ALTER TABLE "app"."service_payments"
  ALTER COLUMN "userId" SET NOT NULL,
  ALTER COLUMN "serviceAgreementId" SET NOT NULL,
  ALTER COLUMN "transactionId" SET NOT NULL,
  ALTER COLUMN "operationNumber" SET NOT NULL,
  ALTER COLUMN "idempotencyKey" SET NOT NULL,
  ALTER COLUMN "requestFingerprint" SET NOT NULL,
  ALTER COLUMN "serviceNameSnapshot" SET NOT NULL,
  ALTER COLUMN "totalAmount" SET NOT NULL;

CREATE UNIQUE INDEX "service_categories_code_key" ON "app"."service_categories"("code");
CREATE INDEX "service_categories_isActive_displayOrder_idx" ON "app"."service_categories"("isActive", "displayOrder");
CREATE UNIQUE INDEX "service_providers_code_key" ON "app"."service_providers"("code");
CREATE INDEX "service_providers_categoryId_status_displayOrder_idx" ON "app"."service_providers"("categoryId", "status", "displayOrder");
CREATE INDEX "service_providers_status_name_idx" ON "app"."service_providers"("status", "name");
CREATE UNIQUE INDEX "service_agreements_code_key" ON "app"."service_agreements"("code");
CREATE INDEX "service_agreements_providerId_isActive_name_idx" ON "app"."service_agreements"("providerId", "isActive", "name");
CREATE UNIQUE INDEX "service_debts_serviceAgreementId_invoiceNumber_key" ON "app"."service_debts"("serviceAgreementId", "invoiceNumber");
CREATE INDEX "service_debts_serviceAgreementId_customerReference_status_dueDate_idx" ON "app"."service_debts"("serviceAgreementId", "customerReference", "status", "dueDate");
CREATE UNIQUE INDEX "saved_service_payments_userId_serviceAgreementId_customerReference_key" ON "app"."saved_service_payments"("userId", "serviceAgreementId", "customerReference");
CREATE INDEX "saved_service_payments_userId_updatedAt_idx" ON "app"."saved_service_payments"("userId", "updatedAt" DESC);
CREATE UNIQUE INDEX "service_payments_transactionId_key" ON "app"."service_payments"("transactionId");
CREATE UNIQUE INDEX "service_payments_operationNumber_key" ON "app"."service_payments"("operationNumber");
CREATE UNIQUE INDEX "service_payments_userId_idempotencyKey_key" ON "app"."service_payments"("userId", "idempotencyKey");
CREATE INDEX "service_payments_userId_createdAt_idx" ON "app"."service_payments"("userId", "createdAt" DESC);
CREATE INDEX "service_payments_serviceAgreementId_customerReference_idx" ON "app"."service_payments"("serviceAgreementId", "customerReference");
CREATE INDEX "service_payments_debtId_idx" ON "app"."service_payments"("debtId");

ALTER TABLE "app"."service_providers"
  ADD CONSTRAINT "service_providers_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "app"."service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "app"."service_agreements"
  ADD CONSTRAINT "service_agreements_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "app"."service_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "app"."service_debts"
  ADD CONSTRAINT "service_debts_serviceAgreementId_fkey" FOREIGN KEY ("serviceAgreementId") REFERENCES "app"."service_agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "app"."saved_service_payments"
  ADD CONSTRAINT "saved_service_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "saved_service_payments_serviceAgreementId_fkey" FOREIGN KEY ("serviceAgreementId") REFERENCES "app"."service_agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "app"."service_payments"
  ADD CONSTRAINT "service_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "service_payments_serviceAgreementId_fkey" FOREIGN KEY ("serviceAgreementId") REFERENCES "app"."service_agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "service_payments_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "app"."service_debts"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "service_payments_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "app"."transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
