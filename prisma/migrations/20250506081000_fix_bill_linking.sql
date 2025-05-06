-- Fix bill linking relationships
ALTER TABLE "Bill" ADD COLUMN IF NOT EXISTS "paidByBillId" TEXT REFERENCES "Bill"("id");
ALTER TABLE "Bill" ADD COLUMN IF NOT EXISTS "linkingDate" TIMESTAMP(3);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "Bill_paidByBillId_idx" ON "Bill"("paidByBillId");

-- Add a constraint to prevent self-referential links
ALTER TABLE "Bill" ADD CONSTRAINT "prevent_self_reference" 
  CHECK ("id" != "paidByBillId");
