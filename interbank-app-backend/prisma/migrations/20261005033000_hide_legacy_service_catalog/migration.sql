UPDATE "app"."service_categories"
SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'LEGACY';
