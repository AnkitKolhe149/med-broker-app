import React, { createContext, useContext, useState, useEffect } from 'react';
import pricingService from '../services/pricing.service';

const DEFAULT_CART_CONTEXT = {
	cartItems: [],
	addToCart: () => {},
	removeFromCart: () => {},
	updateQuantity: () => {},
	clearCart: () => {},
	getTotalItems: () => 0,
	getTotalUnits: () => 0,
	getTotalPrice: () => 0
};

const CartContext = createContext(DEFAULT_CART_CONTEXT);

export const CartProvider = ({ children }) => {
	const [cartItems, setCartItems] = useState([]);

	const normalizePackageType = (value) => (String(value || 'standard').toLowerCase() === 'bulk' ? 'bulk' : 'standard');

	const normalizeAddToCartInput = ({
		medicine,
		quantity,
		retailPrice,
		wholesalePrice,
		buyerType,
		currencyCode,
		packageType,
		bulkPrice,
		bulkMinQty
	}) => {
		const normalizedQuantity = Math.max(1, Number.parseInt(quantity, 10) || 1);
		const normalizedBuyerType = String(buyerType || 'RETAIL').toUpperCase();
		const pricing = pricingService.mapMedicinePricing({
			retailPrice: retailPrice ?? medicine?.retailPrice ?? medicine?.price ?? 0,
			wholesalePrice: wholesalePrice ?? medicine?.wholesalePrice,
			bulkPrice: bulkPrice ?? medicine?.bulkPrice,
			bulkMinQty: bulkMinQty ?? medicine?.bulkMinQty
		});

		const normalizedPackageType = normalizePackageType(
			packageType
				|| medicine?.selectedSize
				|| medicine?.packageType
				|| 'standard'
		);

		return {
			normalizedQuantity,
			normalizedBuyerType,
			normalizedCurrencyCode: currencyCode || medicine?.currencyCode || 'USD',
			normalizedPackageType,
			pricing
		};
	};

	// Load cart from localStorage on mount
	useEffect(() => {
		try {
			const savedCart = localStorage.getItem('mediq_cart');
			if (savedCart) {
				setCartItems(JSON.parse(savedCart));
			}
		} catch (error) {
			console.error('Failed to load cart from localStorage:', error);
		}
	}, []);

	useEffect(() => {
		const handleAuthChanged = (event) => {
			if (event?.detail?.accountChanged) {
				setCartItems([]);
			}
		};

		window.addEventListener('mediq:auth-changed', handleAuthChanged);
		return () => window.removeEventListener('mediq:auth-changed', handleAuthChanged);
	}, []);

	// Save cart to localStorage whenever it changes
	useEffect(() => {
		try {
			localStorage.setItem('mediq_cart', JSON.stringify(cartItems));
		} catch (error) {
			console.error('Failed to save cart to localStorage:', error);
		}
	}, [cartItems]);

	const addToCart = (
		medicine,
		quantity = 1,
		retailPrice,
		wholesalePrice,
		buyerType,
		currencyCode = 'USD',
		packageType = 'standard',
		bulkPrice,
		bulkMinQty
	) => {
		const {
			normalizedQuantity,
			normalizedBuyerType,
			normalizedCurrencyCode,
			normalizedPackageType,
			pricing
		} = normalizeAddToCartInput({
			medicine,
			quantity,
			retailPrice,
			wholesalePrice,
			buyerType,
			currencyCode,
			packageType,
			bulkPrice,
			bulkMinQty
		});

		setCartItems(prevItems => {
				const normalizedInventoryId = medicine.id;
				const normalizedMedicineId = medicine.medicineId || medicine.id;
				const existingItem = prevItems.find((item) => {
					const itemInventoryId = item.inventoryId || item.medicineId;
					return itemInventoryId === normalizedInventoryId;
				});
			if (existingItem) {
				return prevItems.map(item => {
						const itemInventoryId = item.inventoryId || item.medicineId;
						if (itemInventoryId !== normalizedInventoryId) {
						return item;
					}

					const repriced = pricingService.repriceCartItem({
						cartItem: item,
						medicinePricing: pricing,
						buyerType: normalizedBuyerType,
						quantity: item.quantity + normalizedQuantity,
						packageType: normalizedPackageType
					});

					return {
						...repriced,
						currencyCode: normalizedCurrencyCode,
						buyerType: normalizedBuyerType,
						selectedSize: repriced.packageType
					};
				});
			}

			const unitPrice = pricingService.resolveUnitPrice({
				buyerType: normalizedBuyerType,
				quantity: normalizedQuantity,
				packageType: normalizedPackageType,
				...pricing
			});

			return [
				...prevItems,
				{
					inventoryId: normalizedInventoryId,
					medicineId: normalizedMedicineId,
					name: medicine.name,
					category: medicine.category,
					imageUrl: medicine.imageUrl,
					vendor: medicine.vendor,
					vendorId: medicine.vendorId,
					quantity: normalizedQuantity,
					...pricing,
					buyerType: normalizedBuyerType,
					packageType: normalizedPackageType,
					selectedSize: normalizedPackageType,
					currencyCode: normalizedCurrencyCode,
					basePrice: unitPrice,
					addedAt: new Date().toISOString()
				}
			];
		});
	};

	const removeFromCart = (medicineId) => {
		setCartItems(prevItems => prevItems.filter(item => item.medicineId !== medicineId));
	};

	const updateQuantity = (medicineId, quantity) => {
		if (quantity <= 0) {
			removeFromCart(medicineId);
			return;
		}
		setCartItems(prevItems =>
			prevItems.map(item => {
				if (item.medicineId !== medicineId) {
					return item;
				}

				const normalizedPackageType = item.packageType || item.selectedSize || 'standard';
				const minAllowedQty = normalizedPackageType === 'bulk'
					? Math.max(1, Number.parseInt(item.bulkMinQty, 10) || 1)
					: 1;
				const safeQuantity = Math.max(minAllowedQty, Number.parseInt(quantity, 10) || minAllowedQty);

				const repriced = pricingService.repriceCartItem({
					cartItem: item,
					medicinePricing: {
						retailPrice: item.retailPrice,
						wholesalePrice: item.wholesalePrice,
						bulkPrice: item.bulkPrice,
						bulkMinQty: item.bulkMinQty
					},
					buyerType: item.buyerType,
					quantity: safeQuantity,
					packageType: normalizedPackageType
				});

				return {
					...repriced,
					selectedSize: repriced.packageType
				};
			})
		);
	};

	const clearCart = () => {
		setCartItems([]);
	};

	const getTotalItems = () => {
		// Distinct product lines in cart, used by badges and cart counters.
		return cartItems.length;
	};

	const getTotalUnits = () => {
		return cartItems.reduce((total, item) => total + item.quantity, 0);
	};

	const getTotalPrice = () => {
		return cartItems.reduce((total, item) => total + (item.basePrice * item.quantity), 0);
	};

	const value = {
		cartItems,
		addToCart,
		removeFromCart,
		updateQuantity,
		clearCart,
		getTotalItems,
		getTotalUnits,
		getTotalPrice
	};

	return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
	const context = useContext(CartContext);
	if (context === DEFAULT_CART_CONTEXT) {
		console.warn('useCart is using fallback context. Ensure CartProvider wraps this tree.');
	}
	return context;
};
