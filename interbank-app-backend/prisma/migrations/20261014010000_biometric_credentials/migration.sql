CREATE TABLE "app"."biometric_credentials" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "deviceId" VARCHAR(128) NOT NULL,
  "tokenHash" CHAR(64) NOT NULL,
  "credentialProof" VARCHAR(64) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "lastUsedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "biometric_credentials_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "biometric_credentials_tokenHash_key" ON "app"."biometric_credentials"("tokenHash");
CREATE UNIQUE INDEX "biometric_credentials_userId_deviceId_key" ON "app"."biometric_credentials"("userId", "deviceId");
CREATE INDEX "biometric_credentials_expiresAt_idx" ON "app"."biometric_credentials"("expiresAt");

ALTER TABLE "app"."biometric_credentials"
  ADD CONSTRAINT "biometric_credentials_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
