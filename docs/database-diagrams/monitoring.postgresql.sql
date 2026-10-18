-- Diagram export from monitoring-backend/prisma/schema.prisma. Do not apply to a live database.
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "monitoring";

-- CreateEnum
CREATE TYPE "monitoring"."ServiceStatus" AS ENUM ('OPERATIONAL', 'DEGRADED', 'UNAVAILABLE', 'RECOVERING');

-- CreateEnum
CREATE TYPE "monitoring"."EmployeeStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateTable
CREATE TABLE "monitoring"."employees" (
    "id" UUID NOT NULL,
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

-- CreateTable
CREATE TABLE "monitoring"."roles" (
    "id" UUID NOT NULL,
    "code" VARCHAR(60) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "is_system" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring"."permissions" (
    "id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "resource" VARCHAR(60) NOT NULL,
    "action" VARCHAR(40) NOT NULL,
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring"."employee_roles" (
    "employee_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_roles_pkey" PRIMARY KEY ("employee_id","role_id")
);

-- CreateTable
CREATE TABLE "monitoring"."role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "monitoring"."auth_sessions" (
    "id" UUID NOT NULL,
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

-- CreateTable
CREATE TABLE "monitoring"."audit_logs" (
    "id" UUID NOT NULL,
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

-- CreateTable
CREATE TABLE "monitoring"."MonitoredService" (
    "id" UUID NOT NULL,
    "code" VARCHAR(60) NOT NULL,
    "name" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "criticality" VARCHAR(20) NOT NULL DEFAULT 'HIGH',
    "monitoringEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pausedReason" VARCHAR(500),
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "monitoring"."ServiceStatus" NOT NULL DEFAULT 'RECOVERING',
    "lastCheckedAt" TIMESTAMP(3),
    "lastLatencyMs" INTEGER,
    "lastMessage" TEXT,
    "anomalyScore" DOUBLE PRECISION,
    "riskLevel" VARCHAR(20),
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "consecutiveSuccesses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonitoredService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring"."HealthCheck" (
    "id" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "status" "monitoring"."ServiceStatus" NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "reachable" BOOLEAN NOT NULL DEFAULT false,
    "timedOut" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "origin" VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring"."ServiceStateChange" (
    "id" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "fromStatus" "monitoring"."ServiceStatus" NOT NULL,
    "toStatus" "monitoring"."ServiceStatus" NOT NULL,
    "reason" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceStateChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring"."Incident" (
    "id" UUID NOT NULL,
    "serviceKey" VARCHAR(100) NOT NULL,
    "title" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "severity" VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    "evidence" JSONB,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastObservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring"."Alert" (
    "id" UUID NOT NULL,
    "incidentId" UUID NOT NULL,
    "kind" VARCHAR(30) NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring"."assistant_conversations" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "archived_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assistant_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring"."assistant_messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "provider" VARCHAR(40),
    "evidence" JSONB,
    "feedback" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistant_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring"."assistant_runs" (
    "id" UUID NOT NULL,
    "message_id" UUID NOT NULL,
    "provider" VARCHAR(40) NOT NULL,
    "model" VARCHAR(120),
    "status" VARCHAR(20) NOT NULL,
    "latency_ms" INTEGER NOT NULL,
    "prompt_tokens" INTEGER,
    "completion_tokens" INTEGER,
    "prompt_version" VARCHAR(30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistant_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_code_key" ON "monitoring"."employees"("employee_code");

-- CreateIndex
CREATE UNIQUE INDEX "employees_corporate_email_key" ON "monitoring"."employees"("corporate_email");

-- CreateIndex
CREATE INDEX "employees_status_idx" ON "monitoring"."employees"("status");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "monitoring"."roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "monitoring"."permissions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_resource_action_key" ON "monitoring"."permissions"("resource", "action");

-- CreateIndex
CREATE INDEX "employee_roles_role_id_idx" ON "monitoring"."employee_roles"("role_id");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "monitoring"."role_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_refresh_token_hash_key" ON "monitoring"."auth_sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "auth_sessions_employee_id_revoked_at_idx" ON "monitoring"."auth_sessions"("employee_id", "revoked_at");

-- CreateIndex
CREATE INDEX "auth_sessions_expires_at_idx" ON "monitoring"."auth_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "monitoring"."audit_logs"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_resource_created_at_idx" ON "monitoring"."audit_logs"("resource", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoredService_code_key" ON "monitoring"."MonitoredService"("code");

-- CreateIndex
CREATE INDEX "HealthCheck_serviceId_checkedAt_idx" ON "monitoring"."HealthCheck"("serviceId", "checkedAt");

-- CreateIndex
CREATE INDEX "ServiceStateChange_serviceId_changedAt_idx" ON "monitoring"."ServiceStateChange"("serviceId", "changedAt");

-- CreateIndex
CREATE INDEX "Incident_serviceKey_openedAt_idx" ON "monitoring"."Incident"("serviceKey", "openedAt");

-- CreateIndex
CREATE INDEX "Alert_incidentId_createdAt_idx" ON "monitoring"."Alert"("incidentId", "createdAt");

-- CreateIndex
CREATE INDEX "assistant_conversations_employee_id_deleted_at_updated_at_idx" ON "monitoring"."assistant_conversations"("employee_id", "deleted_at", "updated_at");

-- CreateIndex
CREATE INDEX "assistant_messages_conversation_id_created_at_id_idx" ON "monitoring"."assistant_messages"("conversation_id", "created_at", "id");

-- CreateIndex
CREATE UNIQUE INDEX "assistant_runs_message_id_key" ON "monitoring"."assistant_runs"("message_id");

-- AddForeignKey
ALTER TABLE "monitoring"."employee_roles" ADD CONSTRAINT "employee_roles_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "monitoring"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring"."employee_roles" ADD CONSTRAINT "employee_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "monitoring"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "monitoring"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring"."role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "monitoring"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring"."auth_sessions" ADD CONSTRAINT "auth_sessions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "monitoring"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring"."audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "monitoring"."employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring"."HealthCheck" ADD CONSTRAINT "HealthCheck_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "monitoring"."MonitoredService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring"."ServiceStateChange" ADD CONSTRAINT "ServiceStateChange_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "monitoring"."MonitoredService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring"."Alert" ADD CONSTRAINT "Alert_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "monitoring"."Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring"."assistant_conversations" ADD CONSTRAINT "assistant_conversations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "monitoring"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring"."assistant_messages" ADD CONSTRAINT "assistant_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "monitoring"."assistant_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring"."assistant_runs" ADD CONSTRAINT "assistant_runs_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "monitoring"."assistant_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

