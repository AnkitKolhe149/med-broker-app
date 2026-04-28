import React, { createContext, useContext, useState, useEffect } from 'react';
import {
	fetchExchangeRates,
	getUserCurrencyPreference,
	setUserCurrencyPreference,
	convertPrice,
	formatCurrency,
	getCurrencySymbol,
	getCurrencyForCountry,
	detectUserCurrency,
	CURRENCIES,
} from '../utils/currency';

const CurrencyContext = createContext();

// ✅ BUG #5: Fallback exchange rates for when API is slow
// These are approximate rates as of April 28, 2026
const FALLBACK_EXCHANGE_RATES = {
	base: 'INR',
	rates: {
		INR: 1,
		USD: 0.012,
		EUR: 0.011,
		GBP: 0.0095,
		CAD: 0.016,
		SGD: 0.016,
		AED: 0.044,
		SAR: 0.045,
		JPY: 1.8,
		CNY: 0.084,
		BRL: 0.059,
		ZAR: 0.22,
		RUB: 1.0,
		AUD: 0.018
	},
	fetchedAt: new Date().toISOString(),
	source: 'fallback'
};

// ✅ BUG #11: Validate that exchange rates are reasonable
const validateExchangeRates = (rates) => {
	if (!rates || !rates.rates || typeof rates.rates !== 'object') {
		console.warn('Invalid rates structure');
		return false;
	}

	// Check that all rates are positive numbers
	for (const [currency, rate] of Object.entries(rates.rates)) {
		if (typeof rate !== 'number' || rate <= 0 || isNaN(rate)) {
			console.warn(`Invalid rate for ${currency}: ${rate}`);
			return false;
		}
	}

	// Sanity check: ensure rates don't have extreme outliers
	// (e.g., rate changing by more than 50% from fallback would be suspicious)
	const ratesToCheck = ['USD', 'EUR', 'GBP', 'CAD', 'JPY'];
	for (const currency of ratesToCheck) {
		if (rates.rates[currency] && FALLBACK_EXCHANGE_RATES.rates[currency]) {
			const fallbackRate = FALLBACK_EXCHANGE_RATES.rates[currency];
			const currentRate = rates.rates[currency];
			const deviation = Math.abs(currentRate - fallbackRate) / fallbackRate;
			if (deviation > 0.5) {  // More than 50% change
				console.warn(`Extreme deviation for ${currency}: ${(deviation * 100).toFixed(1)}%`);
				// Don't reject, just warn - markets do move quickly
			}
		}
	}

	return true;
};

export const useCurrency = () => {
	const context = useContext(CurrencyContext);
	if (!context) {
		throw new Error('useCurrency must be used within CurrencyProvider');
	}
	return context;
};

export const CurrencyProvider = ({ children }) => {
	const [currency, setCurrencyState] = useState(getUserCurrencyPreference());
	// ✅ BUG #5: Initialize with fallback rates so prices show correctly while fetching
	const [exchangeRates, setExchangeRates] = useState(() => {
		try {
			const cached = localStorage.getItem('exchangeRates');
			return cached ? JSON.parse(cached) : FALLBACK_EXCHANGE_RATES;
		} catch {
			return FALLBACK_EXCHANGE_RATES;
		}
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Listen for auth changes and update currency from user's country
	useEffect(() => {
		const handleAuthChanged = (event) => {
			const nextUser = event?.detail?.user || null;
			if (nextUser?.preferredCurrency) {
				setCurrencyState(String(nextUser.preferredCurrency).toUpperCase());
				return;
			}

			if (nextUser?.customer?.country || nextUser?.vendor?.country) {
				const userCountry = nextUser.customer?.country || nextUser.vendor?.country;
				setCurrencyState(getCurrencyForCountry(userCountry, 'USD'));
				return;
			}

			setCurrencyState(getUserCurrencyPreference());
		};

		window.addEventListener('mediq:auth-changed', handleAuthChanged);
		return () => window.removeEventListener('mediq:auth-changed', handleAuthChanged);
	}, []);

	// Try to detect currency from stored user data on initial load
	useEffect(() => {
		try {
			const storedUser = localStorage.getItem('user');
			if (storedUser) {
				const user = JSON.parse(storedUser);
				if (user?.preferredCurrency) {
					setCurrencyState(String(user.preferredCurrency).toUpperCase());
				} else if (user?.customer?.country || user?.vendor?.country) {
					const userCountry = user.customer?.country || user.vendor?.country;
					const detectedCurrency = getCurrencyForCountry(userCountry, 'USD');
					setCurrencyState(detectedCurrency);
				}
			}
		} catch (err) {
			console.error('Failed to detect user currency from storage:', err);
		}
	}, []);

	// Fetch exchange rates on mount and daily
	useEffect(() => {
		const loadExchangeRates = async () => {
			setLoading(true);
			setError(null);
			
			try {
				const rates = await fetchExchangeRates();
				
				if (rates) {
					// ✅ BUG #11: Validate rates are sane before using
					if (validateExchangeRates(rates)) {
						setExchangeRates(rates);
						localStorage.setItem('exchangeRates', JSON.stringify(rates));
						localStorage.setItem('exchangeRatesTimestamp', Date.now().toString());
					} else {
						console.warn('Received rates failed validation, using fallback');
						setError('Exchange rates validation failed');
						const cached = localStorage.getItem('exchangeRates');
						if (!cached) setExchangeRates(FALLBACK_EXCHANGE_RATES);
					}
				} else {
					// Try to use cached rates
					const cached = localStorage.getItem('exchangeRates');
					if (cached) {
						setExchangeRates(JSON.parse(cached));
					} else {
						setExchangeRates(FALLBACK_EXCHANGE_RATES);
					}
				}
			} catch (err) {
				console.error('Error loading exchange rates:', err);
				setError(err.message);
				
				// Fallback to cached rates
				const cached = localStorage.getItem('exchangeRates');
				if (cached) {
					const parsedCache = JSON.parse(cached);
					if (validateExchangeRates(parsedCache)) {
						setExchangeRates(parsedCache);
					} else {
						console.warn('Cached rates failed validation, using fallback');
						setExchangeRates(FALLBACK_EXCHANGE_RATES);
					}
				} else {
					setExchangeRates(FALLBACK_EXCHANGE_RATES);
				}
			} finally {
				setLoading(false);
			}
		};

		loadExchangeRates();

		// Refresh rates every 6 hours
		const interval = setInterval(loadExchangeRates, 6 * 60 * 60 * 1000);

		return () => clearInterval(interval);
	}, []);

	// Update currency preference
	const setCurrency = (newCurrency) => {
		const normalizedCurrency = String(newCurrency || 'INR').toUpperCase();
		setCurrencyState(normalizedCurrency);
		setUserCurrencyPreference(normalizedCurrency);
	};

	// Helper function to convert and format price
	const convertAndFormat = (amount, fromCurrency = 'INR', showSymbol = true) => {
		const converted = convertPrice(amount, fromCurrency, currency, exchangeRates);
		return formatCurrency(converted, currency, showSymbol);
	};

	// Get just the converted amount
	const convert = (amount, fromCurrency = 'INR') => {
		return convertPrice(amount, fromCurrency, currency, exchangeRates);
	};

	// Format original price with vendor's currency
	const formatOriginalPrice = (amount, vendorCurrency) => {
		return formatCurrency(amount, vendorCurrency?.toUpperCase() || 'INR', true);
	};

	const value = {
		currency,
		setCurrency,
		exchangeRates,
		loading,
		error,
		convertAndFormat,
		convert,
		formatOriginalPrice,
		formatCurrency: (amount, showSymbol = true) => formatCurrency(amount, currency, showSymbol),
		getCurrencySymbol: () => getCurrencySymbol(currency),
		availableCurrencies: CURRENCIES,
		isINR: currency === 'INR',
	};

	return (
		<CurrencyContext.Provider value={value}>
			{children}
		</CurrencyContext.Provider>
	);
};
