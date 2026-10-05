ALTER TABLE "app"."transactions"
ADD COLUMN "transferId" UUID;

UPDATE "app"."transactions" AS movement
SET "transferId" = transfer."id"
FROM "app"."transfers" AS transfer
WHERE movement."type" = 'TRANSFER'
  AND movement."reference" = transfer."id"::TEXT;

CREATE INDEX "transactions_transferId_idx"
ON "app"."transactions"("transferId");

ALTER TABLE "app"."transactions"
ADD CONSTRAINT "transactions_transferId_fkey"
FOREIGN KEY ("transferId") REFERENCES "app"."transfers"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
