import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
	const [notification, setNotification] = useState(null);
	const timeoutRef = useRef(null);

	const showNotification = (type, message) => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		setNotification({ type, message });
		timeoutRef.current = setTimeout(() => {
			setNotification(null);
			timeoutRef.current = null;
		}, 2000);
	};

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	const value = useMemo(() => ({
		notification,
		showSuccess: (message) => showNotification('success', message),
		showError: (message) => showNotification('error', message),
		clear: () => setNotification(null)
	}), [notification]);

	return (
		<NotificationContext.Provider value={value}>
			{children}
		</NotificationContext.Provider>
	);
};

export const useNotification = () => {
	const context = useContext(NotificationContext);
	if (!context) {
		throw new Error('useNotification must be used within NotificationProvider');
	}
	return context;
};
