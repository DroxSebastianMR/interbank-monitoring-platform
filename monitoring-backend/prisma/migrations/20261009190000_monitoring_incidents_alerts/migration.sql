ALTER TABLE "monitoring"."Incident" RENAME COLUMN "serviceId" TO "serviceKey";
ALTER TABLE "monitoring"."Incident" ALTER COLUMN "serviceKey" TYPE VARCHAR(100) USING "serviceKey"::text;
ALTER TABLE "monitoring"."Incident" ADD COLUMN "severity" VARCHAR(20) NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "monitoring"."Incident" ADD COLUMN "evidence" JSONB;
ALTER TABLE "monitoring"."Incident" ADD COLUMN "lastObservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "monitoring"."Incident" ALTER COLUMN "status" TYPE VARCHAR(20);
CREATE INDEX "Incident_serviceKey_openedAt_idx" ON "monitoring"."Incident"("serviceKey", "openedAt");
CREATE UNIQUE INDEX "Incident_one_active_per_service_idx" ON "monitoring"."Incident"("serviceKey") WHERE "resolvedAt" IS NULL;

CREATE TABLE "monitoring"."Alert" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "incidentId" UUID NOT NULL,
    "kind" VARCHAR(30) NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Alert_incidentId_createdAt_idx" ON "monitoring"."Alert"("incidentId", "createdAt");
ALTER TABLE "monitoring"."Alert" ADD CONSTRAINT "Alert_incidentId_fkey"
  FOREIGN KEY ("incidentId") REFERENCES "monitoring"."Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
