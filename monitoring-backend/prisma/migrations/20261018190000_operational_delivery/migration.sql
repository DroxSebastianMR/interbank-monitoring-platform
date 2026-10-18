CREATE TABLE "monitoring"."operational_outbox" (
  "id" UUID NOT NULL,
  "incidentId" UUID NOT NULL,
  "eventType" VARCHAR(40) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "queuedAt" TIMESTAMP(3),
  "processedAt" TIMESTAMP(3),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" VARCHAR(120),
  CONSTRAINT "operational_outbox_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "operational_outbox_processedAt_attempts_queuedAt_createdAt_idx" ON "monitoring"."operational_outbox"("processedAt", "attempts", "queuedAt", "createdAt");
CREATE TABLE "monitoring"."notifications" (
  "id" UUID NOT NULL,
  "employeeId" UUID NOT NULL,
  "eventId" UUID NOT NULL,
  "incidentId" UUID NOT NULL,
  "eventType" VARCHAR(40) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" TIMESTAMP(3),
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notifications_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "monitoring"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "notifications_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "monitoring"."operational_outbox"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "notifications_employeeId_eventId_key" ON "monitoring"."notifications"("employeeId", "eventId");
CREATE INDEX "notifications_employeeId_createdAt_idx" ON "monitoring"."notifications"("employeeId", "createdAt");
