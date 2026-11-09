-- Preserve the legacy list's employee/date prefix and add a stable cursor tie-breaker.
CREATE INDEX "notifications_employeeId_createdAt_id_idx"
  ON "monitoring"."notifications"("employeeId", "createdAt", "id");
CREATE INDEX "notifications_employeeId_readAt_idx"
  ON "monitoring"."notifications"("employeeId", "readAt");
DROP INDEX "monitoring"."notifications_employeeId_createdAt_idx";
