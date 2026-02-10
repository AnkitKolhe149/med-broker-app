import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
	const [cartItems, setCartItems] = useState([]);

	// Load cart from localStorage on mount
	useEffect(() => {
		try {
			const savedCart = localStorage.getItem('medbroker_cart');
			if (savedCart) {
				setCartItems(JSON.parse(savedCart));
			}
		} catch (error) {
			console.error('Failed to load cart from localStorage:', error);
		}
	}, []);

	// Save cart to localStorage whenever it changes
	useEffect(() => {
		try {
			localStorage.setItem('medbroker_cart', JSON.stringify(cartItems));
		} catch (error) {
			console.error('Failed to save cart to localStorage:', error);
		}
	}, [cartItems]);

	const addToCart = (medicine, quantity = 1, retailPrice, wholesalePrice, buyerType) => {
		setCartItems(prevItems => {
			const existingItem = prevItems.find(item => item.medicineId === medicine.id);
			if (existingItem) {
				return prevItems.map(item =>
					item.medicineId === medicine.id
						? { ...item, quantity: item.quantity + quantity }
						: item
				);
			}
			return [
				...prevItems,
				{
					medicineId: medicine.id,
					name: medicine.name,
					category: medicine.category,
					vendor: medicine.vendor,
					vendorId: medicine.vendorId,
					quantity,
					retailPrice,
					wholesalePrice,
					buyerType,
					basePrice: buyerType === 'WHOLESALE' ? wholesalePrice : retailPrice,
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
			prevItems.map(item =>
				item.medicineId === medicineId
					? { ...item, quantity }
					: item
			)
		);
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
		clearCart,
		getTotalItems,
		getTotalPrice
	};

	return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
	const context = useContext(CartContext);
	if (!context) {
		throw new Error('useCart must be used within CartProvider');
	}
	return context;
};
