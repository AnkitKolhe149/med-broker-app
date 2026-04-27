# PRICING SYSTEM SIMPLIFIED: RETAIL & WHOLESALE ONLY
## Removal of Bulk Pricing Tier - April 28, 2026

---

## WHAT CHANGED

The 3-tier pricing system has been simplified to **2 tiers**:

```
BEFORE (3 tiers):
  ├─ Tier 0: RETAIL (retail price)
  ├─ Tier 1: B2B STANDARD/WHOLESALE (wholesale price)
  └─ Tier 2: B2B BULK (bulk price with volume threshold)

AFTER (2 tiers):
  ├─ Tier 0: RETAIL (retail price)
  └─ Tier 1: WHOLESALE (wholesale price - no volume threshold)
```

**The bulk tier has been completely removed.** All B2B/wholesale buyers now get the same wholesale price regardless of order quantity.

---

## FILES MODIFIED

### Database Schema
**File**: `backend/prisma/schema.prisma`

**Removed fields**:
- ❌ `Medicine.bulkMinQty` - minimum quantity threshold
- ❌ `Medicine.bulkPriceCents` - bulk pricing
- ❌ `Inventory.bulkMinQty` - duplicate field
- ❌ `Inventory.bulkDiscountPercent` - discount percentage

**Remaining fields** (Retail & Wholesale only):
- ✅ `Medicine.priceCents` - Retail price
- ✅ `Medicine.wholesalePriceCents` - Wholesale price

---

### Backend Pricing Logic
**File**: `backend/src/modules/orders/orderPricing.util.js`

**Changes**:
- ✅ Simplified `resolveOrderItemUnitPriceCents()` to just check buyerType
- ✅ No more bulk quantity checks
- ✅ No more bulk package type handling
- ✅ Updated `validatePricingLogic()` to only check Retail ≥ Wholesale

**New Logic**:
```javascript
if (buyerType === 'WHOLESALE') {
  return wholesalePrice;
}
return retailPrice;
```

---

### Backend Inventory Service
**File**: `backend/src/modules/inventory/inventory.service.js`

**Changes**:
- ✅ Removed destructuring of `bulkPriceCents` and `bulkMinQty`
- ✅ Removed all bulk field normalization logic
- ✅ Removed bulk validation checks
- ✅ Simplified validation to only check Retail vs Wholesale

**Validation now only checks**:
```javascript
if (wholesale && wholesale > retail) {
  throw new ValidationError(
    'Wholesale Price cannot exceed Retail Price'
  );
}
```

---

### Frontend: Vendor UI
**File**: `frontend/src/pages/vendor/MedicineManager.jsx`

**Removed from form**:
- ❌ "Minimum Quantity for Bulk Pricing" input field
- ❌ "B2B Bulk Price" input field
- ❌ Bulk price validation in handlers

**Remaining price fields**:
- ✅ "Selling Price (Retail)" - what retail customers pay
- ✅ "B2B Standard Price (Wholesale)" - what B2B customers pay

**Table display simplified**:
```
BEFORE: Retail $100 • Wholesale $80 • Bulk 100+ @ $60
AFTER:  Retail $100 • Wholesale $80
```

---

### Frontend: Pricing Service
**File**: `frontend/src/services/pricing.service.js`

**Changes**:
- ✅ Removed `bulkPrice` and `bulkMinQty` from calculations
- ✅ Removed `bulkMinQty` parameter from `resolveUnitPrice()`
- ✅ Removed bulk package type handling
- ✅ Removed quantity-based pricing logic

**Updated `mapMedicinePricing()` returns**:
```javascript
{
  retailPrice,      // Tier 0
  wholesalePrice    // Tier 1
  // bulkPrice removed
  // bulkMinQty removed
}
```

---

### Database Migration
**File**: `backend/prisma/migrations/20260428_remove_bulk_pricing/migration.sql`

**Migration actions**:
```sql
ALTER TABLE "Medicine" DROP COLUMN IF EXISTS "bulkMinQty";
ALTER TABLE "Medicine" DROP COLUMN IF EXISTS "bulkPriceCents";
ALTER TABLE "Inventory" DROP COLUMN IF EXISTS "bulkMinQty";
ALTER TABLE "Inventory" DROP COLUMN IF EXISTS "bulkDiscountPercent";
```

---

## PRICING EXAMPLES

### Before (3-tier system)
```
Product: Paracetamol 500mg

Retail Customer:
  Unit Price: ₹100 (Tier 0)
  Order 5 units → 5 × ₹100 = ₹500

B2B Customer (wholesale):
  Small Order (10 units, < 100 minimum):
    Unit Price: ₹80 (Tier 1 - B2B Standard)
    Order 10 × ₹80 = ₹800
  
  Large Order (200 units, ≥ 100 minimum):
    Unit Price: ₹60 (Tier 2 - B2B Bulk)
    Order 200 × ₹60 = ₹12,000
```

### After (2-tier system)
```
Product: Paracetamol 500mg

Retail Customer:
  Unit Price: ₹100 (Tier 0)
  Order 5 units → 5 × ₹100 = ₹500

B2B Customer (wholesale):
  Any Order Size:
    Unit Price: ₹80 (Tier 1 - Wholesale)
    Order 10 units → 10 × ₹80 = ₹800
    Order 200 units → 200 × ₹80 = ₹16,000
```

**Key Difference**: B2B customers now get the same wholesale discount regardless of how much they order.

---

## MIGRATION STEPS

### Step 1: Database Migration
```bash
cd backend
npx prisma migrate deploy
```

### Step 2: Verify Changes
```bash
npx prisma db push
```

### Step 3: Testing
- ✅ Test retail customer checkout (should use retail price)
- ✅ Test B2B customer checkout with small qty (should use wholesale price)
- ✅ Test B2B customer checkout with large qty (should still use wholesale price)
- ✅ Vendor UI: add medicine with only retail and wholesale prices

### Step 4: Deployment
- Deploy updated backend
- Deploy updated frontend
- Monitor order prices for accuracy

---

## BACKWARD COMPATIBILITY

⚠️ **Not backward compatible** - the bulk pricing tier no longer exists.

**For existing data**:
- Old `bulkPriceCents` and `bulkMinQty` values will be **dropped by migration**
- Existing orders that used bulk pricing will not be affected (order prices are already calculated)
- **Future orders** will use the simpler 2-tier logic

**If you need to restore bulk pricing later**, you would need to:
1. Create a reverse migration to add the fields back
2. Populate data with default values
3. Update code to handle bulk logic again

---

## BENEFITS OF SIMPLIFICATION

| Aspect | Before | After |
|--------|--------|-------|
| **Pricing Tiers** | 3 (Retail, Standard B2B, Bulk B2B) | 2 (Retail, Wholesale) |
| **Complexity** | High (quantity checks, thresholds) | Low (just buyer type) |
| **UI Fields** | 4 price inputs (retail, wholesale, bulk min qty, bulk price) | 2 price inputs (retail, wholesale) |
| **Database Columns** | 12 (with bulk fields) | 10 (without bulk) |
| **Wholesale Logic** | Conditional on quantity | Always the same rate |
| **B2B Experience** | Variable pricing based on order size | Predictable consistent pricing |

---

## CONFIGURATION FOR VENDORS

**How to set up pricing now**:

1. Open "Product Management" in vendor dashboard
2. Add a new product
3. Set two prices:
   - **Selling Price (Retail)**: What normal customers pay
   - **B2B Standard Price (Wholesale)**: What bulk buyers pay
4. All B2B customers get the wholesale price automatically
5. No need to set quantity thresholds

**Example**:
```
Product: Antibiotic 250mg
  Retail Price: ₹150 per unit
  Wholesale Price: ₹120 per unit
  
Result:
  Customer buys 1 unit → ₹150
  Hospital orders 50 units → 50 × ₹120 = ₹6,000
  Pharmacy orders 500 units → 500 × ₹120 = ₹60,000
  (Same wholesale rate for all B2B)
```

---

## DEPLOYMENT CHECKLIST

- [ ] Review Prisma schema changes
- [ ] Run database migration in dev environment
- [ ] Test vendor adding new medicines with just 2 prices
- [ ] Test retail checkout pricing
- [ ] Test B2B checkout pricing (various quantities)
- [ ] Verify old bulk_related data is properly cleaned up
- [ ] Update vendor documentation
- [ ] Notify vendors of pricing system change
- [ ] Deploy to staging
- [ ] Final QA testing
- [ ] Deploy to production

---

## SUMMARY

✅ **System is now simpler and cleaner**
- 2-tier pricing instead of 3
- No volume thresholds
- Predictable pricing for B2B customers
- Easier for vendors to understand and configure
- Less code to maintain

🎯 **All wholesale customers get the same discount rate regardless of order quantity**

---

*Migration completed: April 28, 2026*
*Status: Ready for testing and deployment*
