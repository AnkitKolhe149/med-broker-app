import React from 'react';
import { useNotification } from '../../context/NotificationContext';

function NotificationBar() {
	const { notification } = useNotification();

	if (!notification) return null;

	const isSuccess = notification.type === 'success';

	return (
		<div style={{
			...styles.bar,
			backgroundColor: isSuccess ? 'var(--success)' : 'var(--error)'
		}}>
			<span style={styles.icon}>{isSuccess ? '✓' : '⚠️'}</span>
			<span style={styles.message}>{notification.message}</span>
		</div>
	);
}

const styles = {
	bar: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
		color: 'white',
		padding: '0.75rem 1rem',
		borderRadius: 'var(--radius)',
		margin: '1rem auto 0',
		maxWidth: '1200px',
		boxShadow: 'var(--shadow-sm)'
	},
	icon: {
		fontWeight: '700'
	},
	message: {
		fontSize: '0.95rem'
	}
};

export default NotificationBar;
