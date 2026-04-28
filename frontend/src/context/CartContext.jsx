import React, { createContext, useContext, useState, useEffect } from 'react';
import pricingService from '../services/pricing.service';
import { useUser } from './UserContext';
import { useCurrency } from './CurrencyContext';
import cartService from '../services/cart.service';
import { convertPrice } from '../utils/currency';

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

const mapServerCartItem = (item) => {
	// CRITICAL: medicineId must be from explicit fields, not derived from item.id
	const medicineId = item.medicineId || item.medicine?.id;
	if (!medicineId) {
		console.error('[CartContext] Cart item missing medicineId:', item);
		return null;
	}

	return {
		id: item.id,
		customerId: item.customerId,
		medicineId,
		inventoryId: item.inventoryId || item.id,
		name: item.name || item.medicine?.name || 'Medicine',
		category: item.category || item.medicine?.category || 'Medicine',
		imageUrl: item.imageUrl || item.inventory?.imageUrl || null,
		vendor: item.vendor || item.inventory?.vendor?.companyName || item.medicine?.brand || 'Trusted vendor',
		vendorId: item.vendorId || item.inventory?.vendor?.id || null,
		quantity: Number(item.quantity || 1),
		retailPrice: Number(item.retailPrice || item.basePrice || item.priceSnapshotCents || 0) / (item.priceSnapshotCents ? 100 : 1),
		wholesalePrice: Number(item.wholesalePrice || 0),
		buyerType: item.buyerType || 'RETAIL',
		packageType: item.selectedSize || 'standard',
		selectedSize: item.selectedSize || 'standard',
		currencyCode: item.currencyCode || 'INR',
		basePrice: Number(item.basePrice || item.priceSnapshotCents || item.retailPrice || 0) / (item.priceSnapshotCents ? 100 : 1),
		addedAt: item.addedAt || item.createdAt || new Date().toISOString()
	};
};

const mapLocalCartItem = (item) => ({
	...item,
	id: item.id || item.inventoryId || item.medicineId,
	inventoryId: item.inventoryId || item.id || item.medicineId,
	medicineId: item.medicineId || item.id,
	basePrice: Number(item.basePrice || 0)
});

export const CartProvider = ({ children }) => {
	const [cartItems, setCartItems] = useState([]);
	const { user } = useUser();
	const { currency: preferredCurrency, exchangeRates } = useCurrency();

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
			normalizedCurrencyCode: currencyCode || medicine?.currencyCode || 'INR',
			normalizedPackageType,
			pricing
		};
	};

	// Load cart from server when authenticated, otherwise localStorage
	useEffect(() => {
		const load = async () => {
			try {
				if (user && user.id) {
					const local = JSON.parse(localStorage.getItem('mediq_cart') || '[]');
					if (local.length) {
						for (const item of local) {
							try {
								await cartService.addToCart({
									medicineId: item.medicineId || item.id,
									inventoryId: item.inventoryId || item.id,
									quantity: item.quantity,
									selectedSize: item.selectedSize,
									priceSnapshotCents: Math.round(Number(item.basePrice || 0) * 100),
									currencyCode: item.currencyCode || 'INR'
								});
							} catch (error) {
								console.warn('Failed to merge local cart item', error);
							}
						}
						localStorage.removeItem('mediq_cart');
					}

					const res = await cartService.getCart();
					setCartItems((res.data || []).map(mapServerCartItem).filter(item => item !== null));
				} else {
					const savedCart = localStorage.getItem('mediq_cart');
					if (savedCart) setCartItems(JSON.parse(savedCart).map(mapLocalCartItem));
				}
			} catch (error) {
				console.error('Failed to load cart:', error);
			}
		};
		load();
	}, [user?.id]);

	useEffect(() => {
		const handleAuthChanged = (event) => {
			if (event?.detail?.accountChanged) {
				setCartItems([]);
			}
		};

		window.addEventListener('mediq:auth-changed', handleAuthChanged);
		return () => window.removeEventListener('mediq:auth-changed', handleAuthChanged);
	}, []);

	useEffect(() => {
		if (user && user.id) return;
		localStorage.setItem('mediq_cart', JSON.stringify(cartItems));
	}, [cartItems, user?.id]);

	const addToCart = (
		medicine,
		quantity = 1,
		retailPrice,
		wholesalePrice,
		buyerType,
		currencyCode = 'USD',
		packageType = 'standard'
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
			packageType
		});

		const normalizedInventoryId = medicine.id;
		const normalizedMedicineId = medicine.medicineId || medicine.id;
		const unitPrice = pricingService.resolveUnitPrice({
			buyerType: normalizedBuyerType,
			quantity: normalizedQuantity,
			packageType: normalizedPackageType,
			...pricing
		});

		setCartItems(prevItems => {
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

				});
			}

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
		// If user is logged in, persist to server
		if (user && user.id) {
			(async () => {
				try {
					await cartService.addToCart({
						medicineId: normalizedMedicineId,
						inventoryId: normalizedInventoryId,
						quantity: normalizedQuantity,
						selectedSize: normalizedPackageType,
						priceSnapshotCents: Math.round(unitPrice * 100),
						currencyCode: normalizedCurrencyCode
					});
				} catch (e) { console.warn('cart sync failed', e); }
			})();
		}
	};

	const removeFromCart = (medicineId) => {
		setCartItems(prevItems => prevItems.filter(item => item.medicineId !== medicineId && item.inventoryId !== medicineId));
		if (user && user.id) {
			// best-effort: find server id and delete
			(async () => {
				try {
					const res = await cartService.getCart();
					const serverItem = (res.data || []).find(i => (i.medicineId || i.inventoryId) === medicineId);
					if (serverItem) await cartService.removeCartItem(serverItem.id);
				} catch (e) { /* ignore */ }
			})();
		}
	};

	const updateQuantity = (medicineId, quantity) => {
		if (quantity <= 0) {
			removeFromCart(medicineId);
			return;
		}

		if (user && user.id) {
			(async () => {
				try {
					const res = await cartService.getCart();
					const serverItem = (res.data || []).find(i => (i.medicineId || i.inventoryId) === medicineId);
					if (serverItem) await cartService.updateCartItem(serverItem.id, { quantity });
				} catch (e) {
					console.warn('cart quantity sync failed', e);
				}
			})();
		}

		setCartItems(prevItems =>
			prevItems.map(item => {
				if (item.medicineId !== medicineId && item.inventoryId !== medicineId) {
					return item;
				}

				const safeQuantity = Math.max(1, Number.parseInt(quantity, 10) || 1);

				const repriced = pricingService.repriceCartItem({
					cartItem: item,
					medicinePricing: {
						retailPrice: item.retailPrice,
						wholesalePrice: item.wholesalePrice
					},
					buyerType: item.buyerType,
					quantity: safeQuantity,
					packageType: item.packageType || item.selectedSize || 'standard'
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
		if (user && user.id) cartService.clearCart().catch(() => {});
		if (!user || !user.id) localStorage.removeItem('mediq_cart');
	};

	const getTotalItems = () => {
		// Distinct product lines in cart, used by badges and cart counters.
		return cartItems.length;
	};

	const getTotalUnits = () => {
		return cartItems.reduce((total, item) => total + item.quantity, 0);
	};

	const getTotalPrice = () => {
		const targetCurrency = preferredCurrency || 'INR';
		return cartItems.reduce((total, item) => {
			const itemCurrency = item.currencyCode || targetCurrency;
			const lineTotal = Number(item.basePrice || 0) * Number(item.quantity || 1);
			return total + convertPrice(lineTotal, itemCurrency, targetCurrency, exchangeRates);
		}, 0);
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
