import React, { createContext, useContext, useEffect, useState } from 'react';
import authService from '../services/auth.service';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const loadUser = async () => {
		setLoading(true);
		setError(null);
		try {
			if (!authService.isAuthenticated()) {
				setUser(null);
				return;
			}
			const userData = await authService.getCurrentUser();
			setUser(userData);
		} catch (err) {
			console.error('Failed to load user:', err);
			setError(err);
			setUser(null);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadUser();
	}, []);

	useEffect(() => {
		const handleAuthChanged = (event) => {
			const nextUser = event?.detail?.user ?? null;
			setUser(nextUser);
			setError(null);
			setLoading(false);
		};

		window.addEventListener('mediq:auth-changed', handleAuthChanged);
		return () => window.removeEventListener('mediq:auth-changed', handleAuthChanged);
	}, []);

	const value = {
		user,
		loading,
		error,
		refreshUser: loadUser
	};

	return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
	const context = useContext(UserContext);
	if (!context) {
		throw new Error('useUser must be used within UserProvider');
	}
	return context;
};
