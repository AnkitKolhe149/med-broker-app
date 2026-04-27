-- Simplified pricing: remove bulk fields, keep only Retail and Wholesale tiers

-- -- Drop bulk fields from Medicine table
-- ALTER TABLE "Medicine" DROP COLUMN IF EXISTS "bulkMinQty";
-- ALTER TABLE "Medicine" DROP COLUMN IF EXISTS "bulkPriceCents";

-- -- Drop bulk fields from Inventory table
-- ALTER TABLE "Inventory" DROP COLUMN IF EXISTS "bulkMinQty";
-- ALTER TABLE "Inventory" DROP COLUMN IF EXISTS "bulkDiscountPercent";
