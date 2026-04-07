import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Check, ClipboardList, Camera } from 'lucide-react';

function Footer() {
	const navigate = useNavigate();
	const currentYear = new Date().getFullYear();

	return (
		<footer style={styles.footer}>
			<div style={styles.container}>
				<div style={styles.grid}>
					{/* About Section */}
					<div style={styles.column}>
						<h3 style={styles.columnTitle}>medIQ</h3>
						<p style={styles.columnDescription}>
							Your trusted medicine marketplace connecting patients with verified pharmacies and vendors.
						</p>
						<div style={styles.socialLinks}>
							<a href="#" style={styles.socialLink} title="Facebook">f</a>
							<a href="#" style={styles.socialLink} title="Twitter">𝕏</a>
							<a href="#" style={styles.socialLink} title="LinkedIn">in</a>
							<a href="#" style={styles.socialLink} title="Instagram"><Camera size={14} /></a>
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
							<li><a href="mailto:support@mediq.com" style={styles.link}>Contact Us</a></li>
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
							© {currentYear} MedIQ. All rights reserved.
						</p>
						<div style={styles.certifications}>
							<span style={styles.certification}><ShieldCheck size={14} strokeWidth={1.5} /> Secure</span>
							<span style={styles.certification}><Check size={14} strokeWidth={1.5} /> Verified Vendors</span>
							<span style={styles.certification}><ClipboardList size={14} strokeWidth={1.5} /> Licensed</span>
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
		paddingTop: '1.75rem',
		paddingBottom: '1rem',
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
		gap: '1.25rem',
		marginBottom: '1.25rem',
		paddingBottom: '1.25rem',
		borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
	},
	column: {
		display: 'flex',
		flexDirection: 'column'
	},
	columnTitle: {
		fontSize: '1rem',
		fontWeight: '600',
		marginBottom: '0.6rem',
		color: 'white'
	},
	columnDescription: {
		fontSize: '0.85rem',
		lineHeight: '1.45',
		color: 'rgba(255, 255, 255, 0.9)',
		marginBottom: '0.75rem'
	},
	socialLinks: {
		display: 'flex',
		gap: '0.6rem'
	},
	socialLink: {
		width: '34px',
		height: '34px',
		borderRadius: 'var(--radius)',
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		color: 'white',
		border: 'none',
		cursor: 'pointer',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: '0.8rem',
		transition: 'background-color 0.2s',
		textDecoration: 'none'
	},
	linkList: {
		listStyle: 'none',
		padding: 0,
		margin: 0,
		display: 'flex',
		flexDirection: 'column',
		gap: '0.45rem'
	},
	link: {
		background: 'none',
		border: 'none',
		color: 'rgba(255, 255, 255, 0.9)',
		cursor: 'pointer',
		fontSize: '0.9rem',
		lineHeight: '1.35',
		padding: 0,
		textAlign: 'left',
		textDecoration: 'none',
		transition: 'color 0.2s'
	},
	bottomSection: {
		paddingTop: '0.5rem'
	},
	bottomContent: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		flexWrap: 'wrap',
		gap: '0.6rem'
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
