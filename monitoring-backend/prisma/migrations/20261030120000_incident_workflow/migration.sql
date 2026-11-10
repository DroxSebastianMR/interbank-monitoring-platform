CREATE TYPE "monitoring"."IncidentAttentionState" AS ENUM ('DETECTED','INVESTIGATING','IDENTIFIED','RECOVERING','RESOLVED','CLOSED');
CREATE TYPE "monitoring"."IncidentEventOrigin" AS ENUM ('SYSTEM','OPERATOR','IMPORT');
ALTER TABLE "monitoring"."Incident"
  ADD COLUMN "attentionState" "monitoring"."IncidentAttentionState" NOT NULL DEFAULT 'DETECTED',
  ADD COLUMN "technicalStatus" VARCHAR(20),
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "occurrence" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "assigneeId" UUID,
  ADD COLUMN "acknowledgedAt" TIMESTAMP(3),
  ADD COLUMN "acknowledgedById" UUID,
  ADD COLUMN "closedAt" TIMESTAMP(3),
  ADD COLUMN "closingSummary" VARCHAR(2000),
  ADD COLUMN "previousIncidentId" UUID,
  ADD COLUMN "recoveryEvidence" JSONB,
  ADD COLUMN "lastEvidence" JSONB,
  ADD COLUMN "severityOverride" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "legacyArchived" BOOLEAN NOT NULL DEFAULT false;

-- Existing resolved rows were historical records without an attention workflow.
-- Archive explicitly as legacy; do not claim a retrospectively validated manual closure.
UPDATE "monitoring"."Incident" SET "attentionState"='CLOSED', "closedAt"="resolvedAt",
  "legacyArchived"=true, "closingSummary"='Archivo histórico anterior al flujo de atención; no acredita cierre manual ni publicación.'
  WHERE "resolvedAt" IS NOT NULL;
UPDATE "monitoring"."Incident" SET "lastEvidence"="evidence";
DROP INDEX "monitoring"."Incident_one_active_per_service_idx";
CREATE UNIQUE INDEX "Incident_one_unclosed_per_service_idx" ON "monitoring"."Incident"("serviceKey") WHERE "closedAt" IS NULL;
CREATE INDEX "Incident_serviceKey_closedAt_idx" ON "monitoring"."Incident"("serviceKey","closedAt");
CREATE INDEX "Incident_openedAt_id_idx" ON "monitoring"."Incident"("openedAt","id");
CREATE INDEX "Incident_closedAt_openedAt_id_idx" ON "monitoring"."Incident"("closedAt","openedAt","id");
ALTER TABLE "monitoring"."Incident"
  ADD CONSTRAINT "Incident_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "monitoring"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "Incident_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "monitoring"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "Incident_previousIncidentId_fkey" FOREIGN KEY ("previousIncidentId") REFERENCES "monitoring"."Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "monitoring"."IncidentEvent" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "incidentId" UUID NOT NULL,
  "version" INTEGER NOT NULL, "occurrence" INTEGER NOT NULL,
  "kind" VARCHAR(40) NOT NULL, "origin" "monitoring"."IncidentEventOrigin" NOT NULL,
  "actorId" UUID, "reason" VARCHAR(2000) NOT NULL, "payload" JSONB,
  "commandId" UUID, "commandFingerprint" VARCHAR(64),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IncidentEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "IncidentEvent_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "monitoring"."Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "IncidentEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "monitoring"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "IncidentEvent_incidentId_version_key" ON "monitoring"."IncidentEvent"("incidentId","version");
CREATE UNIQUE INDEX "IncidentEvent_incidentId_commandId_key" ON "monitoring"."IncidentEvent"("incidentId","commandId");
CREATE INDEX "IncidentEvent_incidentId_occurrence_kind_idx" ON "monitoring"."IncidentEvent"("incidentId","occurrence","kind");
INSERT INTO "monitoring"."IncidentEvent" ("incidentId","version","occurrence","kind","origin","reason","payload")
 SELECT "id",0,1,'LEGACY_IMPORTED','IMPORT','Registro incorporado al flujo; no reconstruye eventos faltantes.',
 jsonb_build_object('legacyArchived',"legacyArchived",'originalOpenedAt',"openedAt",'originalResolvedAt',"resolvedAt")
 FROM "monitoring"."Incident";
