import React, { useState, useRef, useEffect } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import styles from './CurrencySelector.module.css';

const CurrencySelector = () => {
	const { currency, setCurrency, availableCurrencies, loading } = useCurrency();
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => document.removeEventListener('mousedown', handleClickOutside);
		}
	}, [isOpen]);

	const handleCurrencyChange = (currencyCode) => {
		setCurrency(currencyCode);
		setIsOpen(false);
	};

	const currentCurrency = availableCurrencies[currency];

	return (
		<div className={styles.currencySelector} ref={dropdownRef}>
			<button
				className={styles.currencyButton}
				onClick={() => setIsOpen(!isOpen)}
				disabled={loading}
				aria-label="Select currency"
				title={`Current currency: ${currentCurrency?.name || currency}`}
			>
				<span className={styles.currencySymbol}>
					{currentCurrency?.symbol || currency}
				</span>
				<span className={styles.currencyCode}>{currency}</span>
				<span className={styles.dropdownIcon}>▼</span>
			</button>

			{isOpen && (
				<div className={styles.dropdownMenu}>
					<div className={styles.dropdownHeader}>
						<span>Select Currency</span>
					</div>
					<div className={styles.currencyList}>
						{Object.entries(availableCurrencies).map(([code, info]) => (
							<button
								key={code}
								className={`${styles.currencyOption} ${
									code === currency ? styles.active : ''
								}`}
								onClick={() => handleCurrencyChange(code)}
							>
								<span className={styles.optionSymbol}>{info.symbol}</span>
								<div className={styles.optionInfo}>
									<span className={styles.optionCode}>{code}</span>
									<span className={styles.optionName}>{info.name}</span>
								</div>
								{code === currency && (
									<span className={styles.checkmark}>✓</span>
								)}
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default CurrencySelector;
