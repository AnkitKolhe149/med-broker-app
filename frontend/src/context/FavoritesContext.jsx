import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useUser } from './UserContext';
import favoritesService from '../services/favorites.service';

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
	inventoryId: medicine.inventoryId || medicine.id,
	name: medicine.name || 'Medicine',
	category: medicine.category || 'General',
	imageUrl: medicine.imageUrl || medicine.images?.[0] || null,
	vendor: medicine.vendor || medicine.brand || 'Trusted vendor',
	retailPrice: Number(medicine.retailPrice || 0),
	wholesalePrice: Number(medicine.wholesalePrice || medicine.retailPrice || 0),
	currencyCode: medicine.currencyCode || 'USD',
	addedAt: medicine.addedAt || new Date().toISOString()
});

const mapServerFavorite = (item) => ({
	id: item.id,
	medicineId: item.medicineId || item.medicine?.id || item.id,
	inventoryId: item.inventoryId || item.id,
	name: item.name || item.medicine?.name || 'Medicine',
	category: item.category || item.medicine?.category || 'General',
	imageUrl: item.imageUrl || item.medicine?.imageUrl || null,
	vendor: item.vendor || item.medicine?.brand || 'Trusted vendor',
	retailPrice: Number(item.retailPrice || 0),
	wholesalePrice: Number(item.wholesalePrice || item.retailPrice || 0),
	currencyCode: item.currencyCode || 'INR',
	addedAt: item.addedAt || new Date().toISOString()
});

export const FavoritesProvider = ({ children }) => {
	const [favorites, setFavorites] = useState([]);
	const { user } = useUser();

	useEffect(() => {
		const load = async () => {
			if (user && user.id) {
				try {
					const local = readStoredFavorites();
					if (local.length) {
						await Promise.allSettled(local.map((item) => favoritesService.addFavorite(item.medicineId || item.id)));
						localStorage.removeItem(STORAGE_KEY);
					}

					const res = await favoritesService.getFavorites();
					setFavorites((res.data || []).map(mapServerFavorite));
					return;
				} catch (e) { console.warn('Failed to load favorites from server', e); }
			}
			setFavorites(readStoredFavorites());
		};
		load();
	}, [user?.id]);

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
		if (user && user.id) return;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
	}, [favorites, user?.id]);

	const isFavorited = (medicineId) => favorites.some((item) => item.medicineId === medicineId || item.inventoryId === medicineId);

	const toggleFavorite = async (medicine) => {
		const favorite = normalizeFavorite(medicine);
		const exists = favorites.find((item) => (
			item.medicineId === favorite.medicineId
			|| item.inventoryId === favorite.medicineId
			|| item.medicineId === favorite.inventoryId
			|| item.inventoryId === favorite.inventoryId
		));

		if (exists) {
			setFavorites((prev) => prev.filter((item) => item.medicineId !== favorite.medicineId));
			if (user && user.id && exists.id) {
				try { await favoritesService.removeFavorite(exists.id); } catch (error) { console.warn('Failed to remove favorite', error); }
			}
			return;
		}

		setFavorites((prev) => [favorite, ...prev]);
		if (user && user.id) {
			try {
				const created = await favoritesService.addFavorite(favorite.medicineId);
				if (created?.data?.id) {
					setFavorites((prev) => prev.map((item) => (
						item.medicineId === favorite.medicineId ? { ...item, id: created.data.id } : item
					)));
				}
			} catch (error) {
				console.warn('Failed to add favorite', error);
			}
		}
	};

	const removeFavorite = async (medicineId) => {
		const existing = favorites.find((item) => item.medicineId === medicineId || item.inventoryId === medicineId);
		setFavorites((prev) => prev.filter((item) => item.medicineId !== medicineId && item.inventoryId !== medicineId));
		if (user && user.id && existing?.id) {
			try { await favoritesService.removeFavorite(existing.id); } catch (error) { console.warn('Failed to remove favorite', error); }
		}
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