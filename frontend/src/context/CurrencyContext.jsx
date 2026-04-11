import React, { createContext, useContext, useState, useEffect } from 'react';
import {
	fetchExchangeRates,
	getUserCurrencyPreference,
	setUserCurrencyPreference,
	convertPrice,
	formatCurrency,
	getCurrencySymbol,
	detectUserCurrency,
	CURRENCIES,
} from '../utils/currency';

const CurrencyContext = createContext();

export const useCurrency = () => {
	const context = useContext(CurrencyContext);
	if (!context) {
		throw new Error('useCurrency must be used within CurrencyProvider');
	}
	return context;
};

export const CurrencyProvider = ({ children }) => {
	const [currency, setCurrencyState] = useState(getUserCurrencyPreference());
	const [exchangeRates, setExchangeRates] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const handleAuthChanged = (event) => {
			const nextUser = event?.detail?.user || null;
			if (nextUser?.preferredCurrency) {
				setCurrencyState(String(nextUser.preferredCurrency).toUpperCase());
				return;
			}

			if (nextUser?.customer?.country || nextUser?.vendor?.country) {
				setCurrencyState(getCurrencyForCountry(nextUser.customer?.country || nextUser.vendor?.country, detectUserCurrency()));
				return;
			}

			setCurrencyState(getUserCurrencyPreference());
		};

		window.addEventListener('mediq:auth-changed', handleAuthChanged);
		return () => window.removeEventListener('mediq:auth-changed', handleAuthChanged);
	}, []);

	// Fetch exchange rates on mount and daily
	useEffect(() => {
		const loadExchangeRates = async () => {
			setLoading(true);
			setError(null);
			
			try {
				const rates = await fetchExchangeRates();
				
				if (rates) {
					setExchangeRates(rates);
					// Cache rates with timestamp
					localStorage.setItem('exchangeRates', JSON.stringify(rates));
					localStorage.setItem('exchangeRatesTimestamp', Date.now().toString());
				} else {
					// Try to use cached rates
					const cached = localStorage.getItem('exchangeRates');
					if (cached) {
						setExchangeRates(JSON.parse(cached));
					} else {
						setError('Could not fetch exchange rates');
					}
				}
			} catch (err) {
				console.error('Error loading exchange rates:', err);
				setError(err.message);
				
				// Fallback to cached rates
				const cached = localStorage.getItem('exchangeRates');
				if (cached) {
					setExchangeRates(JSON.parse(cached));
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
