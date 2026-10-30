-- Additive evidence only: existing observations, services and incidents are preserved.
ALTER TABLE "monitoring"."MonitoredService" ADD COLUMN "evaluation" JSONB;
ALTER TABLE "monitoring"."HealthCheck" ADD COLUMN "evaluation" JSONB;
