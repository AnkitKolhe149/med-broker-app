-- AlterTable
ALTER TABLE "Inventory" ADD COLUMN     "baseCurrencyCode" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "basePriceMinor" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fxRateToBase" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN     "sourceCurrencyCode" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "sourcePriceMinor" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Inventory_sourceCurrencyCode_idx" ON "Inventory"("sourceCurrencyCode");
