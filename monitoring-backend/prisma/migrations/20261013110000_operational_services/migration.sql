ALTER TABLE "monitoring"."MonitoredService" ADD COLUMN "code" VARCHAR(60);
WITH candidates AS (
  SELECT "id", "createdAt", CASE
    WHEN "endpoint" LIKE '%/auth/health' THEN 'login'
    WHEN "endpoint" LIKE '%/accounts/health' THEN 'balance'
    WHEN "endpoint" LIKE '%/transfers/health' THEN 'transfers'
    ELSE NULL
  END AS preferred_code
  FROM "monitoring"."MonitoredService"
), ranked AS (
  SELECT "id", preferred_code, ROW_NUMBER() OVER (PARTITION BY preferred_code ORDER BY "createdAt", "id") AS position
  FROM candidates
)
UPDATE "monitoring"."MonitoredService" AS service
SET "code" = CASE
  WHEN ranked.position = 1 AND ranked.preferred_code IS NOT NULL THEN ranked.preferred_code
  ELSE LEFT(REPLACE(service."id"::text, '-', ''), 60)
END
FROM ranked WHERE ranked."id" = service."id";
ALTER TABLE "monitoring"."MonitoredService" ALTER COLUMN "code" SET NOT NULL;
CREATE UNIQUE INDEX "MonitoredService_code_key" ON "monitoring"."MonitoredService"("code");
UPDATE "monitoring"."MonitoredService" SET "endpoint" = '/auth/health' WHERE "code" = 'login';
UPDATE "monitoring"."MonitoredService" SET "endpoint" = '/accounts/health' WHERE "code" = 'balance';
UPDATE "monitoring"."MonitoredService" SET "endpoint" = '/transfers/health' WHERE "code" = 'transfers';
ALTER TABLE "monitoring"."MonitoredService"
  ADD COLUMN "criticality" VARCHAR(20) NOT NULL DEFAULT 'HIGH',
  ADD COLUMN "monitoringEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "pausedReason" VARCHAR(500),
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "lastLatencyMs" INTEGER,
  ADD COLUMN "lastMessage" TEXT,
  ADD COLUMN "anomalyScore" DOUBLE PRECISION,
  ADD COLUMN "riskLevel" VARCHAR(20),
  ADD COLUMN "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "consecutiveSuccesses" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "monitoring"."HealthCheck"
  ADD COLUMN "reachable" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "timedOut" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "message" TEXT,
  ADD COLUMN "origin" VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED';

CREATE TABLE "monitoring"."ServiceStateChange" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "serviceId" UUID NOT NULL,
  "fromStatus" "monitoring"."ServiceStatus" NOT NULL,
  "toStatus" "monitoring"."ServiceStatus" NOT NULL,
  "reason" TEXT,
  "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ServiceStateChange_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ServiceStateChange_serviceId_changedAt_idx"
  ON "monitoring"."ServiceStateChange"("serviceId", "changedAt");
ALTER TABLE "monitoring"."ServiceStateChange" ADD CONSTRAINT "ServiceStateChange_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "monitoring"."MonitoredService"("id") ON DELETE CASCADE ON UPDATE CASCADE;
