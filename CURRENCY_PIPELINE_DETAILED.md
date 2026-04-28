# Currency Conversion Pipeline Diagram

## Complete Data Flow with Bug Locations

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER JOURNEY                                  │
└─────────────────────────────────────────────────────────────────────┘

┌─── 1. AUTHENTICATION & CURRENCY DETECTION ──────────────────────────┐
│                                                                       │
│  User Logs In                                                         │
│    ↓                                                                  │
│  localStorage('user') loaded                                          │
│    ↓                                                                  │
│  CurrencyContext checks:                                              │
│    1. user.preferredCurrency?                                         │
│    2. getCurrencyForCountry(user.customer.country)?  🐛 BUG #6      │
│    3. localStorage preferredCurrency?                                 │
│    4. default to 'INR'                                                │
│    ↓                                                                  │
│  🚩 BUG #5: exchangeRates = null at this point                       │
│    ↓                                                                  │
│  fetchExchangeRates() called                                          │
│    ↓                                                                  │
│  Backend: /api/exchange-rates/latest?base=INR                        │
│    ↓                                                                  │
│  ✅ Cached with 6-hour TTL                                           │
│  🚩 BUG #11: No sanity check on rates                                │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘

┌─── 2. CATALOG PAGE (Product Listing) ──────────────────────────────┐
│                                                                       │
│  Backend returns: item.priceCents (in INR)                           │
│    ↓                                                                  │
│  Frontend Cart adds item with:                                        │
│    - basePrice: priceCents / 100 = 2500 (as INR)                     │
│    - currencyCode: ??? (usually defaults to 'INR')                   │
│  🐛 BUG #2: No validation that this is actually INR                  │
│    ↓                                                                  │
│  Display price: convertPrice(2500, 'INR', currency, rates)           │
│    If user in Canada: 2500 INR = ~C$32 ✓                            │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘

┌─── 3. CART PAGE ────────────────────────────────────────────────────┐
│                                                                       │
│  getTotalPrice() called:                                              │
│    ↓                                                                  │
│  For each item:                                                       │
│    lineTotal = basePrice * quantity                                   │
│    totalInUserCurrency += convertPrice(lineTotal, itemCurrency, ...)  │
│  🐛 BUG #13: itemCurrency might be WRONG for multi-vendor items     │
│    ↓                                                                  │
│  Display Subtotal: formatConvertedCurrency(subtotal, 'INR', ...)     │
│    ✅ Correct conversion                                             │
│    ↓                                                                  │
│  🐛 BUG #7: "Free over INR 500" hardcoded, not converted            │
│    Shows "Free over C$6.70" but means INR 500 = ~C$6.70             │
│    ↓                                                                  │
│  Navigate to Checkout with: { currencyCode: cartCurrency }           │
│  🚩 BUG #12: Checkout IGNORES this and uses CurrencyContext         │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘

┌─── 4. CHECKOUT PAGE ────────────────────────────────────────────────┐
│                                                                       │
│  Initialize:                                                          │
│    checkoutCurrency = currency || 'INR'                              │
│  🐛 BUG #12: Should also read from location.state.currencyCode      │
│    ↓                                                                  │
│  [Delivery Address Form]                                              │
│    User selects Country: "Canada"                                     │
│    ↓                                                                  │
│  useEffect on deliveryAddress.country:                                │
│    getCurrencyForCountry('CANADA') → 'CAD'                           │
│    setCheckoutCurrency('CAD')                                         │
│    ✅ CORRECT - now all prices update to CAD                        │
│    ↓                                                                  │
│  formatPrice(itemPrice, fromCurrency = currencyCode):                │
│  🐛 BUG #3: fromCurrency defaults to TARGET (CAD), not SOURCE (INR) │
│    Correct usage: formatPrice(2500, 'INR')  → "C$32"  ✓             │
│    Wrong usage: formatPrice(0, currencyCode) → convert 'CAD' to 'CAD' ✗
│    ↓                                                                  │
│  Order Summary section:                                               │
│  🐛 BUG #1: CRITICAL - Uses formatCurrency, not formatConvertedCurrency
│    Item price: item.basePrice = 2500 (INR)                           │
│    formatPrice(2500) with currencyCode='CAD'                         │
│    Result: "C$2500" ← WRONG! Should be "C$32"                       │
│    ↓                                                                  │
│  User Reviews Totals:                                                 │
│    Subtotal: formatConvertedCurrency(subtotal, 'INR', 'CAD', rates)  │
│    ✅ Correct conversion to CAD                                      │
│    Shipping: formatPrice(convert(9, 'INR'), currencyCode)            │
│    ✅ Converts 9 INR → ~C$0.11                                       │
│    Tax: formatPrice(tax, currencyCode)                               │
│    🐛 BUG #3: tax might be calculated wrong                          │
│    Total: formatPrice(total, currencyCode)                           │
│    ↓                                                                  │
│  Submit Order → Store in sessionStorage as orderSnapshot             │
│    orderSnapshot.currencyCode = checkoutCurrency = 'CAD'             │
│    orderSnapshot.cartItems[0].basePrice = 2500 (INR)                 │
│    orderSnapshot.subtotal = converted CAD amount                      │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘

┌─── 5. PAYMENT PAGE ────────────────────────────────────────────────┐
│                                                                       │
│  Load order from sessionStorage:                                      │
│    orderSnapshot.currencyCode = 'CAD'                                │
│    orderSnapshot.items[].basePrice = 2500 (in INR)                   │
│    ↓                                                                  │
│  normalizeOrderData():                                                │
│    currencyCode = snapshot.currencyCode || currentCurrency           │
│    = 'CAD' (from Checkout snapshot)                                  │
│    ↓                                                                  │
│  🐛 BUG #4: CRITICAL - Assumes items.basePrice is in 'CAD'!         │
│    But items are stored in INR from backend                          │
│    ↓                                                                  │
│  formatPrice(item.basePrice, sourceCurrencyCode):                    │
│    = formatPrice(2500, 'CAD')  ← WRONG SOURCE!                       │
│    Should be: formatPrice(2500, 'INR')                               │
│    ↓                                                                  │
│  Result: Massive price discrepancy                                    │
│    Shows: "C$2500" when should be "C$32"                             │
│    Or: Shows total as very wrong amount                              │
│    ↓                                                                  │
│  🚩 BUG #10: Cannot edit country/state here                          │
│    State field is read-only, shows old value                         │
│                                                                       │
│  User clicks "Pay": Razorpay initialized with WRONG amount!          │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘

┌─── 6. ORDER CONFIRMATION PAGE ─────────────────────────────────────┐
│                                                                       │
│  Similar flow to Payment:                                             │
│  🐛 BUG #10: Cannot edit address details                             │
│  🐛 BUG #4: Same currency source issue as Payment                    │
│                                                                       │
│  Displays order with potentially WRONG amounts                        │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘

┌─── 7. ADMIN PAGES ─────────────────────────────────────────────────┐
│                                                                       │
│  Catalog.jsx admin view:                                              │
│  🐛 BUG #8: formatCurrency((item.priceCents) / 100)                  │
│    No conversion! Admin sees: "C$2500" (really 2500 INR)             │
│    ↓                                                                  │
│  Admin cannot properly compare prices across regions                  │
│                                                                       │
│  Disputes.jsx:                                                        │
│  🐛 BUG #8: Same - no conversion for dispute amounts                 │
│                                                                       │
│  Orders.jsx:                                                          │
│  🐛 BUG #8: formatCurrency on totalCents without conversion          │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

## Critical Data Corruption Points

```
BACKEND → FRONTEND (❌ Data Issues)

┌─────────────────────────────────────────┐
│ Backend stores:                          │
│  - Medicine.priceCents = 250000 (INR)   │
│  - Cart.unitPriceCents = 250000         │
│  - No currencyCode field!               │
└─────────────────────────────────────────┘
           ↓
    🐛 BUG #2: Frontend assumes INR
           ↓
┌─────────────────────────────────────────┐
│ Frontend receives:                       │
│  basePrice = 2500 (INR cents / 100)    │
│  currencyCode = undefined → defaults 'INR'
│  (No validation this is correct!)       │
└─────────────────────────────────────────┘
           ↓
    🐛 BUG #13: Multi-vendor totals wrong
           ↓
┌─────────────────────────────────────────┐
│ Cart getTotalPrice():                    │
│  Sums: convert(2500, 'INR', userCurr)  │
│  But some items might actually be USD   │
│  and treated as INR! Result: WRONG     │
└─────────────────────────────────────────┘
```

## Exchange Rate Cascade

```
✅ CORRECT PATH:
Backend /api/exchange-rates/latest?base=INR
    ↓
Returns: { base: 'INR', rates: { USD: 1.2, CAD: 0.015, ... } }
    ↓
Cached in localStorage with timestamp
    ↓
convertPrice(amount, 'INR', 'CAD', rates)
    = amount * rates['CAD']  ← Uses cache
    ↓
formatCurrency(converted, 'CAD')
    ↓
"C$32.00" ✓


❌ BROKEN PATHS:

Path 1: Exchange rates fetch fails
    ↓
Fallback to localStorage cache
    ↓
🐛 BUG #11: No check if cache is stale
    ↓
Use rates that might be 12+ hours old
    ↓
"C$2500" when should be "C$28" ← VERY WRONG

Path 2: No exchange rates at all
    ↓
convertPrice returns amount unchanged
    ↓
2500 INR returned
    ↓
formatCurrency(2500, 'CAD')
    ↓
"C$2500" ← Shows INR amount with CAD symbol!
    ↓
🐛 BUG #5: User sees jarring update when rates load
```

## Checkout Currency Tracking Issues

```
EXPECTED FLOW:
User selects Country = Canada
    ↓
useEffect fires: deliveryAddress.country changed
    ↓
getCurrencyForCountry('CANADA') → 'CAD'
    ↓
setCheckoutCurrency('CAD')
    ↓
currencyCode updated
    ↓
All formatPrice() calls re-render with CAD
    ↓
✅ Prices update from INR to CAD


BROKEN FLOW (BUG #12):
User is in Cart with currency = 'CAD'
    ↓
Navigate to Checkout with: { currencyCode: 'CAD' }
    ↓
Checkout initializes: checkoutCurrency = currency || 'INR'
    ↓
🐛 If CurrencyContext reloads and currency = undefined
    checkoutCurrency = 'INR' (not 'CAD'!)
    ↓
Cart showed C$, Checkout shows ₹
    ↓
User confusion: "Why did currency change?"


BROKEN FLOW (BUG #3):
deliveryAddress.country = 'Canada'
    ↓
checkoutCurrency = 'CAD' ✓
    ↓
currencyCode = checkoutCurrency = 'CAD' ✓
    ↓
formatPrice(itemPrice, currencyCode):
    formatConvertedCurrency(itemPrice, 'CAD', 'CAD', rates)
    ↓
convertPrice(2500, 'CAD', 'CAD', rates)
    ↓
Since source == target: return 2500 unchanged ✓
formatCurrency(2500, 'CAD')
    ↓
"C$2500" ← WRONG! Should be "C$32"
```

## Bug #1 vs Bug #3 vs Bug #4 Cascade

```
Item.basePrice = 2500 (INR from backend)

┌─ CART PAGE (CORRECT) ──────────────────┐
│ formatPrice = (v, src=currency) =>      │
│   formatConvertedCurrency(v, src, ...)  │
│ Display: formatPrice(2500, 'INR')       │
│ → convert INR→CAD                        │
│ Result: "C$32" ✓                         │
└────────────────────────────────────────┘

┌─ CHECKOUT (MOSTLY CORRECT) ────────────┐
│ formatPrice = (v, from=currencyCode)    │
│   formatConvertedCurrency(v, from, ...) │
│ Correct: formatPrice(2500, 'INR')       │
│ Result: "C$32" ✓                         │
│ Wrong:  formatPrice(0, currencyCode)    │
│ Result: "C$0" ✓ (harmless for 0)        │
└────────────────────────────────────────┘

┌─ ORDER SUMMARY (🔴 CRITICAL BUG) ──────┐
│ formatPrice = (v) =>                    │
│   formatCurrency(v, currencyCode, true) │
│ NO CONVERSION!                          │
│ formatPrice(item.basePrice)             │
│ = formatCurrency(2500, 'CAD', true)     │
│ Result: "C$2500" ❌ WRONG!              │
│ Should be: "C$32" ✓                     │
└────────────────────────────────────────┘

┌─ PAYMENT (🔴 CRITICAL BUG) ────────────┐
│ sourceCurrencyCode = orderData?.currency│
│                   || currentCurrency    │
│                   = 'CAD' ← WRONG!      │
│ formatPrice(2500, 'CAD')                │
│ = formatConvertedCurrency(2500,'CAD'→..)│
│ Converts 2500 CAD→CAD                   │
│ Result: "C$2500" ❌ VERY WRONG!         │
│ Should assume basePrice in 'INR'!       │
└────────────────────────────────────────┘
```

