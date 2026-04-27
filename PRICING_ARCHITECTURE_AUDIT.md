# Pricing Architecture Audit Report
## Wholesale, Bulk & Buyer Type Analysis

**Generated:** April 27, 2026  
**Scope:** Complete search for wholesale, bulk, bulkPrice, wholesalePrice, bulkMinQty, packageType, buyerType  
**Files Analyzed:** 50+ files across backend, frontend, database, and documentation

---

## Executive Summary

The platform implements a **three-tier pricing system** for medicines:
1. **Retail Price** - Default consumer rate
2. **Wholesale Price** - B2B bulk buyer rate (requires GSTIN)
3. **Bulk Price** - Discounted rate for large orders (minimum quantity threshold)

**Critical Finding:** There are **6 major architectural inconsistencies** that could cause pricing errors and user confusion.

---

## 1. Files Containing Pricing Terms

### Backend Files

#### Core Pricing Logic
- [backend/src/modules/orders/orderPricing.util.js](backend/src/modules/orders/orderPricing.util.js) - **PRIMARY PRICING ENGINE**
  - `resolveOrderItemUnitPriceCents()` - Determines final unit price based on buyer type, quantity, package type
  
- [backend/src/modules/orders/orders.service.js](backend/src/modules/orders/orders.service.js)
  - `normalizePackageType()` - Converts packageType values to 'bulk' or 'standard'
  - `buildPricingSummary()` - Calculates subtotal, tax, delivery, discount
  - `createOrder()` - Order creation with pricing validation

#### Configuration & Onboarding
- [backend/src/modules/onboarding/onboarding.service.js](backend/src/modules/onboarding/onboarding.service.js)
  - `completeCustomerOnboarding()` - Validates buyerType (RETAIL/WHOLESALE)
  - WHOLESALE buyers must provide business name + GSTIN

- [backend/src/modules/inventory/inventory.service.js](backend/src/modules/inventory/inventory.service.js)
  - Validates `wholesalePriceCents`, `bulkPriceCents`, `bulkMinQty` on medicine create/update
  - Handles inventory stock + pricing fields

#### Database Schema
- [backend/prisma/schema.prisma](backend/prisma/schema.prisma)
  - **Medicine model:** priceCents, wholesalePriceCents, bulkMinQty, bulkPriceCents
  - **Customer model:** buyerType (RETAIL/WHOLESALE)
  - **Inventory model:** bulkMinQty (DEFAULT 100), bulkDiscountPercent (DEFAULT 10, **UNUSED**)

- [backend/initial.sql](backend/initial.sql) - Legacy SQL schema with same fields

#### Testing
- [backend/scripts/test-order-pricing.js](backend/scripts/test-order-pricing.js) - Tests pricing logic with sample data

### Frontend Files

#### Cart & Pricing State
- [frontend/src/context/CartContext.jsx](frontend/src/context/CartContext.jsx)
  - `normalizePackageType()` - Normalizes 'bulk'/'standard' values
  - `mapServerCartItem()` - Maps API items to cart state (includes bulkMinQty, packageType, buyerType)
  - Repricing logic on quantity/packageType changes

- [frontend/src/services/pricing.service.js](frontend/src/services/pricing.service.js)
  - `resolveUnitPrice()` - Frontend pricing engine (mirrors backend)
  - `mapMedicinePricing()` - Maps medicine fields to standardized pricing object
  - `repriceCartItem()` - Recalculates item price when parameters change

#### Vendor UI (Medicine Management)
- [frontend/src/pages/vendor/MedicineManager.jsx](frontend/src/pages/vendor/MedicineManager.jsx)
  - **UI Fields:** Wholesale Price, Bulk Min Qty, Bulk Price (per-medicine)
  - Shows pricing tiers: "Wholesale {price} • Bulk {qty}+ @ {price}"
  - Validates bulk price ≤ wholesale price

#### Customer UI (Checkout)
- [frontend/src/pages/customer/Checkout.jsx](frontend/src/pages/customer/Checkout.jsx)
  - `validateForm()` - Checks if bulk items meet minimum quantity
  - Validates packageType ('bulk'/'standard')
  - Uses `selectedSize` or `packageType` interchangeably

- [frontend/src/pages/customer/Payment.jsx](frontend/src/pages/customer/Payment.jsx) *(current file)*
  - `calculateTax()` - Applies 5% tax on subtotal
  - Final payment processing

### Documentation Files

- [README.md](README.md) - Describes BuyerType enum: RETAIL, WHOLESALE
- [ARCHITECTURE.md](ARCHITECTURE.md) - ER diagram with BuyerType enum
- [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) - Onboarding flow with buyer type
- [FEATURES_AND_ROADMAP.md](FEATURES_AND_ROADMAP.md) - Mentions wholesale platform, bulk ordering system
- [AUDIT_REPORT.md](AUDIT_REPORT.md) - References buyer type and package type handling
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API field descriptions

---

## 2. How Each Term Is Used

### 2.1 `wholesale` (General Concept)

| Context | Usage | Location |
|---------|-------|----------|
| Enum Value | BuyerType enum | [ARCHITECTURE.md#L283](ARCHITECTURE.md#L283) |
| Validation | 'RETAIL' \| 'WHOLESALE' | [onboarding.service.js#L145](backend/src/modules/onboarding/onboarding.service.js#L145) |
| UI Label | "Wholesale Price" field | [MedicineManager.jsx#L383](frontend/src/pages/vendor/MedicineManager.jsx#L383) |
| Documentation | B2B buyer type category | [README.md#L17](README.md#L17) |

### 2.2 `wholesalePrice` (Field Name)

| Context | Purpose | Fallback Behavior |
|---------|---------|-------------------|
| Medicine table | Per-medicine wholesale unit price | Falls back to `priceCents` if not set |
| Pricing logic | Applied when buyer is WHOLESALE | Used unless qty ≥ bulkMinQty |
| Cart context | Stored in cart item | Can be undefined |
| Frontend service | Mapped in pricing.service | Falls back to retailPrice |

**Schema References:**
- [schema.prisma#L116](backend/prisma/schema.prisma#L116) - `wholesalePriceCents Int?` (nullable)
- [inventory.service.js#L305-306](backend/src/modules/inventory/inventory.service.js#L305-L306) - Parameter validation
- [CartContext.jsx#L38](frontend/src/context/CartContext.jsx#L38) - Maps `wholesalePrice`

### 2.3 `bulkPrice` (Field Name)

| Context | Purpose | Fallback Behavior |
|---------|---------|-------------------|
| Medicine table | Lowest tier price for large orders | Falls back to `wholesalePriceCents` |
| Pricing logic | Applied when qty ≥ bulkMinQty AND WHOLESALE buyer | Cascading fallback chain |
| Cart UI | Shows as "Bulk {qty}+ @ {price}" | Only shown if bulkMinQty set |
| Payment | Applied to order total | Via resolveOrderItemUnitPriceCents() |

**Schema References:**
- [schema.prisma#L117](backend/prisma/schema.prisma#L117) - `bulkPriceCents Int?` (nullable)
- [inventory.service.js#L323-325](backend/src/modules/inventory/inventory.service.js#L323-L325) - Complex fallback logic
- [MedicineManager.jsx#L484](frontend/src/pages/vendor/MedicineManager.jsx#L484) - UI label

### 2.4 `bulkMinQty` (Minimum Quantity Threshold)

**Dual Location Problem:**

| Location | Default | Purpose | Issue |
|----------|---------|---------|-------|
| Medicine | Nullable | Per-medicine config | Optional, may not be set |
| Inventory | 100 | Per-vendor-per-medicine config | Always has value |
| Cart | Runtime | Determines if bulk pricing applies | Mixed sources |

**Usage:**
- [schema.prisma#L116](backend/prisma/schema.prisma#L116) - Medicine.bulkMinQty nullable
- [schema.prisma#L155](backend/prisma/schema.prisma#L155) - Inventory.bulkMinQty DEFAULT 100
- [CartContext.jsx#L41](frontend/src/context/CartContext.jsx#L41) - `Number(item.bulkMinQty || item.medicine?.bulkMinQty || 1)`
- [Checkout.jsx#L170](frontend/src/pages/customer/Checkout.jsx#L170) - Validation logic
- [orderPricing.util.js#L7](backend/src/modules/orders/orderPricing.util.js#L7) - `medicine.bulkMinQty || 1`

### 2.5 `packageType` (Order Configuration)

| Field Name | Source | Values | Purpose |
|------------|--------|--------|---------|
| `packageType` | Cart item | 'standard' \| 'bulk' | Explicit bulk order flag |
| `selectedSize` | Alternative | 'standard' \| 'bulk' | Same meaning (UI naming) |
| Normalization | Frontend | Lowercase comparison | Consistent 'bulk' vs others |

**Logic:**
```javascript
// Frontend normalizes both names to same field
const packageType = String(item.selectedSize || item.packageType || 'standard').toLowerCase();
// Only 'bulk' has special meaning, everything else is 'standard'
return packageType === 'bulk' ? 'bulk' : 'standard';
```

**Files:**
- [CartContext.jsx#L63](frontend/src/context/CartContext.jsx#L63) - normalization function
- [orders.service.js#L6](backend/src/modules/orders/orders.service.js#L6) - backend normalization
- [pricing.service.js#L8-10](frontend/src/services/pricing.service.js#L8-10) - same logic

### 2.6 `buyerType` (Customer Classification)

| Aspect | RETAIL | WHOLESALE |
|--------|--------|-----------|
| Price Tier | Retail only | Wholesale + Bulk available |
| Bulk Access | ❌ Forbidden | ✅ Allowed |
| GSTIN | Optional | **Required** |
| Business Name | Optional | **Required** |
| Validation | [onboarding.service.js#L156-157](backend/src/modules/onboarding/onboarding.service.js#L156-L157) | Same + GSTIN check |

**Schema:** [schema.prisma#L94](backend/prisma/schema.prisma#L94) - `buyerType BuyerType`

---

## 3. Conflicting Logic & Inconsistencies

### ⚠️ CRITICAL ISSUE #1: Dual bulkMinQty Source
**Problem:** Two different places define the bulk minimum quantity threshold with no sync mechanism.

```
Medicine.bulkMinQty (nullable)
         ↓ (optional per-medicine setting)
         
Inventory.bulkMinQty (DEFAULT 100)
         ↓ (forced per-vendor-per-medicine)
         
Frontend uses: item.bulkMinQty || item.medicine?.bulkMinQty || 1
```

**Risk:**
- Medicine.bulkMinQty = 5, Inventory.bulkMinQty = 100 → Which applies?
- Vendor creates medicine with qty=50, then later default=100 takes over?
- No API clearly states which field is authoritative

**Files Affected:**
- [schema.prisma#L116, #L155](backend/prisma/schema.prisma)
- [inventory.service.js#L321](backend/src/modules/inventory/inventory.service.js#L321)
- [CartContext.jsx#L41](frontend/src/context/CartContext.jsx#L41)
- [orderPricing.util.js#L7](backend/src/modules/orders/orderPricing.util.js#L7)

**Recommendation:** Pick ONE source of truth. Suggest `Medicine.bulkMinQty` is the config, `Inventory.bulkMinQty` is a cache that syncs on medicine update.

---

### ⚠️ CRITICAL ISSUE #2: bulkDiscountPercent is Dead Code
**Problem:** Field exists but is **never used** in any pricing calculation.

```
Inventory.bulkDiscountPercent DEFAULT 10
         ↓ (10% discount)
         
[NOT USED ANYWHERE]
         ↓
Actual bulk pricing must be manually set in Medicine.bulkPriceCents
```

**Files:**
- [schema.prisma#L156](backend/prisma/schema.prisma#L156) - Defined here
- **NEVER REFERENCED** in backend code
- **NEVER REFERENCED** in frontend code

**Observation:** Appears to be incomplete feature. Was there intent to auto-calculate bulk price as `wholesalePrice * (100 - bulkDiscountPercent) / 100`?

---

### ⚠️ CRITICAL ISSUE #3: Inventory vs Medicine Pricing Mismatch
**Problem:** Pricing fields duplicated between two tables with no sync strategy.

**Medicine Table (Base Pricing):**
```
- priceCents (retail)
- wholesalePriceCents (wholesale)
- bulkMinQty (threshold)
- bulkPriceCents (bulk)
```

**Inventory Table (Vendor Pricing Override?):**
```
- bulkMinQty (DEFAULT 100, conflicts with Medicine)
- bulkDiscountPercent (UNUSED)
- (no wholesalePrice, no bulkPrice override)
```

**Question:** Can vendor override bulk settings per inventory record, or is Medicine authoritative?

**Current Code Behavior:**
- [inventory.service.js#L362-364](backend/src/modules/inventory/inventory.service.js#L362-L364) updates Medicine fields
- No per-inventory pricing override logic
- Inventory.bulkMinQty is just a default for new medicines

---

### ⚠️ ISSUE #4: Confusing UI Naming - selectedSize vs packageType
**Problem:** Same logical concept has two field names causing mapping confusion.

```javascript
// Frontend stores cart item as:
{
  selectedSize: 'bulk',      // What was selected in UI
  packageType: 'bulk',       // Logical field name
}

// Both expected to have same value but not always synced:
const packageType = String(item.selectedSize || item.packageType || 'standard').toLowerCase();
```

**Files Affected:**
- [CartContext.jsx#L43, #L85-88](frontend/src/context/CartContext.jsx) - Both stored
- [Checkout.jsx#L169](frontend/src/pages/customer/Checkout.jsx#L169) - Handles both
- No validation that they match

**Recommendation:** Use single field `packageType` internally, `selectedSize` only as UI state variable.

---

### ⚠️ ISSUE #5: bulkDiscountPercent Never Synced to Medicine
**Problem:** When inventory bulk discount % is set, no mechanism to calculate/sync bulkPriceCents.

```
Vendor sets Inventory.bulkDiscountPercent = 15
         ↓
Should this auto-calculate Medicine.bulkPriceCents?
         ↓
Currently: NO - vendor must manually enter bulkPriceCents
```

**Example:** If wholesale price is 500 and bulk discount is 15%, bulk price should be 425.

**Current Behavior:**
- Vendor must manually enter each value
- If they enter bulkDiscountPercent but forget bulkPriceCents, system falls back to wholesalePrice
- No warning that discount % is ignored

---

### ⚠️ ISSUE #6: Fallback Chain is Implicit & Not Validated
**Problem:** Price fallback logic is buried in code, not explicit in schema or API.

```javascript
// From orderPricing.util.js:
const retailPriceCents = medicine.priceCents;
const wholesalePriceCents = medicine.wholesalePriceCents ?? retailPriceCents;
const bulkPriceCents = medicine.bulkPriceCents ?? wholesalePriceCents;

// Fallback chain: Bulk → Wholesale → Retail
// But if all are defined: no validation that Retail ≥ Wholesale ≥ Bulk
```

**Risk:**
- Vendor sets Retail=100, Wholesale=200, Bulk=150 (illogical)
- System accepts it silently
- Bulk buyers pay more than wholesale buyers

**Files:**
- [orderPricing.util.js#L4-7](backend/src/modules/orders/orderPricing.util.js#L4-L7) - Fallback logic
- [inventory.service.js#L317-325](backend/src/modules/inventory/inventory.service.js#L317-L325) - Only validates > 0
- [MedicineManager.jsx#L106](frontend/src/pages/vendor/MedicineManager.jsx#L106) - Single validation `bulkPrice ≤ wholesalePrice`

---

### ⚠️ ISSUE #7: VendorType vs BuyerType - Redundant Classification
**Problem:** Vendors have 4 types (PHARMACY, DISTRIBUTOR, MANUFACTURER, WHOLESALER) but no special pricing based on type.

```
VendorType: PHARMACY, DISTRIBUTOR, MANUFACTURER, WHOLESALER
BuyerType: RETAIL, WHOLESALE

Pricing logic: Only checks buyerType, ignores vendorType completely
```

**Observation:** Either:
1. VendorType is unused and should be removed, OR
2. Pricing should vary by vendor type (e.g., WHOLESALER sells at bulk prices to WHOLESALE buyers)

**Current State:** Never used in pricing calculations ([search for vendorType in pricing logic](./backend/src/modules/orders/orderPricing.util.js) = 0 results)

---

## 4. Pricing Logic Architecture

### Backend Pricing Engine: `resolveOrderItemUnitPriceCents()`

**Location:** [backend/src/modules/orders/orderPricing.util.js](backend/src/modules/orders/orderPricing.util.js)

```javascript
resolveOrderItemUnitPriceCents({ medicine, buyerType, quantity, packageType }) {
  // Price tiers from medicine
  retail = medicine.priceCents
  wholesale = medicine.wholesalePriceCents ?? retail
  bulk = medicine.bulkPriceCents ?? wholesale
  minQty = medicine.bulkMinQty || 1
  
  isBulk = packageType === 'bulk'
  
  // Validate: Bulk only for wholesale
  if (isBulk && buyerType !== 'WHOLESALE') throw error
  if (isBulk && quantity < minQty) throw error
  
  // Resolve price
  if (isBulk) return bulk
  if (buyerType === 'WHOLESALE' && quantity >= minQty) return bulk
  if (buyerType === 'WHOLESALE') return wholesale
  return retail
}
```

**Price Tiers Applied:**
1. **RETAIL buyer:**
   - Always gets `retail` price
   - Cannot use packageType='bulk'
   
2. **WHOLESALE buyer (standard package):**
   - If quantity ≥ minQty → bulk price (auto-applied)
   - If quantity < minQty → wholesale price
   
3. **WHOLESALE buyer (bulk package):**
   - Explicitly ordered as bulk
   - REQUIRES quantity ≥ minQty
   - Gets bulk price

### Frontend Pricing Service: `resolveUnitPrice()`

**Location:** [frontend/src/services/pricing.service.js](frontend/src/services/pricing.service.js)

Same logic as backend:
```javascript
resolveUnitPrice({
  buyerType = 'RETAIL',
  quantity = 1,
  packageType = 'standard',
  retailPrice = 0,
  wholesalePrice = retailPrice,
  bulkPrice = wholesalePrice,
  bulkMinQty = 1
}) {
  // Normalizes inputs, applies same logic as backend
}
```

### Pricing Flow Diagram

```
Order Creation (Frontend)
    ↓
Cart Item: { medicineId, quantity, selectedSize, buyerType }
    ↓
Checkout.jsx validateForm()
    ↓
if (packageType === 'bulk' && quantity < bulkMinQty) → ERROR
    ↓
orderService.createCustomerOrder({ items, ... })
    ↓
Backend orders.service.createOrder()
    ↓
For each item: resolveOrderItemUnitPriceCents({
    medicine,
    buyerType: customer.buyerType,
    quantity: item.quantity,
    packageType: normalizePackageType(item.selectedSize)
})
    ↓
unitPriceCents → subtotalCents
    ↓
buildPricingSummary({ subtotalCents, discountPercent, deliveryType })
    ↓
Calculate tax (5%), deliveryCharge (express=9, standard=0)
    ↓
Order created with totalCents
```

---

## 5. Data Flow Analysis

### When Adding Medicine to Inventory

**Frontend (MedicineManager.jsx):**
```
1. User enters:
   - Retail Price ✓
   - Wholesale Price ✓
   - Bulk Min Qty ✓
   - Bulk Price ✓

2. Frontend validation:
   - bulkPrice ≤ wholesalePrice ✓
   - All are positive ✓

3. API call: POST /medicines/inventory
   {
     medicineId (or name),
     priceCents (retail),
     wholesalePriceCents,
     bulkMinQty,
     bulkPriceCents,
     quantity
   }
```

**Backend (inventory.service.js):**
```
1. Validate inputs:
   - wholesalePriceCents > 0
   - bulkPriceCents > 0
   - bulkMinQty >= 1

2. Upsert Medicine (if new):
   - Create with all price fields

3. Upsert Inventory:
   - quantity: increment
   - Inventory.bulkMinQty: set to DEFAULT 100 (⚠️ CONFLICT!)
   - Inventory.bulkDiscountPercent: set to DEFAULT 10
```

**⚠️ Problem:** Medicine.bulkMinQty and Inventory.bulkMinQty now differ!

### When Customer Orders

**Frontend (Checkout.jsx):**
```
1. CartItems populated from cart context
2. Validate each item:
   if (packageType === 'bulk' && quantity < item.bulkMinQty) → ERROR

3. Create order with checkoutSnapshot
```

**Backend (orders.service.js):**
```
1. Customer.buyerType = 'WHOLESALE' or 'RETAIL'
2. For each item:
   - Get Medicine by ID
   - Call resolveOrderItemUnitPriceCents({
       medicine,
       buyerType,
       quantity,
       packageType
     })
   - unitPriceCents = result
   - lineCents = unitPriceCents * quantity

3. subtotalCents = SUM(lineCents)
4. buildPricingSummary(subtotalCents, discountPercent, deliveryType)
```

---

## 6. Current Test Coverage

### test-order-pricing.js

**Location:** [backend/scripts/test-order-pricing.js](backend/scripts/test-order-pricing.js)

**Test Cases:**
1. ✅ RETAIL buyer always gets retail price
2. ✅ WHOLESALE buyer below bulk threshold gets wholesale price
3. ✅ WHOLESALE buyer at bulk threshold gets bulk price
4. ❌ Bulk package below threshold throws error

**Coverage Gaps:**
- No test for auto-upgrade (wholesale standard → bulk when qty ≥ minQty)
- No test for fallback chain (what if wholesalePrice not set?)
- No test for inventory sync issues
- No test for conflicting bulkMinQty values

---

## 7. Summary: Inconsistencies Table

| # | Issue | Severity | Scope | Fix Complexity |
|---|-------|----------|-------|-----------------|
| 1 | Dual bulkMinQty source (Medicine vs Inventory) | CRITICAL | Database | High - Requires migration |
| 2 | bulkDiscountPercent unused | CRITICAL | Missing feature | Medium - Remove or implement |
| 3 | Pricing fields in Inventory never override Medicine | CRITICAL | Architecture | High - Redesign |
| 4 | selectedSize vs packageType naming | MEDIUM | Frontend | Low - Refactor variable names |
| 5 | No price tier validation (Retail ≥ Wholesale ≥ Bulk) | MEDIUM | Validation | Low - Add constraints |
| 6 | VendorType ignored in pricing | MEDIUM | Logic | Medium - Define behavior or remove |
| 7 | Implicit fallback chain not documented | LOW | Documentation | Low - Add comments |

---

## 8. Recommendations (Priority Order)

### Phase 1: Data Consistency (URGENT)
1. **Pick bulkMinQty source of truth**
   - Option A: Medicine.bulkMinQty is config, Inventory.bulkMinQty is cache (recommend)
   - Option B: Inventory.bulkMinQty is config, Medicine field removed
   - Add migration to sync/clean data

2. **Remove or implement bulkDiscountPercent**
   - Option A: Remove from schema
   - Option B: Auto-calculate bulkPrice when setting discount %
   - Add migration to clean data

### Phase 2: Validation Tiers (HIGH)
1. Add price tier validation: `retail ≥ wholesale ≥ bulk`
2. Add backend validation (currently only frontend checks)
3. Document fallback chain in API schema

### Phase 3: Naming & Clarity (MEDIUM)
1. Unify `selectedSize` and `packageType` to single name
2. Add explicit bulkMinQty field to Cart API response
3. Document which field is used for pricing (hint: Medicine fields only)

### Phase 4: Feature Completion (MEDIUM)
1. Clarify VendorType role: should it affect pricing?
2. Consider vendor inventory pricing overrides if needed
3. Add tests for all edge cases

---

## 9. API Contract Changes Needed

### GET /medicines/:id - Add Clarity
```javascript
{
  id: "...",
  name: "Aspirin",
  
  // Pricing tiers (all in cents)
  priceCents: 1000,           // Retail
  wholesalePriceCents: 800,   // Wholesale
  bulkPriceCents: 600,        // Bulk
  
  // Bulk threshold (SOURCE OF TRUTH HERE)
  bulkMinQty: 50,             // Explicit bulk minimum
  
  // Note: Inventory.bulkMinQty DEFAULT 100 is IGNORED
  // Note: bulkDiscountPercent is IGNORED, use bulkPriceCents directly
}
```

### POST /medicines/inventory - Clarify Intent
```javascript
{
  medicineId: "...",
  quantity: 100,
  
  // Price overrides (update on Medicine, not Inventory)
  priceCents: 1000,
  wholesalePriceCents: 800,
  bulkPriceCents: 600,
  
  // ⚠️ Do NOT include in request:
  // - bulkMinQty (use from Medicine)
  // - bulkDiscountPercent (unused, deprecated)
}
```

---

## Appendix: Complete File Index

### Database & Schema
- [backend/prisma/schema.prisma](backend/prisma/schema.prisma#L94-L156) - Medicine, Customer, Inventory models
- [backend/initial.sql](backend/initial.sql#L144-L178) - Legacy schema

### Backend Services
- [backend/src/modules/orders/orderPricing.util.js](backend/src/modules/orders/orderPricing.util.js) - **PRIMARY**
- [backend/src/modules/orders/orders.service.js](backend/src/modules/orders/orders.service.js#L1-150) - Order creation
- [backend/src/modules/inventory/inventory.service.js](backend/src/modules/inventory/inventory.service.js#L300-400) - Medicine pricing setup
- [backend/src/modules/onboarding/onboarding.service.js](backend/src/modules/onboarding/onboarding.service.js#L140-170) - BuyerType validation

### Frontend Services
- [frontend/src/services/pricing.service.js](frontend/src/services/pricing.service.js) - **MIRRORS BACKEND**
- [frontend/src/context/CartContext.jsx](frontend/src/context/CartContext.jsx#L30-100) - Cart state management

### Frontend UI
- [frontend/src/pages/vendor/MedicineManager.jsx](frontend/src/pages/vendor/MedicineManager.jsx#L35-484) - Pricing form
- [frontend/src/pages/customer/Checkout.jsx](frontend/src/pages/customer/Checkout.jsx#L160-180) - Validation
- [frontend/src/pages/customer/Payment.jsx](frontend/src/pages/customer/Payment.jsx#L150-300) - Final calculation

### Documentation
- [README.md](README.md#L15-300) - Overview
- [ARCHITECTURE.md](ARCHITECTURE.md#L280-320) - ER diagram
- [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md#L75-110) - Onboarding
- [FEATURES_AND_ROADMAP.md](FEATURES_AND_ROADMAP.md#L380-400) - B2B features

### Testing
- [backend/scripts/test-order-pricing.js](backend/scripts/test-order-pricing.js) - Unit tests

---

**Report Complete**
