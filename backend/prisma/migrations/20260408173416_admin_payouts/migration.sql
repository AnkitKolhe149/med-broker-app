/*
  Warnings:

  - Added the required column `vendorId` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "vendorId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "commissionCents" INTEGER NOT NULL DEFAULT 0,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payout_transactionId_key" ON "Payout"("transactionId");

-- CreateIndex
CREATE INDEX "Payout_vendorId_idx" ON "Payout"("vendorId");

-- CreateIndex
CREATE INDEX "Payout_status_createdAt_idx" ON "Payout"("status", "createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_vendorId_idx" ON "OrderItem"("vendorId");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
