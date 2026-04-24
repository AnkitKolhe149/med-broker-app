import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const FavoritesContext = createContext();
const STORAGE_KEY = 'mediq_favorites';

const readStoredFavorites = () => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			return [];
		}

		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		console.error('Failed to load favorites:', error);
		return [];
	}
};

const normalizeFavorite = (medicine) => ({
	id: medicine.id,
	medicineId: medicine.medicineId || medicine.id,
	name: medicine.name || 'Medicine',
	category: medicine.category || 'General',
	imageUrl: medicine.imageUrl || medicine.images?.[0] || null,
	vendor: medicine.vendor || medicine.brand || 'Trusted vendor',
	retailPrice: Number(medicine.retailPrice || 0),
	wholesalePrice: Number(medicine.wholesalePrice || medicine.retailPrice || 0),
	currencyCode: medicine.currencyCode || 'USD',
	addedAt: medicine.addedAt || new Date().toISOString()
});

export const FavoritesProvider = ({ children }) => {
	const [favorites, setFavorites] = useState([]);

	useEffect(() => {
		setFavorites(readStoredFavorites());
	}, []);

	useEffect(() => {
		const handleAuthChanged = (event) => {
			if (event?.detail?.accountChanged) {
				setFavorites([]);
			}
		};

		window.addEventListener('mediq:auth-changed', handleAuthChanged);
		return () => window.removeEventListener('mediq:auth-changed', handleAuthChanged);
	}, []);

	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
		} catch (error) {
			console.error('Failed to save favorites:', error);
		}
	}, [favorites]);

	const isFavorited = (medicineId) => favorites.some((item) => item.medicineId === medicineId);

	const toggleFavorite = (medicine) => {
		const favorite = normalizeFavorite(medicine);
		setFavorites((prev) => {
			const exists = prev.some((item) => item.medicineId === favorite.medicineId);
			if (exists) {
				return prev.filter((item) => item.medicineId !== favorite.medicineId);
			}

			return [favorite, ...prev];
		});
	};

	const removeFavorite = (medicineId) => {
		setFavorites((prev) => prev.filter((item) => item.medicineId !== medicineId));
	};

	const value = useMemo(() => ({
		favorites,
		isFavorited,
		toggleFavorite,
		removeFavorite
	}), [favorites]);

	return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = () => {
	const context = useContext(FavoritesContext);
	if (!context) {
		throw new Error('useFavorites must be used within FavoritesProvider');
	}
	return context;
};