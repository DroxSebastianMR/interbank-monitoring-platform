ALTER TABLE "app"."plin_enrollments" DROP CONSTRAINT "plin_enrollments_accountId_fkey";
ALTER TABLE "app"."plin_enrollments" ADD CONSTRAINT "plin_enrollments_accountId_userId_fkey"
  FOREIGN KEY ("accountId", "userId") REFERENCES "app"."accounts"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "app"."loan_applications" DROP CONSTRAINT "loan_applications_destinationAccountId_fkey";
ALTER TABLE "app"."loan_applications" ADD CONSTRAINT "loan_applications_destinationAccountId_userId_fkey"
  FOREIGN KEY ("destinationAccountId", "userId") REFERENCES "app"."accounts"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;
