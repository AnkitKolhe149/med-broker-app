-- Add bulk pricing columns to Inventory table
ALTER TABLE "Inventory" ADD COLUMN "bulkMinQty" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "Inventory" ADD COLUMN "bulkDiscountPercent" INTEGER NOT NULL DEFAULT 10;
