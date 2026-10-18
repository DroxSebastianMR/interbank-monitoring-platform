CREATE TYPE "app"."PromotionRedemptionMethod" AS ENUM ('SHOW_CODE', 'ONLINE_CODE', 'AUTOMATIC');
CREATE TYPE "app"."PromotionVoucherStatus" AS ENUM ('ISSUED', 'USED', 'EXPIRED');

ALTER TABLE "app"."plin_payments" ADD COLUMN "senderPhone" VARCHAR(9);
ALTER TABLE "app"."plin_payments" ADD CONSTRAINT "plin_payments_sender_phone_check" CHECK ("senderPhone" IS NULL OR "senderPhone" ~ '^9[0-9]{8}$');

CREATE TABLE "app"."customer_details" (
  "userId" UUID NOT NULL,
  "preferredName" VARCHAR(100),
  "occupation" VARCHAR(100),
  "nationalityCode" CHAR(2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customer_details_pkey" PRIMARY KEY ("userId"),
  CONSTRAINT "customer_details_nationality_check" CHECK ("nationalityCode" IS NULL OR "nationalityCode" ~ '^[A-Z]{2}$')
);
ALTER TABLE "app"."customer_details" ADD CONSTRAINT "customer_details_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "app"."customer_addresses" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "label" VARCHAR(40) NOT NULL,
  "line1" VARCHAR(200) NOT NULL,
  "district" VARCHAR(100) NOT NULL,
  "province" VARCHAR(100) NOT NULL,
  "department" VARCHAR(100) NOT NULL,
  "countryCode" CHAR(2) NOT NULL DEFAULT 'PE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "customer_addresses_country_check" CHECK ("countryCode" ~ '^[A-Z]{2}$')
);
CREATE INDEX "customer_addresses_userId_createdAt_idx" ON "app"."customer_addresses"("userId", "createdAt" DESC);
ALTER TABLE "app"."customer_addresses" ADD CONSTRAINT "customer_addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "app"."plin_favorites" (
  "userId" UUID NOT NULL,
  "phoneNumber" VARCHAR(9) NOT NULL,
  "alias" VARCHAR(80),
  "preferredNetwork" VARCHAR(12) NOT NULL DEFAULT 'PLIN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "plin_favorites_pkey" PRIMARY KEY ("userId", "phoneNumber"),
  CONSTRAINT "plin_favorites_phone_check" CHECK ("phoneNumber" ~ '^9[0-9]{8}$'),
  CONSTRAINT "plin_favorites_network_check" CHECK ("preferredNetwork" IN ('PLIN', 'YAPE'))
);
CREATE INDEX "plin_favorites_userId_updatedAt_idx" ON "app"."plin_favorites"("userId", "updatedAt" DESC);
ALTER TABLE "app"."plin_favorites" ADD CONSTRAINT "plin_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "app"."promotion_merchants" (
  "id" UUID NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "logoUrl" VARCHAR(500),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "promotion_merchants_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "promotion_merchants_name_key" ON "app"."promotion_merchants"("name");

ALTER TABLE "app"."promotions"
  ADD COLUMN "merchantId" UUID,
  ADD COLUMN "redemptionMethod" "app"."PromotionRedemptionMethod" NOT NULL DEFAULT 'AUTOMATIC',
  ADD COLUMN "codePrefix" VARCHAR(12);
CREATE INDEX "promotions_merchantId_idx" ON "app"."promotions"("merchantId");
ALTER TABLE "app"."promotions" ADD CONSTRAINT "promotions_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "app"."promotion_merchants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "app"."promotions" ADD CONSTRAINT "promotions_code_prefix_check" CHECK ("codePrefix" IS NULL OR "codePrefix" ~ '^[A-Z0-9]{2,12}$');

CREATE TABLE "app"."promotion_vouchers" (
  "id" UUID NOT NULL,
  "promotionId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "code" VARCHAR(40) NOT NULL,
  "status" "app"."PromotionVoucherStatus" NOT NULL DEFAULT 'ISSUED',
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "promotion_vouchers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "promotion_vouchers_code_key" ON "app"."promotion_vouchers"("code");
CREATE UNIQUE INDEX "promotion_vouchers_promotionId_userId_key" ON "app"."promotion_vouchers"("promotionId", "userId");
CREATE INDEX "promotion_vouchers_userId_issuedAt_idx" ON "app"."promotion_vouchers"("userId", "issuedAt" DESC);
ALTER TABLE "app"."promotion_vouchers" ADD CONSTRAINT "promotion_vouchers_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "app"."promotions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "app"."promotion_vouchers" ADD CONSTRAINT "promotion_vouchers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
