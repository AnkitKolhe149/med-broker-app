import React from 'react';
import TopNav from './TopNav';
import Footer from './Footer';
import NotificationBar from '../feedback/NotificationBar';

function AppShell({ children }) {
	return (
		<div style={styles.wrapper}>
			<TopNav />
			<NotificationBar />
			<main style={styles.main}>
				{children}
			</main>
			<Footer />
		</div>
	);
}

const styles = {
	wrapper: {
		display: 'flex',
		flexDirection: 'column',
		minHeight: '100vh'
	},
	main: {
		flex: 1,
		backgroundColor: 'var(--background)'
	}
};

export default AppShell;
