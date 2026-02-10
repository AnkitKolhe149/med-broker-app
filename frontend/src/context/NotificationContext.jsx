import React, { createContext, useContext, useMemo, useState } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
	const [notification, setNotification] = useState(null);

	const showNotification = (type, message) => {
		setNotification({ type, message });
		setTimeout(() => setNotification(null), 3000);
	};

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
