/*
  Warnings:

  - You are about to drop the column `baseCurrencyCode` on the `Inventory` table. All the data in the column will be lost.
  - You are about to drop the column `basePriceMinor` on the `Inventory` table. All the data in the column will be lost.
  - You are about to drop the column `fxRateToBase` on the `Inventory` table. All the data in the column will be lost.
  - You are about to drop the column `sourceCurrencyCode` on the `Inventory` table. All the data in the column will be lost.
  - You are about to drop the column `sourcePriceMinor` on the `Inventory` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Inventory_sourceCurrencyCode_idx";

-- AlterTable
ALTER TABLE "Inventory" DROP COLUMN "baseCurrencyCode",
DROP COLUMN "basePriceMinor",
DROP COLUMN "fxRateToBase",
DROP COLUMN "sourceCurrencyCode",
DROP COLUMN "sourcePriceMinor";
