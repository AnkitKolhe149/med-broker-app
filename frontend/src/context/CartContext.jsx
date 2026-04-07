import React, { createContext, useContext, useState, useEffect } from 'react';
import medicineService from '../services/medicine.service';
import pricingService from '../services/pricing.service';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
	const [cartItems, setCartItems] = useState([]);

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

	const getBuyerType = () => {
		try {
			const rawUser = localStorage.getItem('user');
			if (!rawUser) return 'RETAIL';
			const user = JSON.parse(rawUser);
			return user?.customer?.buyerType || 'RETAIL';
		} catch (_error) {
			return 'RETAIL';
		}
	};

	const refreshCartItemPricing = async (medicineId, overrides = {}) => {
		try {
			const medicine = await medicineService.getMedicineById(medicineId);
			if (!medicine) return;

			const buyerType = getBuyerType();
			const medicinePricing = pricingService.mapMedicinePricing(medicine);

			setCartItems((prevItems) =>
				prevItems.map((item) => {
					if (item.medicineId !== medicineId) return item;

					return pricingService.repriceCartItem({
						cartItem: {
							...item,
							currencyCode: medicine.currencyCode || item.currencyCode
						},
						medicinePricing,
						buyerType,
						quantity: overrides.quantity ?? item.quantity,
						packageType: overrides.packageType ?? item.packageType
					});
				})
			);
		} catch (error) {
			console.error('Failed to refresh cart pricing:', error);
		}
	};

	const refreshAllCartPricing = async () => {
		const ids = Array.from(new Set(cartItems.map((item) => item.medicineId).filter(Boolean)));
		for (const medicineId of ids) {
			await refreshCartItemPricing(medicineId);
		}
	};

	// Save cart to localStorage whenever it changes
	useEffect(() => {
		try {
			localStorage.setItem('mediq_cart', JSON.stringify(cartItems));
		} catch (error) {
			console.error('Failed to save cart to localStorage:', error);
		}
	}, [cartItems]);

	const addToCart = (medicine, quantity = 1, retailPrice, wholesalePrice, buyerType, currencyCode = 'USD', packageType = 'standard', bulkPrice, bulkMinQty = 1) => {
		setCartItems(prevItems => {
			const existingItem = prevItems.find(item => item.medicineId === medicine.id);
			const actualMedicineId = medicine.medicineId || medicine.id;
			const medicinePricing = {
				retailPrice,
				wholesalePrice,
				bulkPrice: bulkPrice ?? wholesalePrice,
				bulkMinQty
			};
			const nextQuantity = existingItem ? existingItem.quantity + quantity : quantity;
			const resolvedBasePrice = pricingService.resolveUnitPrice({
				buyerType,
				quantity: nextQuantity,
				packageType,
				...medicinePricing
			});

			if (existingItem) {
				return prevItems.map(item =>
					item.medicineId === medicine.id
						? {
							...item,
							quantity: nextQuantity,
							currencyCode,
							packageType,
							...medicinePricing,
							basePrice: resolvedBasePrice
						}
						: item
				);
			}
			return [
				...prevItems,
				{
					actualMedicineId,
					medicineId: medicine.id,
					name: medicine.name,
					category: medicine.category,
					imageUrl: medicine.imageUrl,
					vendor: medicine.vendor,
					vendorId: medicine.vendorId,
					quantity,
					retailPrice,
					wholesalePrice,
					bulkPrice: bulkPrice ?? wholesalePrice,
					bulkMinQty,
					packageType,
					buyerType,
					currencyCode,
					basePrice: resolvedBasePrice,
					addedAt: new Date().toISOString()
				}
			];
		});

		void refreshCartItemPricing(medicine.id, { quantity: quantity, packageType });
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
			prevItems.map(item =>
				item.medicineId === medicineId
					? {
						...item,
						quantity,
						basePrice: pricingService.resolveUnitPrice({
							buyerType: getBuyerType(),
							quantity,
							packageType: item.packageType,
							retailPrice: item.retailPrice,
							wholesalePrice: item.wholesalePrice,
							bulkPrice: item.bulkPrice,
							bulkMinQty: item.bulkMinQty
						})
					}
					: item
			)
		);

		void refreshCartItemPricing(medicineId, { quantity });
	};

	const updatePackageType = (medicineId, packageType) => {
		setCartItems((prevItems) =>
			prevItems.map((item) => {
				if (item.medicineId !== medicineId) return item;

				const normalizedPackageType = String(packageType || 'standard').toLowerCase() === 'bulk' ? 'bulk' : 'standard';
				return {
					...item,
					packageType: normalizedPackageType,
					basePrice: pricingService.resolveUnitPrice({
						buyerType: getBuyerType(),
						quantity: item.quantity,
						packageType: normalizedPackageType,
						retailPrice: item.retailPrice,
						wholesalePrice: item.wholesalePrice,
						bulkPrice: item.bulkPrice,
						bulkMinQty: item.bulkMinQty
					})
				};
			})
		);

		void refreshCartItemPricing(medicineId, { packageType });
	};

	const clearCart = () => {
		setCartItems([]);
	};

	const getTotalItems = () => {
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
		updatePackageType,
		refreshAllCartPricing,
		clearCart,
		getTotalItems,
		getTotalPrice
	};

	useEffect(() => {
		if (cartItems.length) {
			void refreshAllCartPricing();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
	const context = useContext(CartContext);
	if (!context) {
		throw new Error('useCart must be used within CartProvider');
	}
	return context;
};
