# Quick Reference: All Bugs with Line Numbers & Code

## 🔴 CRITICAL BUGS (User-Facing Impact)

### BUG #1: OrderSummary - No Currency Conversion
**File:** `frontend/src/components/checkout/OrderSummary.jsx`
**Line:** 10  
**Severity:** 🔴 CRITICAL

**Current Code:**
```javascript
const formatPrice = (value) => formatCurrency(value, currencyCode, true);

// Used as:
<p>{formatPrice(item.basePrice * item.quantity)}</p>  // Line 30
```

**Problem:** Applies currency symbol WITHOUT converting price
**Example:** Item = 2500 INR, User in Canada
- Current: "C$2500" (shows INR amount with CAD symbol)
- Should be: "C$32" (proper conversion)

**Fix:**
```javascript
const formatPrice = (value, sourceCurrency = 'INR') => 
  formatConvertedCurrency(value, sourceCurrency, currencyCode, exchangeRates, true);
```

**Impact:** Order summary shows WRONG amounts for non-Indian users

---

### BUG #3: Checkout - Wrong Conversion Direction
**File:** `frontend/src/pages/customer/Checkout.jsx`
**Lines:** 49-50

**Current Code:**
```javascript
const currencyCode = checkoutCurrency || currency || location.state?.currencyCode || cartItems[0]?.currencyCode || 'INR';
const formatPrice = (value, fromCurrency = currencyCode) => formatConvertedCurrency(value, fromCurrency, currencyCode, exchangeRates, true);
```

**Problem:** `currencyCode` is the TARGET currency (CAD for Canada)
- `formatPrice(value)` defaults `fromCurrency = currencyCode` (TARGET)
- Converts CAD→CAD instead of INR→CAD
- Works only when source currency passed explicitly

**Problematic Calls:**
```javascript
// Line 487 - Tries to format 0 INR as if it's CAD (harmless for 0)
<strong>{formatPrice(0, currencyCode)}</strong>

// Line 495 - Should pass 'INR' as source
<strong>{formatPrice(convert(9, 'INR'), currencyCode)}</strong>
```

**Fix:**
```javascript
// Option 1: Change default source to 'INR'
const formatPrice = (value, fromCurrency = 'INR') => 
  formatConvertedCurrency(value, fromCurrency, currencyCode, exchangeRates, true);

// Option 2: Keep as-is but always pass source currency explicitly
<strong>{formatPrice(item.basePrice * item.quantity, item.currencyCode || 'INR')}</strong>
```

---

### BUG #4: Payment Page - Inconsistent Currency Source
**File:** `frontend/src/pages/customer/Payment.jsx`
**Lines:** 40-41, 77

**Current Code:**
```javascript
const currentCurrency = currency || 'INR';  // USER's currency
const sourceCurrencyCode = orderData?.currencyCode || currentCurrency;  // ❌ Ambiguous!
const formatPrice = (value, fromCurrency = sourceCurrencyCode) => 
  formatConvertedCurrency(value, fromCurrency, currentCurrency, exchangeRates, true);

// In normalizeOrderData():
currencyCode: snapshot.currencyCode || source?.currencyCode || currentCurrency,  // Line 77
```

**Problem:** 
- `orderData?.currencyCode` is the CHECKOUT country (CAD)
- But `orderData.items[].basePrice` is stored in INR in backend
- Tries to convert CAD→CAD when should be INR→CAD

**Scenario:** 
```javascript
orderData = {
  currencyCode: 'CAD',  // From Checkout, the country selected
  items: [
    { 
      basePrice: 2500   // Actually INR from backend!
    }
  ]
}

// Payment does:
formatPrice(2500, 'CAD')  // ❌ Wrong! Should be 'INR'
// Results in: "C$2500" instead of "C$32"
```

**Fix:**
```javascript
// Always assume backend items are in INR, regardless of orderData.currencyCode
const sourceItemCurrency = 'INR';  // Backend stores all in INR
const formatPrice = (value, fromCurrency = sourceItemCurrency) => 
  formatConvertedCurrency(value, fromCurrency, currentCurrency, exchangeRates, true);

// When formatting items:
<span>{formatPrice(item.basePrice * item.quantity, 'INR')}</span>
```

**Impact:** Payment page shows VASTLY wrong amounts (2500x too high)

---

## 🟠 HIGH PRIORITY BUGS

### BUG #2: CartContext - Cart Item Currency Not Validated
**File:** `frontend/src/context/CartContext.jsx`
**Lines:** 25-50 (mapServerCartItem), 320-335 (getTotalPrice)

**Current Code:**
```javascript
const mapServerCartItem = (item) => {
  // ...
  currencyCode: item.currencyCode || 'INR',  // ❌ Defaults to INR without validation
  basePrice: Number(item.basePrice || item.priceSnapshotCents || item.retailPrice || 0) / (item.priceSnapshotCents ? 100 : 1),
  // ...
};

const getTotalPrice = (targetCurrency = preferredCurrency || 'INR') => {
  let total = 0;
  cartItems.forEach((item) => {
    const itemCurrency = item.currencyCode || 'INR';
    const lineTotal = Number(item.basePrice || 0) * Number(item.quantity || 0);
    total = total + convertPrice(lineTotal, itemCurrency, targetCurrency, exchangeRates);
  });
  return total;
};
```

**Problem:** 
- Backend doesn't populate `currencyCode` on cart items
- System assumes all items are in INR, but they might be in different currencies
- Multi-vendor carts from different countries have wrong totals

**Scenario:**
```javascript
// Cart with items from multiple vendors/countries
cart.items = [
  { basePrice: 2500, currencyCode: undefined → 'INR' },      // Actually INR ✓
  { basePrice: 2500, currencyCode: undefined → 'INR' },      // Actually USD ✗
  { basePrice: 2500, currencyCode: undefined → 'INR' }       // Actually GBP ✗
]

getTotalPrice('CAD') calculates:
  item1: convertPrice(2500, 'INR', 'CAD') = ~C$32
  item2: convertPrice(2500, 'INR', 'CAD') = ~C$32  ❌ Should be 2500 USD→CAD
  item3: convertPrice(2500, 'INR', 'CAD') = ~C$32  ❌ Should be 2500 GBP→CAD
```

**Fix:**
```javascript
// Backend must return currencyCode with each item
// OR Frontend must track source currency from vendor
const getTotalPrice = (targetCurrency = preferredCurrency || 'INR') => {
  let total = 0;
  cartItems.forEach((item) => {
    // Always assume backend items are in INR unless explicitly stated
    const itemCurrency = item.currencyCode || 'INR';
    if (!['INR', 'USD', 'EUR', 'GBP', 'CAD', 'SGD', 'AED', 'SAR', 'JPY', 'CNY', 'BRL', 'ZAR', 'RUB', 'AUD'].includes(itemCurrency)) {
      console.warn(`Invalid currency ${itemCurrency} for item ${item.medicineId}, using INR`);
      itemCurrency = 'INR';
    }
    const lineTotal = Number(item.basePrice || 0) * Number(item.quantity || 0);
    total = total + convertPrice(lineTotal, itemCurrency, targetCurrency, exchangeRates);
  });
  return total;
};
```

---

### BUG #5: CurrencyContext - Exchange Rates Null on Render
**File:** `frontend/src/context/CurrencyContext.jsx`
**Lines:** 82-105 (initial load)

**Current Code:**
```javascript
export const convertPrice = (amount, fromCurrency, targetCurrency, exchangeRates) => {
  if (!exchangeRates || !exchangeRates.rates) {
    return amount;  // ❌ Returns UNCONVERTED if rates missing!
  }
  // ... conversion logic
};
```

**Problem:**
- On page load, `exchangeRates = null`
- Any price display before rates load shows unconverted amounts
- User sees "C$2500" (INR amount with CAD symbol) initially
- Once rates load (500ms later), prices snap to correct values
- Creates visual jarring and potential calculation errors

**Example User Experience:**
```
Page Load (t=0ms):
  exchangeRates = null
  convertPrice(2500, 'INR', 'CAD', null) → returns 2500
  formatCurrency(2500, 'CAD') → "C$2500" ❌

Rates Loaded (t=500ms):
  exchangeRates = { rates: { CAD: 0.015 } }
  convertPrice(2500, 'INR', 'CAD', rates) → returns 37.5
  formatCurrency(37.5, 'CAD') → "C$37.50" ✓
```

**Fix:**
```javascript
// Option 1: Pre-load exchange rates before rendering page
// Option 2: Show loading skeleton while rates load
// Option 3: Use fallback rates from static file

// In CurrencyProvider:
useEffect(() => {
  const loadExchangeRates = async () => {
    try {
      const rates = await fetchExchangeRates();
      if (rates) setExchangeRates(rates);
    } catch (err) {
      // Use static fallback rates
      setExchangeRates(FALLBACK_RATES);  // Hardcoded backup
    }
  };
  loadExchangeRates();
}, []);

// In component:
if (!exchangeRates) {
  return <LoadingPrices />;  // Show skeleton
}
```

---

### BUG #6: Currency Detection - No Validation of Currency Code
**File:** `frontend/src/utils/currency.js`
**Lines:** 55-65

**Current Code:**
```javascript
export const getCurrencyForCountry = (country, fallback = 'USD') => {
  if (!country) {
    return fallback;
  }
  const normalizedCountry = String(country).trim().toUpperCase();
  return COUNTRY_TO_CURRENCY[normalizedCountry] || fallback;  // ❌ No validation!
}
```

**Problem:**
- Returns currency code without checking if it exists in CURRENCIES
- If COUNTRY_TO_CURRENCY has typo (e.g., 'CAP' instead of 'CAD')
- Later calls to getCurrencySymbol('CAP') return undefined
- formatCurrency crashes or displays wrong symbol

**Scenario:**
```javascript
const currency = getCurrencyForCountry('CANADA');  // Returns 'CAD'
const symbol = getCurrencySymbol(currency);         // Returns '₹' ❌

// In CURRENCIES:
CAD: { symbol: 'C$', ... }

// But if mapping returned 'CAP':
CAP: undefined
getCurrencySymbol('CAP') → CURRENCIES['CAP']?.symbol → undefined
formatCurrency(100, 'CAP') → "undefined100" or crashes
```

**Fix:**
```javascript
export const getCurrencyForCountry = (country, fallback = 'USD') => {
  if (!country) {
    return normalizeCurrencyCode(fallback);
  }
  const normalizedCountry = String(country).trim().toUpperCase();
  const currency = COUNTRY_TO_CURRENCY[normalizedCountry] || fallback;
  
  // Validate that returned currency actually exists
  return normalizeCurrencyCode(currency, fallback);
};

export const normalizeCurrencyCode = (currencyCode, fallback = 'INR') => {
  const normalized = String(currencyCode || fallback).trim().toUpperCase();
  // Check if exists in CURRENCIES
  return CURRENCIES[normalized] ? normalized : String(fallback || 'INR').trim().toUpperCase();
};
```

---

### BUG #7: Hardcoded Price Thresholds Not Converted
**File:** `frontend/src/pages/customer/Cart.jsx`
**Line:** 216

**Current Code:**
```javascript
<p className={styles.infoCardText}>On orders above {formatPrice(500, 'INR')}</p>
```

**Problem:**
- Free delivery threshold is hardcoded as 500 INR
- But should be different per country
- Creates misleading information
- "Free delivery above C$6.70" might mean INR 500, not CAD 500

**Other Locations with Hardcoded Values:**
- `Checkout.jsx` line 495: Shipping cost 9 INR
- `Payment.jsx`: Delivery charge calculations
- `Cart.jsx` line 43: Delivery fee 10 INR

**Fix:**
```javascript
// Option 1: Make thresholds configurable per country
const DELIVERY_THRESHOLDS = {
  'INR': 500,
  'CAD': 7,
  'SGD': 7,
  'USD': 6.5,
  // ... for each currency
};

// Option 2: Calculate from backend based on user's country
const deliveryThreshold = await api.getDeliveryThreshold(userCountry);
<p>On orders above {formatPrice(deliveryThreshold, currencyCode)}</p>

// Current temporary fix:
<p>On orders above {formatPrice(500, 'INR')}</p>  // At least shows conversion
```

---

### BUG #8: Admin Catalog - No Currency Conversion
**File:** `frontend/src/pages/admin/Catalog.jsx`
**Lines:** 20, 135

**Current Code:**
```javascript
const { formatCurrency } = useCurrency();
// ...
<td>{formatCurrency((item.priceCents || 0) / 100)}</td>
```

**Also in:**
- `frontend/src/pages/admin/Disputes.jsx` line 98
- `frontend/src/pages/admin/Orders.jsx` line 85

**Problem:**
- Admin sees prices in their local currency
- But items stored in INR database
- No conversion happens
- Admin in Canada sees: "C$2500" (actually 2500 INR)

**Fix:**
```javascript
const { formatCurrency, convert, currency } = useCurrency();
const { exchangeRates } = useCurrency();

// Convert from INR to admin's currency
const formatAdminPrice = (priceCents) => {
  const priceInINR = (priceCents || 0) / 100;
  const convertedPrice = convert(priceInINR, 'INR');
  return formatCurrency(convertedPrice, currency, true);
};

<td>{formatAdminPrice(item.priceCents)}</td>
```

---

### BUG #9: Checkout - Incomplete State/Province Mappings
**File:** `frontend/src/pages/customer/Checkout.jsx`
**Lines:** 70-85

**Current Code:**
```javascript
const statesByCountry = useMemo(() => ({
  'India': [...],           // ✓ 36 states
  'United States': [...],   // ✓ 50 states
  'United Kingdom': [...],  // ✓ 4 countries
  'Canada': [...],          // ✓ 13 provinces
  'Australia': [...],       // ✓ 8 territories
  'Germany': [...],         // ✓ 16 states
  'France': [...],          // ✓ 12 regions
  'UAE': [...],             // ✓ 7 emirates
  'Singapore': ['Singapore'],  // ✓ 1
  'Japan': [...]            // ✓ 47 prefectures
  // Only 10 countries! But system supports 14 currencies
}), []);
```

**Problem:**
- 14 supported currencies but only 10 have state/province lists
- Missing countries: Germany, France, maybe others
- Wait, actually Germany and France ARE there. Let me recount...
- Actually all 10 are covered, but user might have other country that's not supported

**Unsupported Countries (By Currency):**
- SAR (Saudi Arabia) - not in statesByCountry
- RUB (Russia) - not in statesByCountry
- BRL (Brazil) - not in statesByCountry
- ZAR (South Africa) - not in statesByCountry

**Fix:**
```javascript
const statesByCountry = useMemo(() => ({
  // ... existing
  'Saudi Arabia': ['Riyadh', 'Mecca', 'Medina', ...],  // Add SAR countries
  'Russia': ['Moscow', 'Saint Petersburg', ...],       // Add RUB countries
  'Brazil': ['São Paulo', 'Rio de Janeiro', ...],      // Add BRL countries
  'South Africa': ['Gauteng', 'Western Cape', ...],    // Add ZAR countries
}), []);
```

---

### BUG #10: Payment & OrderConfirmation - No Dynamic Address Editing
**File:** `frontend/src/pages/customer/Payment.jsx` & `frontend/src/pages/customer/OrderConfirmation.jsx`

**Problem:**
- These pages display address details but DON'T allow editing
- No country/state dropdown selectors
- State field shows stale values from Checkout
- Cannot fix address without going back to Checkout
- If user navigates Checkout→Cart→Checkout, state field in Payment is out of sync

**Missing Code:**
- No `statesByCountry` object
- No conditional rendering for state field
- No country dropdown selector
- No useEffect to sync with Checkout state
- No address update API call

**Example Sync Issue:**
```javascript
// In Checkout:
selectCountry('Canada')
selectState('Ontario')
saveAndNavigateToPayment()

// In Payment:
// ... time passes ...
navigate(-1)  // Back to Checkout

// In Checkout:
selectCountry('United States')
selectState('California')
navigate('/payment')

// In Payment (now):
// Still shows 'Ontario' (stale from first visit!)
// Form is read-only, user can't fix it
```

**Fix:**
```javascript
// In Payment.jsx, add:
const statesByCountry = useMemo(() => ({
  // ... copy from Checkout
}), []);

const [deliveryAddress, setDeliveryAddress] = useState(orderData?.deliveryAddress || {});

const handleCountryChange = (country) => {
  setDeliveryAddress(prev => ({
    ...prev,
    country,
    state: ''  // Reset state when country changes
  }));
};

// Render country/state dropdowns (editable)
```

---

### BUG #11: Cached Exchange Rates - No Sanity Checks
**File:** `frontend/src/context/CurrencyContext.jsx`
**Lines:** 82-87

**Current Code:**
```javascript
if (rates) {
  setExchangeRates(rates);
  localStorage.setItem('exchangeRates', JSON.stringify(rates));
  localStorage.setItem('exchangeRatesTimestamp', Date.now().toString());
}
```

**Problem:**
- Cached rates used until 6-hour TTL expires
- No validation rates are reasonable
- Exchange rates can swing 10-20% in volatile markets
- Old rates might be very wrong

**Scenario:**
```javascript
// Cached on Monday: CAD rate = 1.35
convertPrice(100, 'INR', 'CAD', cachedRates) → 135 CAD

// By Wednesday: Real CAD rate = 1.20
// But cache still valid, showing 135 CAD instead of 120 CAD

// Error: 135 vs 120 = 12.5% difference!
// User might overpay or receive wrong conversion
```

**No Checks For:**
- Extreme rate changes (>5% deviation)
- Currency blacklisting
- Rate sanity (JPY rate of 0.01 seems wrong)
- Timestamp freshness within tolerance

**Fix:**
```javascript
const isRateSane = (rate, currency, lastKnownRate) => {
  if (!lastKnownRate) return true;
  const deviation = Math.abs(rate - lastKnownRate) / lastKnownRate;
  return deviation < 0.1;  // Allow max 10% swing
};

const validateExchangeRates = (rates) => {
  // Check all rates are positive numbers
  for (const [currency, rate] of Object.entries(rates.rates)) {
    if (typeof rate !== 'number' || rate <= 0) {
      console.warn(`Invalid rate for ${currency}: ${rate}`);
      return false;
    }
  }
  return true;
};

if (rates && validateExchangeRates(rates)) {
  setExchangeRates(rates);
}
```

---

### BUG #12: Cart to Checkout Currency Mismatch
**File:** `frontend/src/pages/customer/Cart.jsx` line 47 → `frontend/src/pages/customer/Checkout.jsx` line 43

**Current Code - Cart:**
```javascript
const navigate = useNavigate();
// ...
navigate('/customer/checkout', { 
  state: { discountPercent, appliedCoupon, currencyCode: cartCurrency } 
});
```

**Current Code - Checkout:**
```javascript
const { currency, exchangeRates, convert } = useCurrency();
const [checkoutCurrency, setCheckoutCurrency] = useState(currency || 'INR');
// ❌ Ignores location.state.currencyCode!
```

**Problem:**
- Cart passes currencyCode but Checkout ignores it
- If CurrencyContext reloads between pages, currency might change
- Cart showed prices in CAD, Checkout shows in INR
- User sees different currencies between pages

**Scenario:**
```javascript
// Cart page:
currency (from CurrencyContext) = 'CAD'
Prices shown in C$
Navigate with currencyCode: 'CAD'

// Meanwhile:
CurrencyContext reloads (auth event or page refresh)
currency defaults to 'INR'

// Checkout page:
checkoutCurrency = currency = 'INR'
Prices shown in ₹

// Result: Currency changed between pages! User confused.
```

**Fix:**
```javascript
// In Checkout:
const [checkoutCurrency, setCheckoutCurrency] = useState(() => {
  // Priority: location.state > CurrencyContext > default
  return location.state?.currencyCode || currency || 'INR';
});

// OR use useEffect to sync with location.state:
useEffect(() => {
  if (location.state?.currencyCode) {
    setCheckoutCurrency(location.state.currencyCode);
  }
}, [location.state?.currencyCode]);
```

---

### BUG #13: CartContext getTotalPrice - Wrong Source Currency
**File:** `frontend/src/context/CartContext.jsx`
**Lines:** 320-335

**Current Code:**
```javascript
const getTotalPrice = (targetCurrency = preferredCurrency || 'INR') => {
  let total = 0;
  cartItems.forEach((item) => {
    const itemCurrency = item.currencyCode || 'INR';  // ❌ Might be wrong
    const lineTotal = Number(item.basePrice || 0) * Number(item.quantity || 0);
    total = total + convertPrice(lineTotal, itemCurrency, targetCurrency, exchangeRates);
  });
  return total;
};
```

**Problem:** 
- Assumes `item.basePrice` is stored in `item.currencyCode`
- But backend doesn't properly set currencyCode
- Backend stores all prices in INR cents, but currencyCode defaults to 'INR'
- If a vendor item is actually in USD but marked as INR, total is wrong

**Related to BUG #2** - this is the consumer of the bad data

**Fix:** Same as BUG #2 - validate currencyCode from backend

---

### BUG #14: Intl.NumberFormat - Symbol Ambiguity & Localization Issues
**File:** `frontend/src/utils/currency.js`
**Lines:** 139-155

**Current Code:**
```javascript
export const formatCurrency = (amount, currencyCode = 'INR', showSymbol = true) => {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return showSymbol ? `${getCurrencySymbol(currencyCode)}0.00` : '0.00';
  }

  const normalizedCurrency = normalizeCurrencyCode(currencyCode);
  const numericAmount = Number(amount);

  try {
    return new Intl.NumberFormat(getCurrencyLocale(normalizedCurrency), {
      style: showSymbol ? 'currency' : 'decimal',
      currency: normalizedCurrency,
      currencyDisplay: 'narrowSymbol',  // ❌ Might not be supported
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericAmount);
  } catch (_error) {
    // Fallback to manual formatting
    const formatted = numericAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return showSymbol ? `${getCurrencySymbol(normalizedCurrency)}${formatted}` : formatted;
  }
};
```

**Problems:**

1. **Symbol Ambiguity:**
   - JPY (¥) and CNY (¥) use same symbol
   - User can't tell if ¥100 is Japanese Yen or Chinese Yuan
   - Can cause 100x price confusion (JPY much smaller than CNY)

2. **Localization Issues:**
   - Arabic currencies (AED, SAR) require RTL text
   - Some systems don't support all locales
   - 'narrowSymbol' might not be supported on all browsers
   - Fallback might not include RTL support

3. **Browser Compatibility:**
   - Older browsers don't support Intl.NumberFormat
   - Some mobile browsers have limited locale support
   - Inconsistent symbol rendering across platforms

**Example Issues:**
```javascript
// User sees: ¥1000
// Could be:
//   - JPY 1000 (~USD 6.50)
//   - CNY 1000 (~USD 138)
// 20x difference! Very confusing.

// Arabic device might show:
// "100 AED" (reversed text, might not render correctly)
// Should be: "د.إ 100"
```

**Fix:**
```javascript
const CURRENCY_SYMBOLS_FULL = {
  JPY: { symbol: '¥', code: 'JPY', name: 'Yen' },
  CNY: { symbol: '¥', code: 'CNY', name: 'Yuan' },  // Include code to disambiguate
  // ...
};

export const formatCurrency = (amount, currencyCode = 'INR', showSymbol = true) => {
  // ...
  
  // Use 'symbol' instead of 'narrowSymbol' for better compatibility
  return new Intl.NumberFormat(locale, {
    style: showSymbol ? 'currency' : 'decimal',
    currency: normalizedCurrency,
    currencyDisplay: 'symbol',  // More compatible
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericAmount);
  
  // For ambiguous symbols, include currency code:
  if (['JPY', 'CNY'].includes(normalizedCurrency)) {
    return `${symbol} ${numericAmount.toFixed(2)} ${normalizedCurrency}`;
  }
};
```

---

## Summary: Bugs by Component

### OrderSummary.jsx
- ❌ BUG #1: No currency conversion

### Checkout.jsx
- ⚠️ BUG #3: Wrong conversion direction (minor - mostly works)
- ⚠️ BUG #9: Incomplete state mappings
- ⚠️ BUG #12: Ignores location.state.currencyCode

### Cart.jsx
- ⚠️ BUG #7: Hardcoded thresholds
- ⚠️ BUG #12: Passes currencyCode to Checkout (state management issue)

### Payment.jsx
- ❌ BUG #4: Critical currency source confusion
- ⚠️ BUG #10: Cannot edit address
- ⚠️ BUG #7: Hardcoded delivery costs

### OrderConfirmation.jsx
- ⚠️ BUG #10: Cannot edit address
- ⚠️ BUG #7: Hardcoded values

### CurrencyContext.jsx
- ⚠️ BUG #5: Null exchange rates on load
- ⚠️ BUG #11: No cached rate validation
- ⚠️ BUG #12: Contributes to currency mismatch

### CartContext.jsx
- ❌ BUG #2: Item currency code not validated
- ❌ BUG #13: Wrong source currency in getTotalPrice
- ⚠️ BUG #12: Creates currency inconsistency

### currency.js
- ⚠️ BUG #6: No currency code validation
- ⚠️ BUG #14: Symbol ambiguity & localization issues

### Admin Pages
- ⚠️ BUG #8: No currency conversion

