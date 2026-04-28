# Currency Conversion Pipeline Analysis & Bugs Found

## Pipeline Overview

The currency conversion system has 3 main flows:

### **FLOW 1: Currency Selection & Detection**
```
User Login → CurrencyContext loads user currency
    ↓
Check user.preferredCurrency 
    ↓
Fall back to getCurrencyForCountry(user.customer.country)
    ↓
Fall back to getUserCurrencyPreference() from localStorage
    ↓
Fall back to 'INR' as default
```

### **FLOW 2: Exchange Rates Fetching**
```
Backend: GET /api/exchange-rates/latest?base=INR
    ↓
Returns: { base: 'INR', rates: { USD: 1.2, CAD: 0.015, ... }, fetchedAt: timestamp }
    ↓
CurrencyContext caches in localStorage with 6-hour TTL
    ↓
Frontend convertPrice() uses rates to convert between any two currencies
```

### **FLOW 3: Price Display & Conversion**
```
Backend returns item.priceCents (stored in INR cents)
    ↓
Frontend cart loads items with currencyCode (usually 'INR')
    ↓
On display, converts: INR → User's Selected Currency
    ↓
Format with currency symbol and locale formatting
```

---

## CRITICAL BUGS FOUND

### 🔴 **BUG #1: OrderSummary Component Uses Wrong Currency Function**

**Location:** [frontend/src/components/checkout/OrderSummary.jsx](frontend/src/components/checkout/OrderSummary.jsx#L10)

**Issue:**
```javascript
// WRONG - doesn't convert prices
const formatPrice = (value) => formatCurrency(value, currencyCode, true);
// Then used as: formatPrice(item.basePrice * item.quantity)
```

**Problem:**
- `item.basePrice` is stored in INR cents from backend
- But formatPrice() applies currency symbol WITHOUT converting
- If user selected Canada (CAD), it displays: "C$1234" (showing 1234 INR as CAD)
- Should show ~C$16 after conversion

**Impact:** All prices in order summary shown in WRONG amounts for non-Indian users

**Fix Required:**
```javascript
const formatPrice = (value, sourceCurrency = 'INR') => 
  formatConvertedCurrency(value, sourceCurrency, currencyCode, exchangeRates, true);
```

---

### 🔴 **BUG #2: Cart Item Currency Code Not Validated**

**Location:** [frontend/src/context/CartContext.jsx](frontend/src/context/CartContext.jsx#L31-L50)

**Issue:**
```javascript
// mapServerCartItem() returns items with:
currencyCode: item.currencyCode || 'INR', // defaults to INR
basePrice: Number(item.basePrice || item.priceSnapshotCents || item.retailPrice || 0)
```

**Problem:**
- Items might come from different vendors in different countries
- Backend doesn't set `currencyCode` properly when returning cart items
- System assumes ALL items are in INR, but they might be in USD, CAD, etc.
- When getTotalPrice() converts, it uses WRONG source currency for some items

**Example Scenario:**
- Item 1: USD vendor, basePrice = 25 (USD) but stored as INR by backend
- Item 2: INR vendor, basePrice = 2500 (INR)
- Cart getTotalPrice() converts both as if they're INR
- Result: Wrong total

**Impact:** Multi-vendor carts have INCORRECT totals

---

### 🔴 **BUG #3: Checkout formatPrice Uses Wrong Conversion Direction**

**Location:** [frontend/src/pages/customer/Checkout.jsx](frontend/src/pages/customer/Checkout.jsx#L50)

**Issue:**
```javascript
const currencyCode = checkoutCurrency || currency || ... || 'INR'; // TARGET currency
const formatPrice = (value, fromCurrency = currencyCode) => // BUG: defaults to TARGET
  formatConvertedCurrency(value, fromCurrency, currencyCode, exchangeRates, true);
```

**Problem:**
- `currencyCode` is the CHECKOUT country's currency (TARGET)
- But `formatPrice(value)` defaults `fromCurrency = currencyCode`
- This means converting FROM user's selected country TO user's selected country
- If item basePrice is in INR and user is in Canada:
  - `formatPrice(100)` tries to convert CAD → CAD (wrong!)
  - Should be converting INR → CAD

**When It Breaks:**
- Line 522: `formatPrice(item.basePrice * item.quantity, item.currencyCode || currencyCode)`
  - This works because it passes source currency explicitly
- Line 487, 495: `formatPrice(0, currencyCode)` - tries to convert currencyCode to currencyCode
  - Harmless but wrong logic

**Impact:** Some checkout prices might not convert properly depending on how formatPrice is called

---

### 🔴 **BUG #4: Payment Page Has Inconsistent Currency Source**

**Location:** [frontend/src/pages/customer/Payment.jsx](frontend/src/pages/customer/Payment.jsx#L40-L41)

**Issue:**
```javascript
const currentCurrency = currency || 'INR'; // USER's currency
const sourceCurrencyCode = orderData?.currencyCode || currentCurrency; // Ambiguous!
const formatPrice = (value, fromCurrency = sourceCurrencyCode) => 
  formatConvertedCurrency(value, fromCurrency, currentCurrency, exchangeRates, true);
```

**Problem:**
- `sourceCurrencyCode` tries to use order's currency, falls back to user's currency
- But order data might have wrong currencyCode (from previous bug)
- `normalizeOrderData()` copies currencyCode from multiple sources without validation
- Line 77: `currencyCode: snapshot.currencyCode || source?.currencyCode || currentCurrency`
  - Cascades through multiple sources, might pick wrong value
  - No validation that the currency code actually exists

**Example Scenario:**
- Order saved with currencyCode = 'CAD'
- User lands on Payment page
- payment.jsx sets sourceCurrencyCode = 'CAD'
- But order.items have basePrice in INR!
- formatPrice tries to convert CAD → INR when should be INR → INR
- Result: Massive price discrepancy

**Impact:** Payment page shows WRONG amounts for orders created in different checkout sessions

---

### 🟠 **BUG #5: Exchange Rates Might Be Null During Render**

**Location:** [frontend/src/utils/currency.js](frontend/src/utils/currency.js#L177-L200)

**Issue:**
```javascript
export const convertPrice = (amount, fromCurrency, targetCurrency, exchangeRates) => {
  if (!exchangeRates || !exchangeRates.rates) {
    return amount; // Returns ORIGINAL AMOUNT if rates missing!
  }
  // ... conversion logic
}
```

**Problem:**
- On page load, exchangeRates = null while fetching from backend
- Any `formatPrice()` call before rates load returns UNCONVERTED price
- Price appears as INR amount but with CAD symbol (from formatCurrency)
- Once rates load, prices snap to correct values
- Creates visual jarring experience and potential calculation errors

**Example User Experience:**
```
Page loads: "C$2500" (actually 2500 INR shown as C$)
Wait 500ms...
Page updates: "C$32" (properly converted)
```

**Impact:** Initial prices displayed are INCORRECT until exchange rates load

---

### 🟠 **BUG #6: Currency Detection Doesn't Validate Against Available Currencies**

**Location:** [frontend/src/utils/currency.js](frontend/src/utils/currency.js#L55-L65)

**Issue:**
```javascript
export const getCurrencyForCountry = (country, fallback = 'USD') => {
  if (!country) {
    return fallback;
  }
  const normalizedCountry = String(country).trim().toUpperCase();
  return COUNTRY_TO_CURRENCY[normalizedCountry] || fallback; // No validation!
}
```

**Problem:**
- Returns currency code without checking if it exists in CURRENCIES
- If COUNTRY_TO_CURRENCY mapping has typo (e.g., 'CAP' instead of 'CAD')
- getCurrencySymbol() will fail: `CURRENCIES['CAP']?.symbol` → undefined
- formatCurrency() called with invalid code will crash or display wrong symbol

**Example:**
```javascript
getCurrencyForCountry('CANADA') // Returns 'CAD' ✓
getCurrencyForCountry('CANADIAN TERRITORY') // Returns 'USD' (fallback) 
getCurrencyForCountry('SOMEPLACE') // Returns 'USD' (fallback)
```

**Impact:** Invalid currency codes can cause silent failures or wrong symbol display

---

### 🟠 **BUG #7: Hardcoded Price Thresholds Not Converted**

**Location:** [frontend/src/pages/customer/Cart.jsx](frontend/src/pages/customer/Cart.jsx#L216)

**Issue:**
```javascript
<p>On orders above {formatPrice(500, 'INR')}</p>
```

**Problem:**
- Free delivery threshold is hardcoded as 500 INR
- formatPrice(500, 'INR') converts INR→userCurrency
- But the ACTUAL free delivery threshold in backend might be different per country!
- Creates misleading information: "Free delivery above C$6.70" might mean "above INR 500" in backend

**Location:** Also in Checkout.jsx and other pages with hardcoded thresholds

**Impact:** Misleading free delivery threshold messaging

---

### 🟠 **BUG #8: Admin Catalog Doesn't Convert Prices**

**Location:** [frontend/src/pages/admin/Catalog.jsx](frontend/src/pages/admin/Catalog.jsx#L135)

**Issue:**
```javascript
const { formatCurrency } = useCurrency();
// ...
<td>{formatCurrency((item.priceCents || 0) / 100)}</td>
```

**Problem:**
- Admin sees prices in their local currency
- But items are stored in INR in database
- formatCurrency() doesn't convert, just formats
- Admin in Canada sees: "C$2500" (actually 2500 INR)
- Cannot compare prices across regions properly

**Impact:** Admin portal shows MISLEADING prices for non-Indian admins

---

### 🟠 **BUG #9: Checkout Doesn't Update State/Province Selectors for Non-Supported Countries**

**Location:** [frontend/src/pages/customer/Checkout.jsx](frontend/src/pages/customer/Checkout.jsx#L70-L85)

**Issue:**
```javascript
const statesByCountry = useMemo(() => ({
  'India': [...],
  'United States': [...],
  'Canada': [...],
  // Only 10 countries supported
  // 4 more countries (Germany, France, UAE, Singapore, Japan) are NOT in this list!
}), []);

const getStatesForCountry = (country) => statesByCountry[country] || [];
```

**Problem:**
- 14 currencies supported but only 10 have state/province lists
- If user selects Germany, France, or other unmapped country
- getStatesForCountry() returns empty array
- State field becomes text input (which is OK) but form doesn't validate
- User can enter "Bavaria" as text when they should pick from dropdown

**Missing Countries:**
- ✗ Germany (14 states available but not mapped)
- ✗ France (13 regions available but not mapped)
- ✗ Any other unmapped currency country

**Impact:** UX breaks for users in non-mapped countries

---

### 🟠 **BUG #10: Payment & OrderConfirmation Don't Have Dynamic Country/State Selection**

**Location:** [frontend/src/pages/customer/Payment.jsx](frontend/src/pages/customer/Payment.jsx) & [frontend/src/pages/customer/OrderConfirmation.jsx](frontend/src/pages/customer/OrderConfirmation.jsx)

**Issue:**
- Checkout.jsx has full country/state dropdown logic with dynamic state lists
- Payment.jsx and OrderConfirmation.jsx are display-only
- User cannot edit country/state on Payment page if needed
- State field shows old values from Checkout
- If user navigates back to Checkout, changes country, then goes to Payment
  - State field still shows OLD state (no synchronization)

**Missing Code:**
- No `statesByCountry` object
- No conditional rendering for state vs text input
- No country dropdown selector
- No useEffect to update state based on country

**Impact:** State/province mismatches across checkout flow; UX confusion

---

### 🟠 **BUG #11: Cached Exchange Rates Not Validated for Reasonableness**

**Location:** [frontend/src/context/CurrencyContext.jsx](frontend/src/context/CurrencyContext.jsx#L82-L84)

**Issue:**
```javascript
if (rates) {
  setExchangeRates(rates);
  localStorage.setItem('exchangeRates', JSON.stringify(rates));
  localStorage.setItem('exchangeRatesTimestamp', Date.now().toString());
}
```

**Problem:**
- Cached rates are used until 6-hour TTL expires
- No validation that cached rates are reasonable
- Exchange rates can jump 10-20% in volatile markets
- Old rates might be significantly wrong
- Example: CAD was 1.35 but now it's 1.20
  - Old rates would show wrong converted prices
  - User sees INR 100 = C$1.35 (old) vs C$1.20 (new)

**No Checks For:**
- Rate deviation from last update
- Currency blacklisting (disabled currencies)
- Rate sanity (e.g., JPY rate of 0.01 seems wrong, might be 0.0067)

**Impact:** Potentially stale exchange rates lead to incorrect prices

---

### 🟠 **BUG #12: Inconsistent Currency Handling Between Pages**

**Location:** [frontend/src/pages/customer/Cart.jsx](frontend/src/pages/customer/Cart.jsx#L47) to [frontend/src/pages/customer/Checkout.jsx](frontend/src/pages/customer/Checkout.jsx#L43-L50)

**Issue:**
```javascript
// Cart.jsx
const cartCurrency = currency || 'INR';
// ... navigate with:
navigate('/customer/checkout', { 
  state: { discountPercent, appliedCoupon, currencyCode: cartCurrency } 
});

// Checkout.jsx
const [checkoutCurrency, setCheckoutCurrency] = useState(currency || 'INR');
// Does NOT read from location.state.currencyCode!
```

**Problem:**
- Cart passes `currencyCode` to Checkout via location.state
- Checkout ignores it and uses CurrencyContext instead
- If Cart was in CAD but CurrencyContext defaults to INR
  - Prices shown in different currencies between pages
  - Cart shows C$ but Checkout shows ₹
  - Confusing for user

**Sequence:**
1. User in Canada: currency = 'CAD' (from CurrencyContext)
2. Adds to cart: prices shown in C$
3. Goes to checkout: CurrencyContext reloads, might default to INR
4. Prices now shown in ₹

**Impact:** Currency inconsistency across navigation

---

### 🟠 **BUG #13: Cart getTotalPrice() Assumes All Items In Same Currency**

**Location:** [frontend/src/context/CartContext.jsx](frontend/src/context/CartContext.jsx#L320-L335)

**Issue:**
```javascript
const getTotalPrice = (targetCurrency = preferredCurrency || 'INR') => {
  let total = 0;
  cartItems.forEach((item) => {
    const itemCurrency = item.currencyCode || 'INR';
    const lineTotal = Number(item.basePrice || 0) * Number(item.quantity || 0);
    // Converts with exchange rates
    total = total + convertPrice(lineTotal, itemCurrency, targetCurrency, exchangeRates);
  });
  return total;
};
```

**Problem:**
- Assumes `item.basePrice` is in `item.currencyCode`
- But backend doesn't properly set currencyCode on cart items
- Backend stores all prices in cents (INR), but doesn't always populate currencyCode
- Example:
  - Item 1: basePrice = 2500 (INR cents), currencyCode = undefined → defaults to 'INR' ✓
  - Item 2: basePrice = 2500 (USD cents), currencyCode = undefined → defaults to 'INR' ✗
  - Total calculated wrong because Item 2 is treated as INR when it's USD

**Impact:** Multi-vendor carts with items from different regions have WRONG totals

---

### 🟠 **BUG #14: Intl.NumberFormat Might Fail for Some Currencies**

**Location:** [frontend/src/utils/currency.js](frontend/src/utils/currency.js#L139-L155)

**Issue:**
```javascript
try {
  return new Intl.NumberFormat(getCurrencyLocale(normalizedCurrency), {
    style: showSymbol ? 'currency' : 'decimal',
    currency: normalizedCurrency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericAmount);
} catch (_error) {
  // Fallback to manual formatting
}
```

**Problem:**
- Intl.NumberFormat might throw on some systems/locales
- Fallback is basic: `${getCurrencySymbol(normalizedCurrency)}${formatted}`
- Some symbols might not render correctly:
  - Arabic AED symbol (د.إ) requires RTL support
  - Some systems might show as "AED" instead
  - JPY and CNY both use ¥, ambiguous

**Regional Issues:**
- Windows in China: Might not support ar-SA locale
- Some browsers: Don't support certain currency locales
- Mobile: Different locale support than desktop

**Impact:** Currency display might be broken or ambiguous on some systems

---

## SUMMARY TABLE

| Bug # | Severity | Component | Issue | Impact |
|-------|----------|-----------|-------|--------|
| 1 | 🔴 Critical | OrderSummary | No conversion | Wrong amounts shown |
| 2 | 🔴 Critical | CartContext | Currency code not validated | Wrong multi-vendor totals |
| 3 | 🔴 Critical | Checkout | Wrong conversion direction | Incorrect price display |
| 4 | 🔴 Critical | Payment | Inconsistent currency source | Wrong amounts on payment |
| 5 | 🟠 High | CurrencyContext | Null exchange rates | Prices show unconverted initially |
| 6 | 🟠 High | currency.js | No currency validation | Invalid currency codes possible |
| 7 | 🟠 High | Cart/Checkout | Hardcoded thresholds | Misleading free delivery info |
| 8 | 🟠 High | Admin Catalog | No conversion | Admin sees wrong prices |
| 9 | 🟠 High | Checkout | Incomplete state mappings | Missing states for some countries |
| 10 | 🟠 High | Payment/OrderConf | No dynamic selectors | Can't edit country/state |
| 11 | 🟠 High | CurrencyContext | Stale cached rates | Potentially wrong conversions |
| 12 | 🟠 High | Cart→Checkout | Inconsistent currency | Prices change between pages |
| 13 | 🟠 High | CartContext | Wrong source currency | Multi-vendor totals incorrect |
| 14 | 🟠 High | currency.js | Intl format might fail | Symbol display issues |

---

## Recommended Fix Priority

1. **FIRST** (Critical - User-Visible):
   - Bug #1: Fix OrderSummary conversion
   - Bug #4: Fix Payment page currency source
   - Bug #3: Fix Checkout conversion direction

2. **SECOND** (High - Data Integrity):
   - Bug #2: Validate cart item currencies from backend
   - Bug #13: Ensure proper currency tracking for multi-vendor carts

3. **THIRD** (High - UX):
   - Bug #5: Pre-load exchange rates
   - Bug #10: Add country/state to Payment and OrderConfirmation

4. **FOURTH** (Medium - Data Quality):
   - Bug #6: Validate currency codes exist
   - Bug #7: Make price thresholds dynamic
   - Bug #11: Add rate sanity checks
   - Bug #12: Use location.state.currencyCode in Checkout
