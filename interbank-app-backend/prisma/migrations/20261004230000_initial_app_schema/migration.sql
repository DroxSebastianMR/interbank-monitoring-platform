CREATE SCHEMA IF NOT EXISTS "app";

CREATE TYPE "app"."UserStatus" AS ENUM ('ACTIVE', 'LOCKED', 'DISABLED');

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

CREATE TABLE "app"."Account" (
    "id" UUID NOT NULL,
    "ownerName" TEXT NOT NULL,
    "balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_documentNumber_key" ON "app"."users"("documentNumber");
CREATE UNIQUE INDEX "users_email_key" ON "app"."users"("email");
CREATE INDEX "users_documentNumber_email_idx" ON "app"."users"("documentNumber", "email");
