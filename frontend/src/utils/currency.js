/**
 * Currency Utility Functions
 * Handles currency conversion and formatting with daily exchange rates
 */

// Common currency symbols and info
export const CURRENCIES = {
	INR: { symbol: '₹', name: 'Indian Rupee', country: 'India' },
	USD: { symbol: '$', name: 'US Dollar', country: 'United States' },
	EUR: { symbol: '€', name: 'Euro', country: 'Europe' },
	GBP: { symbol: '£', name: 'British Pound', country: 'United Kingdom' },
	JPY: { symbol: '¥', name: 'Japanese Yen', country: 'Japan' },
	AUD: { symbol: 'A$', name: 'Australian Dollar', country: 'Australia' },
	CAD: { symbol: 'C$', name: 'Canadian Dollar', country: 'Canada' },
	SGD: { symbol: 'S$', name: 'Singapore Dollar', country: 'Singapore' },
	AED: { symbol: 'د.إ', name: 'UAE Dirham', country: 'UAE' },
	SAR: { symbol: 'ر.س', name: 'Saudi Riyal', country: 'Saudi Arabia' },
	CNY: { symbol: '¥', name: 'Chinese Yuan', country: 'China' },
	BRL: { symbol: 'R$', name: 'Brazilian Real', country: 'Brazil' },
	ZAR: { symbol: 'R', name: 'South African Rand', country: 'South Africa' },
	RUB: { symbol: '₽', name: 'Russian Ruble', country: 'Russia' },
};

const COUNTRY_TO_CURRENCY = {
	'UNITED STATES': 'USD',
	US: 'USD',
	'UNITED KINGDOM': 'GBP',
	GB: 'GBP',
	INDIA: 'INR',
	IN: 'INR',
	AUSTRALIA: 'AUD',
	AU: 'AUD',
	CANADA: 'CAD',
	CA: 'CAD',
	SINGAPORE: 'SGD',
	SG: 'SGD',
	UAE: 'AED',
	'UNITED ARAB EMIRATES': 'AED',
	AE: 'AED',
	'SAUDI ARABIA': 'SAR',
	SA: 'SAR',
	JAPAN: 'JPY',
	JP: 'JPY',
	CHINA: 'CNY',
	CN: 'CNY',
	BRAZIL: 'BRL',
	BR: 'BRL',
	'SOUTH AFRICA': 'ZAR',
	ZA: 'ZAR',
	RUSSIA: 'RUB',
	RU: 'RUB',
	GERMANY: 'EUR',
	DE: 'EUR',
	FRANCE: 'EUR',
	FR: 'EUR',
	ITALY: 'EUR',
	IT: 'EUR',
	SPAIN: 'EUR',
	ES: 'EUR',
	NETHERLANDS: 'EUR',
	NL: 'EUR'
};

export const getCurrencyForCountry = (country, fallback = 'USD') => {
	if (!country) {
		return fallback;
	}

	const normalizedCountry = String(country).trim().toUpperCase();
	// ✅ BUG #6: Validate that returned currency exists in CURRENCIES
	const currency = COUNTRY_TO_CURRENCY[normalizedCountry] || fallback;
	return normalizeCurrencyCode(currency, fallback);
};

export const normalizeCurrencyCode = (currencyCode, fallback = 'INR') => {
	const normalized = String(currencyCode || fallback).trim().toUpperCase();
	// ✅ BUG #6: Double-check fallback is also valid
	if (CURRENCIES[normalized]) {
		return normalized;
	}
	const normalizedFallback = String(fallback || 'INR').trim().toUpperCase();
	return CURRENCIES[normalizedFallback] ? normalizedFallback : 'INR';
};

const CURRENCY_LOCALE_MAP = {
	INR: 'en-IN',
	USD: 'en-US',
	EUR: 'de-DE',
	GBP: 'en-GB',
	JPY: 'ja-JP',
	AUD: 'en-AU',
	CAD: 'en-CA',
	SGD: 'en-SG',
	AED: 'ar-AE',
	SAR: 'ar-SA',
	CNY: 'zh-CN',
	BRL: 'pt-BR',
	ZAR: 'en-ZA',
	RUB: 'ru-RU'
};

export const getCurrencyLocale = (currencyCode) => {
	const normalized = normalizeCurrencyCode(currencyCode);
	return CURRENCY_LOCALE_MAP[normalized] || 'en-US';
};

const getStoredUserContext = () => {
	try {
		const rawUser = localStorage.getItem('user');
		if (!rawUser) return {};
		const user = JSON.parse(rawUser);
		return {
			id: user?.id || null,
			country: user?.customer?.country || user?.vendor?.country || null,
			preferredCurrency: user?.preferredCurrency || null
		};
	} catch (_error) {
		return {};
	}
};

const getCurrencyPreferenceKey = (userId) => (userId ? `preferredCurrency:${userId}` : 'preferredCurrency');

// Get currency symbol
export const getCurrencySymbol = (currencyCode) => {
	const normalized = normalizeCurrencyCode(currencyCode);
	// ✅ BUG #14: For ambiguous symbols, include currency code to avoid confusion
	const symbol = CURRENCIES[normalized]?.symbol;
	if (!symbol) return normalized;

	// JPY and CNY both use ¥, disambiguate
	if (normalized === 'JPY' || normalized === 'CNY') {
		return `${symbol}${normalized}`;
	}

	return symbol;
};

// Get currency name
export const getCurrencyName = (currencyCode) => {
	return CURRENCIES[currencyCode]?.name || currencyCode;
};

// Format amount with currency symbol
export const formatCurrency = (amount, currencyCode = 'INR', showSymbol = true) => {
	if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
		return showSymbol ? `${getCurrencySymbol(currencyCode)}0.00` : '0.00';
	}

	const normalizedCurrency = normalizeCurrencyCode(currencyCode);
	const numericAmount = Number(amount);
	const ambiguousSymbolCurrencies = new Set(['JPY', 'CNY']);
	const formattedNumber = new Intl.NumberFormat(getCurrencyLocale(normalizedCurrency), {
		style: 'decimal',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(numericAmount);

	if (showSymbol && ambiguousSymbolCurrencies.has(normalizedCurrency)) {
		return `${getCurrencySymbol(normalizedCurrency)} ${formattedNumber} ${normalizedCurrency}`;
	}

	try {
		return new Intl.NumberFormat(getCurrencyLocale(normalizedCurrency), {
			style: showSymbol ? 'currency' : 'decimal',
			currency: normalizedCurrency,
			currencyDisplay: 'symbol',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(numericAmount);
	} catch (_error) {
		return showSymbol ? `${getCurrencySymbol(normalizedCurrency)}${formattedNumber}` : formattedNumber;
	}
};

export const formatConvertedCurrency = (amount, fromCurrency, targetCurrency, exchangeRates, showSymbol = true) => {
	const convertedAmount = convertPrice(amount, fromCurrency, targetCurrency, exchangeRates);
	return formatCurrency(convertedAmount, targetCurrency || fromCurrency, showSymbol);
};

// Convert price from any currency to any target currency
// Uses INR as the base for cross-currency conversion
export const convertPrice = (amount, fromCurrency, targetCurrency, exchangeRates) => {
	if (!exchangeRates || !exchangeRates.rates) {
		return amount; // Return original if no rates available
	}

	// Normalize currency codes
	fromCurrency = fromCurrency?.toUpperCase() || 'INR';
	targetCurrency = targetCurrency?.toUpperCase() || 'INR';

	// If same currency, no conversion needed
	if (fromCurrency === targetCurrency) {
		return amount;
	}

	// If converting from base currency (INR)
	if (fromCurrency === 'INR') {
		const rate = exchangeRates.rates[targetCurrency];
		if (!rate) {
			console.warn(`Exchange rate not found for ${targetCurrency}`);
			return amount;
		}
		return amount * rate;
	}

	// If converting to base currency (INR)
	if (targetCurrency === 'INR') {
		const rate = exchangeRates.rates[fromCurrency];
		if (!rate) {
			console.warn(`Exchange rate not found for ${fromCurrency}`);
			return amount;
		}
		// Divide by rate to convert back to INR
		return amount / rate;
	}

	// Cross-currency conversion (e.g., EUR → USD)
	// Step 1: Convert from source to INR
	// Step 2: Convert from INR to target
	const fromRate = exchangeRates.rates[fromCurrency];
	const toRate = exchangeRates.rates[targetCurrency];

	if (!fromRate || !toRate) {
		console.warn(`Missing exchange rates for ${fromCurrency} or ${targetCurrency}`);
		return amount;
	}

	// Convert to INR first, then to target
	const amountInINR = amount / fromRate;
	const convertedAmount = amountInINR * toRate;

	return convertedAmount;
};

// Fetch latest exchange rates from backend
export const fetchExchangeRates = async () => {
	try {
		const apiBaseUrl = import.meta.env.VITE_API_URL;
		const endpoint = apiBaseUrl
			? `${apiBaseUrl}/exchange-rates/latest?base=INR`
			: '/api/exchange-rates/latest?base=INR';
		const response = await fetch(endpoint);
		
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		const contentType = response.headers.get('content-type') || '';
		if (!contentType.toLowerCase().includes('application/json')) {
			throw new Error(`Invalid exchange-rate response type: ${contentType || 'unknown'}`);
		}

		const data = await response.json();
		return {
			base: data.base,
			rates: data.rates,
			fetchedAt: data.fetchedAt,
		};
	} catch (error) {
		console.error('Failed to fetch exchange rates:', error);
		return null;
	}
};

// Detect user's currency based on browser locale
export const detectUserCurrency = () => {
	try {
		// Try to get currency from browser locale
		const locale = navigator.language || navigator.userLanguage || 'en-IN';
		
		// Common locale to currency mappings
		const localeToCurrency = {
			'en-US': 'USD',
			'en-GB': 'GBP',
			'en-IN': 'INR',
			'en-AU': 'AUD',
			'en-CA': 'CAD',
			'en-SG': 'SGD',
			'en-AE': 'AED',
			'ja-JP': 'JPY',
			'zh-CN': 'CNY',
			'ar-SA': 'SAR',
			'pt-BR': 'BRL',
			'ru-RU': 'RUB',
			'fr-FR': 'EUR',
			'de-DE': 'EUR',
			'it-IT': 'EUR',
			'es-ES': 'EUR',
			'nl-NL': 'EUR',
		};

		// Check exact match first
		if (localeToCurrency[locale]) {
			return localeToCurrency[locale];
		}

		// Check language code only
		const langCode = locale.split('-')[0];
		const countryCode = locale.split('-')[1];

		// Try country code mapping
		const countryToCurrency = {
			'US': 'USD',
			'GB': 'GBP',
			'IN': 'INR',
			'AU': 'AUD',
			'CA': 'CAD',
			'SG': 'SGD',
			'AE': 'AED',
			'SA': 'SAR',
			'JP': 'JPY',
			'CN': 'CNY',
			'BR': 'BRL',
			'RU': 'RUB',
			'ZA': 'ZAR',
		};

		if (countryCode && countryToCurrency[countryCode]) {
			return countryToCurrency[countryCode];
		}

		// Default to INR for Indian context
		return 'INR';
	} catch (error) {
		console.error('Could not detect user currency:', error);
		return 'INR';
	}
};

// Get/set user currency preference from localStorage
export const getUserCurrencyPreference = () => {
	try {
		const { id: userId, country, preferredCurrency: userPreferredCurrency } = getStoredUserContext();
		const userSpecificKey = getCurrencyPreferenceKey(userId);
		const saved = localStorage.getItem(userSpecificKey);

		if (saved) {
			return saved;
		}

		if (userPreferredCurrency) {
			return String(userPreferredCurrency).toUpperCase();
		}

		// Keep the legacy global preference only for anonymous sessions.
		if (!userId) {
			const legacySaved = localStorage.getItem('preferredCurrency');
			if (legacySaved) {
				return legacySaved;
			}
		}

		if (country) {
			return getCurrencyForCountry(country, detectUserCurrency());
		}

		return detectUserCurrency();
	} catch (error) {
		return detectUserCurrency();
	}
};

export const setUserCurrencyPreference = (currencyCode) => {
	try {
		const { id: userId } = getStoredUserContext();
		const normalizedCurrency = String(currencyCode || 'INR').toUpperCase();
		localStorage.setItem(getCurrencyPreferenceKey(userId), normalizedCurrency);
		localStorage.setItem('preferredCurrency', normalizedCurrency);
	} catch (error) {
		console.error('Could not save currency preference:', error);
	}
};
