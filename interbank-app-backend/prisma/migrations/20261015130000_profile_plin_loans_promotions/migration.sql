CREATE TYPE "app"."LoanApplicationStatus" AS ENUM ('PENDING_REVIEW', 'CANCELLED', 'REJECTED', 'APPROVED');
CREATE TYPE "app"."PromotionCategory" AS ENUM ('DINING', 'ENTERTAINMENT', 'SHOPPING', 'TRAVEL', 'OTHER');

ALTER TABLE "app"."users" ADD COLUMN "phoneNumber" VARCHAR(9), ADD COLUMN "phoneVerifiedAt" TIMESTAMP(3), ADD COLUMN "marketingOptIn" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "app"."users" ADD CONSTRAINT "users_phoneNumber_format_check" CHECK ("phoneNumber" IS NULL OR "phoneNumber" ~ '^9[0-9]{8}$');
CREATE UNIQUE INDEX "users_phoneNumber_key" ON "app"."users"("phoneNumber");

CREATE TABLE "app"."phone_challenges" (
  "userId" UUID NOT NULL, "phoneNumber" VARCHAR(9) NOT NULL, "codeHash" CHAR(64) NOT NULL,
  "salt" CHAR(32) NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "phone_challenges_pkey" PRIMARY KEY ("userId")
);
ALTER TABLE "app"."phone_challenges" ADD CONSTRAINT "phone_challenges_phoneNumber_format_check" CHECK ("phoneNumber" ~ '^9[0-9]{8}$');
ALTER TABLE "app"."phone_challenges" ADD CONSTRAINT "phone_challenges_attempts_check" CHECK ("attempts" BETWEEN 0 AND 5);
ALTER TABLE "app"."phone_challenges" ADD CONSTRAINT "phone_challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "app"."plin_enrollments" (
  "userId" UUID NOT NULL, "phoneNumber" VARCHAR(9) NOT NULL, "accountId" UUID NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "plin_enrollments_pkey" PRIMARY KEY ("userId")
);
ALTER TABLE "app"."plin_enrollments" ADD CONSTRAINT "plin_enrollments_phoneNumber_format_check" CHECK ("phoneNumber" ~ '^9[0-9]{8}$');
CREATE UNIQUE INDEX "plin_enrollments_phoneNumber_key" ON "app"."plin_enrollments"("phoneNumber");
CREATE INDEX "plin_enrollments_accountId_idx" ON "app"."plin_enrollments"("accountId");
ALTER TABLE "app"."plin_enrollments" ADD CONSTRAINT "plin_enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "app"."plin_enrollments" ADD CONSTRAINT "plin_enrollments_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "app"."plin_payments" (
  "id" UUID NOT NULL, "userId" UUID NOT NULL, "transferId" UUID NOT NULL,
  "recipientPhone" VARCHAR(9) NOT NULL, "idempotencyKey" VARCHAR(80) NOT NULL,
  "requestFingerprint" CHAR(64) NOT NULL, "amount" DECIMAL(14,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "plin_payments_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "app"."plin_payments" ADD CONSTRAINT "plin_payments_amount_check" CHECK ("amount" BETWEEN 1 AND 500);
CREATE UNIQUE INDEX "plin_payments_transferId_key" ON "app"."plin_payments"("transferId");
CREATE UNIQUE INDEX "plin_payments_userId_idempotencyKey_key" ON "app"."plin_payments"("userId", "idempotencyKey");
CREATE INDEX "plin_payments_userId_createdAt_idx" ON "app"."plin_payments"("userId", "createdAt" DESC);
ALTER TABLE "app"."plin_payments" ADD CONSTRAINT "plin_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "app"."plin_payments" ADD CONSTRAINT "plin_payments_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "app"."transfers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "app"."loan_applications" (
  "id" UUID NOT NULL, "userId" UUID NOT NULL, "destinationAccountId" UUID NOT NULL,
  "idempotencyKey" VARCHAR(80) NOT NULL, "requestFingerprint" CHAR(64) NOT NULL,
  "principal" DECIMAL(14,2) NOT NULL, "annualEffectiveRate" DECIMAL(7,4) NOT NULL,
  "monthlyPayment" DECIMAL(14,2) NOT NULL, "totalRepayment" DECIMAL(14,2) NOT NULL,
  "months" INTEGER NOT NULL, "status" "app"."LoanApplicationStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "loan_applications_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "app"."loan_applications" ADD CONSTRAINT "loan_applications_terms_check" CHECK ("principal" BETWEEN 1000 AND 50000 AND "months" IN (6,12,24,36) AND "monthlyPayment" > 0 AND "totalRepayment" >= "principal");
CREATE UNIQUE INDEX "loan_applications_userId_idempotencyKey_key" ON "app"."loan_applications"("userId", "idempotencyKey");
CREATE INDEX "loan_applications_userId_createdAt_idx" ON "app"."loan_applications"("userId", "createdAt" DESC);
ALTER TABLE "app"."loan_applications" ADD CONSTRAINT "loan_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "app"."loan_applications" ADD CONSTRAINT "loan_applications_destinationAccountId_fkey" FOREIGN KEY ("destinationAccountId") REFERENCES "app"."accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "app"."promotions" (
  "id" UUID NOT NULL, "title" VARCHAR(120) NOT NULL, "description" VARCHAR(500) NOT NULL,
  "category" "app"."PromotionCategory" NOT NULL, "imageUrl" VARCHAR(500), "termsUrl" VARCHAR(500),
  "startsAt" TIMESTAMP(3) NOT NULL, "endsAt" TIMESTAMP(3) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true, "priority" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "app"."promotions" ADD CONSTRAINT "promotions_date_range_check" CHECK ("endsAt" > "startsAt");
CREATE INDEX "promotions_isActive_startsAt_endsAt_priority_idx" ON "app"."promotions"("isActive", "startsAt", "endsAt", "priority");
CREATE TABLE "app"."promotion_favorites" (
  "userId" UUID NOT NULL, "promotionId" UUID NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "promotion_favorites_pkey" PRIMARY KEY ("userId", "promotionId")
);
CREATE INDEX "promotion_favorites_promotionId_idx" ON "app"."promotion_favorites"("promotionId");
ALTER TABLE "app"."promotion_favorites" ADD CONSTRAINT "promotion_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "app"."promotion_favorites" ADD CONSTRAINT "promotion_favorites_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "app"."promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
