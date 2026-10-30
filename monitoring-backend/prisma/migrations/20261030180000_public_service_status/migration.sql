CREATE TABLE "monitoring"."PublicServiceStatus" (
 "serviceKey" VARCHAR(60) NOT NULL PRIMARY KEY, "nextSequence" INTEGER NOT NULL DEFAULT 0,
 "publishedSequence" INTEGER NOT NULL DEFAULT 0, "status" VARCHAR(20) NOT NULL DEFAULT 'NO_DATA',
 "lastPublicationId" UUID, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "monitoring"."StatusPublication" (
 "id" UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, "serviceKey" VARCHAR(60) NOT NULL,
 "sequence" INTEGER NOT NULL, "deduplicationKey" VARCHAR(200) NOT NULL,
 "incidentId" UUID, "occurrence" INTEGER, "sourceServiceVersion" INTEGER NOT NULL,
 "sourceTechnicalStatus" VARCHAR(20) NOT NULL, "kind" VARCHAR(20) NOT NULL,
 "status" VARCHAR(20) NOT NULL, "templateVersion" VARCHAR(40) NOT NULL,
 "title" VARCHAR(200) NOT NULL, "body" VARCHAR(1000) NOT NULL,
 "state" VARCHAR(20) NOT NULL DEFAULT 'PENDING', "attempts" INTEGER NOT NULL DEFAULT 0,
 "lastError" VARCHAR(100), "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "publishedAt" TIMESTAMP(3), "visibleAt" TIMESTAMP(3), "expiresAt" TIMESTAMP(3),
 "approvedById" UUID, "approvalReason" VARCHAR(500),
 CONSTRAINT "StatusPublication_serviceKey_fkey" FOREIGN KEY ("serviceKey") REFERENCES "monitoring"."PublicServiceStatus"("serviceKey") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "StatusPublication_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "monitoring"."Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "StatusPublication_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "monitoring"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "StatusPublication_deduplicationKey_key" ON "monitoring"."StatusPublication"("deduplicationKey");
CREATE UNIQUE INDEX "StatusPublication_serviceKey_sequence_key" ON "monitoring"."StatusPublication"("serviceKey","sequence");
CREATE INDEX "StatusPublication_state_nextAttemptAt_idx" ON "monitoring"."StatusPublication"("state","nextAttemptAt");
CREATE INDEX "StatusPublication_serviceKey_state_sequence_idx" ON "monitoring"."StatusPublication"("serviceKey","state","sequence");
CREATE INDEX "StatusPublication_incidentId_createdAt_idx" ON "monitoring"."StatusPublication"("incidentId","createdAt");
CREATE UNIQUE INDEX "PublicServiceStatus_lastPublicationId_key" ON "monitoring"."PublicServiceStatus"("lastPublicationId");
ALTER TABLE "monitoring"."PublicServiceStatus" ADD CONSTRAINT "PublicServiceStatus_lastPublicationId_fkey"
 FOREIGN KEY ("lastPublicationId") REFERENCES "monitoring"."StatusPublication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
