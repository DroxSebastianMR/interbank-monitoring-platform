CREATE TABLE "monitoring"."assistant_conversations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "title" VARCHAR(120) NOT NULL,
  "archived_at" TIMESTAMP(3),
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "assistant_conversations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "assistant_conversations_employee_id_deleted_at_updated_at_idx"
  ON "monitoring"."assistant_conversations"("employee_id", "deleted_at", "updated_at");
ALTER TABLE "monitoring"."assistant_conversations"
  ADD CONSTRAINT "assistant_conversations_employee_id_fkey" FOREIGN KEY ("employee_id")
  REFERENCES "monitoring"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "monitoring"."assistant_messages" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "conversation_id" UUID NOT NULL,
  "role" VARCHAR(20) NOT NULL,
  "content" TEXT NOT NULL,
  "provider" VARCHAR(40),
  "evidence" JSONB,
  "feedback" VARCHAR(20),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "assistant_messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "assistant_messages_conversation_id_created_at_id_idx"
  ON "monitoring"."assistant_messages"("conversation_id", "created_at", "id");
ALTER TABLE "monitoring"."assistant_messages"
  ADD CONSTRAINT "assistant_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id")
  REFERENCES "monitoring"."assistant_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "monitoring"."assistant_runs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
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
CREATE UNIQUE INDEX "assistant_runs_message_id_key" ON "monitoring"."assistant_runs"("message_id");
ALTER TABLE "monitoring"."assistant_runs"
  ADD CONSTRAINT "assistant_runs_message_id_fkey" FOREIGN KEY ("message_id")
  REFERENCES "monitoring"."assistant_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
