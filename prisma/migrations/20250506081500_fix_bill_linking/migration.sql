-- Drop existing bill linking columns and constraints
ALTER TABLE "Bill" DROP COLUMN IF EXISTS "paidByBillId";
ALTER TABLE "Bill" DROP COLUMN IF EXISTS "linkingDate";

-- Add new bill linking columns
ALTER TABLE "Bill" ADD COLUMN "paidByBillId" TEXT REFERENCES "Bill"("id");
ALTER TABLE "Bill" ADD COLUMN "linkingDate" TIMESTAMP(3);

-- Add index for performance
CREATE INDEX IF NOT EXISTS "Bill_paidByBillId_idx" ON "Bill"("paidByBillId");
