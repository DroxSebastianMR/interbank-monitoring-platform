CREATE SCHEMA IF NOT EXISTS "monitoring";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "monitoring"."ServiceStatus" AS ENUM ('OPERATIONAL', 'DEGRADED', 'UNAVAILABLE', 'RECOVERING');
CREATE TYPE "monitoring"."EmployeeStatus" AS ENUM ('ACTIVE', 'DISABLED');

CREATE TABLE "monitoring"."MonitoredService" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "status" "monitoring"."ServiceStatus" NOT NULL DEFAULT 'RECOVERING',
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MonitoredService_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "monitoring"."HealthCheck" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "serviceId" UUID NOT NULL,
    "status" "monitoring"."ServiceStatus" NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthCheck_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "monitoring"."Incident" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "serviceId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "monitoring"."employees" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_code" VARCHAR(30) NOT NULL,
    "corporate_email" VARCHAR(254) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(80) NOT NULL,
    "last_name" VARCHAR(120) NOT NULL,
    "job_title" VARCHAR(120),
    "department" VARCHAR(120),
    "status" "monitoring"."EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "password_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "monitoring"."roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(60) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "is_system" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "monitoring"."permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(100) NOT NULL,
    "resource" VARCHAR(60) NOT NULL,
    "action" VARCHAR(40) NOT NULL,
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "monitoring"."employee_roles" (
    "employee_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "employee_roles_pkey" PRIMARY KEY ("employee_id", "role_id")
);

CREATE TABLE "monitoring"."role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id")
);

CREATE TABLE "monitoring"."auth_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "refresh_token_hash" CHAR(64) NOT NULL,
    "ip_address" VARCHAR(64),
    "user_agent" VARCHAR(500),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "monitoring"."audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "resource" VARCHAR(80) NOT NULL,
    "resource_id" VARCHAR(100),
    "outcome" VARCHAR(20) NOT NULL,
    "ip_address" VARCHAR(64),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "employees_employee_code_key" ON "monitoring"."employees"("employee_code");
CREATE UNIQUE INDEX "employees_corporate_email_key" ON "monitoring"."employees"("corporate_email");
CREATE INDEX "employees_status_idx" ON "monitoring"."employees"("status");
CREATE UNIQUE INDEX "roles_code_key" ON "monitoring"."roles"("code");
CREATE UNIQUE INDEX "permissions_code_key" ON "monitoring"."permissions"("code");
CREATE UNIQUE INDEX "permissions_resource_action_key" ON "monitoring"."permissions"("resource", "action");
CREATE INDEX "employee_roles_role_id_idx" ON "monitoring"."employee_roles"("role_id");
CREATE INDEX "role_permissions_permission_id_idx" ON "monitoring"."role_permissions"("permission_id");
CREATE UNIQUE INDEX "auth_sessions_refresh_token_hash_key" ON "monitoring"."auth_sessions"("refresh_token_hash");
CREATE INDEX "auth_sessions_employee_id_revoked_at_idx" ON "monitoring"."auth_sessions"("employee_id", "revoked_at");
CREATE INDEX "auth_sessions_expires_at_idx" ON "monitoring"."auth_sessions"("expires_at");
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "monitoring"."audit_logs"("actor_id", "created_at");
CREATE INDEX "audit_logs_resource_created_at_idx" ON "monitoring"."audit_logs"("resource", "created_at");
CREATE INDEX "HealthCheck_serviceId_checkedAt_idx" ON "monitoring"."HealthCheck"("serviceId", "checkedAt");

ALTER TABLE "monitoring"."HealthCheck" ADD CONSTRAINT "HealthCheck_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "monitoring"."MonitoredService"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "monitoring"."employee_roles" ADD CONSTRAINT "employee_roles_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "monitoring"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "monitoring"."employee_roles" ADD CONSTRAINT "employee_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "monitoring"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "monitoring"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "monitoring"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "monitoring"."role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "monitoring"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "monitoring"."auth_sessions" ADD CONSTRAINT "auth_sessions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "monitoring"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "monitoring"."audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "monitoring"."employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
