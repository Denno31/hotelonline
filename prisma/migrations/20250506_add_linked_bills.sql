-- AlterTable
ALTER TABLE "Bill" ADD COLUMN "paidByBillId" TEXT,
ADD COLUMN "linkingDate" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_paidByBillId_fkey" FOREIGN KEY ("paidByBillId") REFERENCES "Bill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Bill_paidByBillId_idx" ON "Bill"("paidByBillId");
