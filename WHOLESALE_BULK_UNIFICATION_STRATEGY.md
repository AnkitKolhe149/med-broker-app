# WHOLESALE/BULK PRICING UNIFICATION STRATEGY
## Resolving System Confusion - April 27, 2026

---

## THE PROBLEM

The system treats **wholesale** and **bulk** as separate concepts when they're actually the **same pricing tier**:

```
Current (Confusing):
- Medicine has: priceCents (retail), wholesalePriceCents, bulkPriceCents
- Customer has: buyerType = RETAIL | WHOLESALE
- Cart has: packageType = standard | bulk
- Inventory has: bulkMinQty AND Medicine also has bulkMinQty (duplicated)
- Unused field: bulkDiscountPercent (in schema but never used)

Result: 
→ Vendor UI shows "Wholesale Price" + "Bulk Price" as separate fields
→ Customer doesn't understand they're the same tier with a quantity threshold
→ Fields duplicated across Medicine and Inventory
→ Price fallback chain unclear: Bulk→Wholesale→Retail
```

---

## THE SOLUTION

**Unified Pricing Tier Architecture:**

Instead of separate "wholesale" and "bulk" prices, use ONE pricing tier system:

```
RETAIL Price (tier 0)
    ↓ (for WHOLESALE buyers)
WHOLESALE Price (tier 1)
    ↓ (at/above minimum quantity)
BULK Price (tier 2 - same tier, higher volume discount)
```

**Key Points:**
- Wholesale = B2B buyer category (requires GSTIN)
- Bulk = Order volume threshold within wholesale tier
- A WHOLESALE buyer buying 5 units gets "Wholesale Price"
- The SAME buyer buying 100+ units gets "Bulk Price" (deeper discount)
- **They are the same tier—bulk is just the high-volume version**

---

## CHANGES REQUIRED (NO SCHEMA MIGRATION NEEDED)

### 1. Remove Field Duplication
**Current:** `bulkMinQty` in BOTH Medicine and Inventory  
**New:** Keep only in **Medicine** (source of truth)  

**File**: `backend/prisma/schema.prisma`
```prisma
// Remove bulkMinQty from Inventory model
// Keep it in Medicine model only:
model Medicine {
  id                    String   @id @default(uuid())
  ...
  priceCents            Int
  wholesalePriceCents   Int?      // For WHOLESALE buyers below bulkMinQty
  bulkPriceCents        Int?      // For WHOLESALE buyers at/above bulkMinQty
  bulkMinQty            Int       @default(100)  // ← Single source of truth
  ...
}

// Inventory will inherit bulkMinQty from its linked Medicine
model Inventory {
  id                    String   @id @default(uuid())
  medicineId            String   // Foreign key to Medicine
  ...
  // Remove: bulkMinQty  ← DELETE THIS
  // Remove: bulkDiscountPercent  ← DELETE THIS (unused)
}
```

### 2. Clarify Field Naming in Code
**Current:** Generic "wholesale" and "bulk" names  
**New:** Tier-based naming

```javascript
// backend/src/modules/orders/orderPricing.util.js
// Current naming:
const bulkPriceCents = medicine.bulkPriceCents;
const wholesalePriceCents = medicine.wholesalePriceCents;

// New naming (clearer intent):
const bulkThresholdQty = medicine.bulkMinQty || 1;
const b2bRetailPrice = medicine.wholesalePriceCents; // Standard B2B price
const b2bBulkPrice = medicine.bulkPriceCents; // Discounted B2B bulk price
```

### 3. Update Comment Documentation
Add clear comments explaining the tier structure:

```javascript
/**
 * PRICING TIER SYSTEM (3 tiers):
 * 
 * TIER 0 - RETAIL: For consumer buyers (buyerType = RETAIL)
 *   Price = medicine.priceCents
 * 
 * TIER 1 - B2B STANDARD: For B2B buyers (buyerType = WHOLESALE) 
 *   below bulk quantity threshold
 *   Price = medicine.wholesalePriceCents
 *   Requires: GSTIN verification
 * 
 * TIER 2 - B2B BULK: For B2B buyers (buyerType = WHOLESALE)
 *   at or above minimum quantity threshold
 *   Price = medicine.bulkPriceCents (deeper discount)
 *   Threshold = medicine.bulkMinQty
 * 
 * Price Fallback Chain:
 * - If bulkPriceCents not set → use wholesalePriceCents
 * - If wholesalePriceCents not set → use priceCents (fallback to retail)
 */
```

### 4. Fix Inventory Service (Remove Duplicate Logic)
**File**: `backend/src/modules/inventory/inventory.service.js`

```javascript
// BEFORE:
const validate = (data) => {
  if (data.bulkMinQty && data.bulkMinQty < 1) {
    throw new ValidationError('bulkMinQty must be ≥ 1');
  }
  if (data.bulkMinQty && data.bulkMinQty < 1) {
    throw new ValidationError('bulkMinQty must be ≥ 1');  // DUPLICATED
  }
};

// AFTER:
const validate = (data, medicine) => {
  // Validate prices are logical: Retail ≥ B2B Standard ≥ B2B Bulk
  if (data.wholesalePriceCents && data.wholesalePriceCents > data.priceCents) {
    throw new ValidationError('B2B standard price cannot exceed retail price');
  }
  if (data.bulkPriceCents && data.bulkPriceCents > (data.wholesalePriceCents || data.priceCents)) {
    throw new ValidationError('B2B bulk price cannot exceed B2B standard price');
  }
  // Note: bulkMinQty comes from Medicine, not Inventory
};
```

### 5. Update Vendor UI Labels (MedicineManager.jsx)
**Current Labels:**
```
[Wholesale Price] [Bulk Min Qty] [Bulk Price]
```

**New Labels:**
```
[Retail Price] 
  ↓ (For B2B Buyers)
[B2B Standard Price] [Minimum Bulk Qty] [B2B Bulk Price]
  
OR more concise:
[Retail Price] [B2B Price] [Bulk Qty] [Bulk Discount Price]

OR even clearer:
Pricing Tiers:
  • Consumer (Retail): ₹XXX
  • B2B Standard: ₹YYY (when qty < Z)
  • B2B Bulk: ₹ZZZ (when qty ≥ Z)
```

### 6. Update Cart/Checkout UI Labels
**Current:** "packageType: bulk" (ambiguous)  
**New:** Clear messaging

```javascript
// In Checkout.jsx, when displaying pricing tier:
if (item.buyerType === 'RETAIL') {
  tierLabel = '💰 Retail Price';
} else if (item.quantity < item.bulkMinQty) {
  tierLabel = '🏢 B2B Standard Price';
} else {
  tierLabel = '📦 B2B Bulk Price';
}
```

---

## IMPLEMENTATION PLAN (No DB Migration Needed)

### Phase 1: Code Documentation (0.5 hours)
- [ ] Add comprehensive comments to `orderPricing.util.js`
- [ ] Update comments in `pricing.service.js` (frontend)
- [ ] Add pricing tier diagram to README.md

### Phase 2: Code Clarity (1 hour)
- [ ] Rename internal variables for clarity (bulkThresholdQty, b2bRetailPrice, etc.)
- [ ] Update comments in inventory validation
- [ ] Verify price fallback logic is correct

### Phase 3: UI/UX Improvements (2 hours)
- [ ] Update MedicineManager.jsx labels and descriptions
- [ ] Update Checkout.jsx pricing tier display
- [ ] Add tooltips explaining what each tier is for

### Phase 4: Validation Rules (1 hour)
- [ ] Add price ordering validation (Retail ≥ B2B ≥ Bulk)
- [ ] Update onboarding validation messages
- [ ] Add tests for pricing tier validation

### Phase 5: Documentation (1 hour)
- [ ] Update README.md with pricing tier explanation
- [ ] Add developer guide section on pricing
- [ ] Document why these decisions were made

**Total Time: 5.5 hours**  
**Risk Level: LOW** (No schema changes, no breaking changes, backward compatible)

---

## DETAILED FIELD CHANGES

### backend/prisma/schema.prisma
```prisma
model Medicine {
  // KEEP THESE:
  priceCents            Int              // Tier 0: Retail
  wholesalePriceCents   Int?             // Tier 1: B2B Standard
  bulkPriceCents        Int?             // Tier 2: B2B Bulk (high volume)
  bulkMinQty            Int @default(100) // Threshold qty for Tier 2

  // UPDATE COMMENTS:
  /// Retail price in paise (for all buyers)
  
  /// B2B wholesale price in paise (requires GSTIN, below bulkMinQty)
  
  /// B2B bulk price in paise (requires GSTIN, at/above bulkMinQty)
  
  /// Minimum quantity to qualify for bulkPrice (cheaper tier)
}

model Inventory {
  // REMOVE:
  // bulkMinQty  ← DELETE (use medicine.bulkMinQty instead)
  // bulkDiscountPercent  ← DELETE (unused, use explicit bulkPriceCents)
}
```

---

## PRICING LOGIC VERIFICATION

### Current Fallback Chain (Already Correct)
```javascript
resolveOrderItemUnitPriceCents = ({ medicine, buyerType, quantity, packageType }) => {
  const retailPrice = medicine.priceCents;
  const b2bStandardPrice = medicine.wholesalePriceCents ?? retailPrice;
  const b2bBulkPrice = medicine.bulkPriceCents ?? b2bStandardPrice;
  const bulkThreshold = medicine.bulkMinQty || 1;

  // For retail customers: always use retail price
  if (normalizedBuyerType !== 'WHOLESALE') {
    return retailPrice;
  }

  // For B2B customers: decide between standard and bulk
  if (quantity >= bulkThreshold) {
    return b2bBulkPrice; // ← Higher volume discount
  }

  return b2bStandardPrice; // ← Standard B2B price
};
```

✅ This logic is CORRECT. The issue is just naming/messaging confusion.

---

## FAQ

**Q: Why keep both wholesalePriceCents and bulkPriceCents?**  
A: Because a B2B buyer might buy 5 units (gets wholesalePriceCents) or 100 units (gets bulkPriceCents, deeper discount). They're the same buyer type but different purchase volumes.

**Q: What if a vendor doesn't set bulkPriceCents?**  
A: System falls back to wholesalePriceCents, then to retail price. No issue.

**Q: Can retail customers use bulk/wholesale pricing?**  
A: No—buyerType determines tier. A RETAIL buyer always pays retail price, regardless of quantity ordered.

**Q: How does this affect existing orders?**  
A: No impact—this is just internal naming/organization clarification.

**Q: Do we need to migrate data?**  
A: No—the schema stays the same, we're just clarifying what the fields mean.

---

## TESTING CHECKLIST

After implementing these changes:

- [ ] Test order creation with RETAIL buyer → uses retail price
- [ ] Test order creation with WHOLESALE buyer, qty < bulkMinQty → uses wholesalePriceCents
- [ ] Test order creation with WHOLESALE buyer, qty ≥ bulkMinQty → uses bulkPriceCents
- [ ] Test price fallback chain (if bulkPriceCents not set)
- [ ] Test vendor can set all three prices independently
- [ ] Test price validation (Retail ≥ B2B Standard ≥ B2B Bulk)
- [ ] Test cart repricing when quantity crosses bulk threshold
- [ ] Test invoice displays correct pricing tier
- [ ] Test UI shows correct labels for each tier

---

## SUMMARY OF CONFUSION RESOLVED

| Confusion | Resolution |
|-----------|-----------|
| "Wholesale and bulk are separate" | They're the same tier—bulk is high-volume wholesale |
| "Why two prices for B2B?" | Standard price (small order) + Bulk price (large order) |
| "bulkMinQty in two places" | Remove from Inventory, keep in Medicine only |
| "What's bulkDiscountPercent?" | Unused field—delete it, use explicit bulkPriceCents |
| "selectedSize vs packageType" | Same concept, keep packageType (more semantic) |
| "Why does retail customer see bulk logic?" | They don't—buyerType RETAIL always uses retail price |
| "Price fallback logic unclear" | Document: Bulk→Wholesale→Retail with examples |

---

## NEXT STEPS

1. **Review & Approve** this strategy
2. **Implement Phase 1-2** (documentation + code clarity)
3. **Test Phase 3-4** (UI + validation)
4. **Document Phase 5** (update README)
5. **Deploy & Monitor** (no risk, backward compatible)

**Timeline: 1 sprint** (can be parallelized)

---

*Created: April 27, 2026*  
*Status: Ready for Implementation*  
