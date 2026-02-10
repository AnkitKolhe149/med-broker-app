import React from 'react';
import { useNavigate } from 'react-router-dom';

function Footer() {
	const navigate = useNavigate();
	const currentYear = new Date().getFullYear();

	return (
		<footer style={styles.footer}>
			<div style={styles.container}>
				<div style={styles.grid}>
					{/* About Section */}
					<div style={styles.column}>
						<h3 style={styles.columnTitle}>🏥 MedBroker</h3>
						<p style={styles.columnDescription}>
							Your trusted medicine marketplace connecting patients with verified pharmacies and vendors.
						</p>
						<div style={styles.socialLinks}>
							<a href="#" style={styles.socialLink} title="Facebook">f</a>
							<a href="#" style={styles.socialLink} title="Twitter">𝕏</a>
							<a href="#" style={styles.socialLink} title="LinkedIn">in</a>
							<a href="#" style={styles.socialLink} title="Instagram">📷</a>
						</div>
					</div>

					{/* Quick Links */}
					<div style={styles.column}>
						<h3 style={styles.columnTitle}>Quick Links</h3>
						<ul style={styles.linkList}>
							<li><button onClick={() => navigate('/customer/catalog')} style={styles.link}>Browse Medicines</button></li>
							<li><button onClick={() => navigate('/customer/orders')} style={styles.link}>My Orders</button></li>
							<li><button onClick={() => navigate('/customer/dashboard')} style={styles.link}>Dashboard</button></li>
							<li><a href="#" style={styles.link}>Promotions</a></li>
						</ul>
					</div>

					{/* Support */}
					<div style={styles.column}>
						<h3 style={styles.columnTitle}>Support</h3>
						<ul style={styles.linkList}>
							<li><a href="mailto:support@medbroker.com" style={styles.link}>Contact Us</a></li>
							<li><a href="#" style={styles.link}>Help Center</a></li>
							<li><a href="#" style={styles.link}>Track Order</a></li>
							<li><a href="#" style={styles.link}>Return Policy</a></li>
						</ul>
					</div>

					{/* Legal */}
					<div style={styles.column}>
						<h3 style={styles.columnTitle}>Legal</h3>
						<ul style={styles.linkList}>
							<li><a href="#" style={styles.link}>Privacy Policy</a></li>
							<li><a href="#" style={styles.link}>Terms of Service</a></li>
							<li><a href="#" style={styles.link}>Cookie Policy</a></li>
							<li><a href="#" style={styles.link}>Disclaimer</a></li>
						</ul>
					</div>
				</div>

				{/* Bottom Section */}
				<div style={styles.bottomSection}>
					<div style={styles.bottomContent}>
						<p style={styles.copyright}>
							© {currentYear} MedBroker. All rights reserved.
						</p>
						<div style={styles.certifications}>
							<span style={styles.certification}>🔒 Secure</span>
							<span style={styles.certification}>✓ Verified Vendors</span>
							<span style={styles.certification}>📋 Licensed</span>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}

const styles = {
	footer: {
		backgroundColor: 'var(--primary)',
		color: 'white',
		paddingTop: '3rem',
		paddingBottom: '2rem',
		marginTop: 'auto'
	},
	container: {
		maxWidth: '1200px',
		margin: '0 auto',
		padding: '0 1rem'
	},
	grid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
		gap: '2rem',
		marginBottom: '2rem',
		paddingBottom: '2rem',
		borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
	},
	column: {
		display: 'flex',
		flexDirection: 'column'
	},
	columnTitle: {
		fontSize: '1rem',
		fontWeight: '600',
		marginBottom: '1rem',
		color: 'white'
	},
	columnDescription: {
		fontSize: '0.9rem',
		lineHeight: '1.6',
		color: 'rgba(255, 255, 255, 0.9)',
		marginBottom: '1rem'
	},
	socialLinks: {
		display: 'flex',
		gap: '1rem'
	},
	socialLink: {
		width: '40px',
		height: '40px',
		borderRadius: 'var(--radius)',
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		color: 'white',
		border: 'none',
		cursor: 'pointer',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: '0.9rem',
		transition: 'background-color 0.2s',
		textDecoration: 'none'
	},
	linkList: {
		listStyle: 'none',
		padding: 0,
		margin: 0,
		display: 'flex',
		flexDirection: 'column',
		gap: '0.75rem'
	},
	link: {
		background: 'none',
		border: 'none',
		color: 'rgba(255, 255, 255, 0.9)',
		cursor: 'pointer',
		fontSize: '0.9rem',
		padding: 0,
		textAlign: 'left',
		textDecoration: 'none',
		transition: 'color 0.2s'
	},
	bottomSection: {
		paddingTop: '1rem'
	},
	bottomContent: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		flexWrap: 'wrap',
		gap: '1rem'
	},
	copyright: {
		fontSize: '0.85rem',
		color: 'rgba(255, 255, 255, 0.8)',
		margin: 0
	},
	certifications: {
		display: 'flex',
		gap: '1.5rem',
		fontSize: '0.85rem',
		color: 'rgba(255, 255, 255, 0.8)',
		flexWrap: 'wrap'
	},
	certification: {
		whiteSpace: 'nowrap'
	}
};

export default Footer;
