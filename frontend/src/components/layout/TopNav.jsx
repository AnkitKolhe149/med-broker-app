import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import authService from '../../services/auth.service';
import { useUser } from '../../context/UserContext';

function TopNav() {
	const navigate = useNavigate();
	const { getTotalItems } = useCart();
	const { user } = useUser();
	const [searchQuery, setSearchQuery] = useState('');
	const [showProfileMenu, setShowProfileMenu] = useState(false);
	const [showMobileMenu, setShowMobileMenu] = useState(false);

	const handleSearch = (e) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			navigate(`/customer/catalog?search=${encodeURIComponent(searchQuery)}`);
			setSearchQuery('');
		}
	};

	const handleLogout = () => {
		authService.logout();
		setShowProfileMenu(false);
		navigate('/login');
	};

	const handleNavigate = (path) => {
		navigate(path);
		setShowProfileMenu(false);
	};

	return (
		<header style={styles.header}>
			<div className="topnav-container" style={styles.container}>
				{/* Logo & Home */}
				<div style={styles.leftSection}>
					<button 
						onClick={() => navigate('/customer/dashboard')}
						style={styles.logo}
					>
						🏥 MedBroker
					</button>
				</div>

				{/* Hamburger Menu Button (Mobile Only) */}
				<button 
					className="hamburgerMenu"
					onClick={() => setShowMobileMenu(!showMobileMenu)}
					style={{
						display: 'none',
						background: 'none',
						border: 'none',
						fontSize: '1.5rem',
						cursor: 'pointer',
						padding: '0.5rem',
						marginLeft: 'auto'
					}}
				>
					{showMobileMenu ? '✕' : '☰'}
				</button>

				{/* Desktop Navigation */}
				<div className={`topnav-right ${showMobileMenu ? 'show' : ''}`} style={{...styles.desktopNav}}>
					{/* Search Bar - Only on catalog page */}
					<div style={styles.centerSection}>
						<form onSubmit={handleSearch} style={styles.searchForm}>
							<input
								type="text"
								placeholder="Search medicines..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								style={styles.searchInput}
							/>
							<button type="submit" style={styles.searchButton}>
								🔍
							</button>
						</form>
					</div>

					{/* Cart & Profile */}
					<div style={styles.rightSection}>
					{/* Cart Button */}
					<button
						onClick={() => navigate('/customer/cart')}
						style={styles.cartButton}
						title="View Cart"
					>
						<span style={styles.cartIcon}>🛒</span>
						{getTotalItems() > 0 && (
							<span style={styles.cartBadge}>{getTotalItems()}</span>
						)}
					</button>

					{/* Profile Dropdown */}
					<div style={styles.profileContainer}>
						<button
							onClick={() => setShowProfileMenu(!showProfileMenu)}
							style={styles.profileButton}
							title="Profile Menu"
						>
							👤
						</button>

						{showProfileMenu && (
							<div style={styles.profileMenu}>
								<div style={styles.profileMenuHeader}>
									<p style={styles.profileName}>{user?.customer?.fullName || user?.email}</p>
									<p style={styles.profileEmail}>{user?.email}</p>
									{user?.customer?.buyerType && (
										<span style={styles.buyerTypeBadge}>
											{user.customer.buyerType}
										</span>
									)}
								</div>
								<hr style={styles.menuDivider} />
								<button
									onClick={() => handleNavigate('/customer/dashboard')}
									style={styles.menuItem}
								>
									📊 Dashboard
								</button>
								<button
									onClick={() => handleNavigate('/customer/profile')}
									style={styles.menuItem}
								>
									⚙️ Profile Settings
								</button>
								<button
									onClick={() => handleNavigate('/customer/orders')}
									style={styles.menuItem}
								>
									📦 My Orders
								</button>
								<hr style={styles.menuDivider} />
								<button
									onClick={handleLogout}
									style={{ ...styles.menuItem, ...styles.logoutButton }}
								>
									🚪 Logout
								</button>
							</div>
						)}
					</div>
				</div>
				</div> {/* Close topnav-right */}
			</div>

			{/* Click outside to close menus */}
			{showProfileMenu && (
				<div
					style={styles.backdrop}
					onClick={() => setShowProfileMenu(false)}
				/>
			)}
			{showMobileMenu && (
				<div
					style={styles.backdrop}
					onClick={() => setShowMobileMenu(false)}
				/>
			)}
		</header>
	);
}

const styles = {
	header: {
		backgroundColor: 'var(--primary-light)',
		borderBottom: '1px solid var(--border)',
		padding: '1rem 0',
		position: 'sticky',
		top: 0,
		zIndex: 100,
		boxShadow: 'var(--shadow-sm)'
	},
	container: {
		maxWidth: '1200px',
		margin: '0 auto',
		padding: '0 1rem',
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: '2rem'
	},
	leftSection: {
		flex: '0 0 auto'
	},
	desktopNav: {
		display: 'flex',
		alignItems: 'center',
		gap: '2rem',
		flex: 1
	},
	logo: {
		background: 'none',
		border: 'none',
		fontSize: '1.5rem',
		fontWeight: '700',
		color: 'var(--primary)',
		cursor: 'pointer',
		borderRadius: 'var(--radius)',
		transition: 'background-color 0.2s',
		padding: '0.5rem 0'
	},
	centerSection: {
		flex: 1,
		minWidth: '300px',
		maxWidth: '400px'
	},
	searchForm: {
		display: 'flex',
		gap: '0',
		borderRadius: 'var(--radius)'
	},
	searchInput: {
		flex: 1,
		padding: '0.75rem 1rem',
		border: '1px solid var(--border)',
		borderRadius: 'var(--radius) 0 0 var(--radius)',
		fontSize: '0.9rem',
		fontFamily: 'inherit',
		outline: 'none',
		transition: 'border-color 0.2s',
		':focus': {
			borderColor: 'var(--primary)'
		}
	},
	searchButton: {
		padding: '0.75rem 1rem',
		backgroundColor: 'var(--primary)',
		color: 'white',
		border: 'none',
		borderRadius: '0 var(--radius) var(--radius) 0',
		cursor: 'pointer',
		fontSize: '1rem',
		transition: 'background-color 0.2s'
	},
	rightSection: {
		display: 'flex',
		gap: '1.5rem',
		alignItems: 'center',
		flex: '0 0 auto'
	},
	cartButton: {
		position: 'relative',
		background: 'none',
		border: 'none',
		fontSize: '1.5rem',
		cursor: 'pointer',
		padding: '0.5rem',
		transition: 'transform 0.2s'
	},
	cartIcon: {
		display: 'inline-block'
	},
	cartBadge: {
		position: 'absolute',
		top: '-8px',
		right: '-8px',
		backgroundColor: 'var(--error)',
		color: 'white',
		borderRadius: 'var(--radius-full)',
		width: '20px',
		height: '20px',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: '0.75rem',
		fontWeight: '600'
	},
	profileContainer: {
		position: 'relative'
	},
	profileButton: {
		background: 'none',
		border: 'none',
		fontSize: '1.5rem',
		cursor: 'pointer',
		padding: '0.5rem',
		transition: 'transform 0.2s'
	},
	profileMenu: {
		position: 'absolute',
		top: '100%',
		right: 0,
		marginTop: '0.5rem',
		backgroundColor: 'white',
		border: '1px solid var(--border)',
		borderRadius: 'var(--radius)',
		boxShadow: 'var(--shadow-lg)',
		minWidth: '250px',
		zIndex: 1000
	},
	profileMenuHeader: {
		padding: '1rem',
		backgroundColor: 'var(--primary-light)',
		borderTopLeftRadius: 'var(--radius)',
		borderTopRightRadius: 'var(--radius)'
	},
	profileName: {
		margin: '0',
		fontSize: '0.95rem',
		fontWeight: '600',
		color: 'var(--text-primary)'
	},
	profileEmail: {
		margin: '0.25rem 0 0.5rem 0',
		fontSize: '0.85rem',
		color: 'var(--text-secondary)'
	},
	buyerTypeBadge: {
		display: 'inline-block',
		backgroundColor: 'var(--primary)',
		color: 'white',
		padding: '0.25rem 0.75rem',
		borderRadius: 'var(--radius)',
		fontSize: '0.75rem',
		fontWeight: '600'
	},
	menuDivider: {
		border: 'none',
		borderTop: '1px solid var(--border)',
		margin: '0'
	},
	menuItem: {
		width: '100%',
		padding: '0.75rem 1rem',
		background: 'none',
		border: 'none',
		textAlign: 'left',
		cursor: 'pointer',
		fontSize: '0.9rem',
		color: 'var(--text-primary)',
		transition: 'background-color 0.2s'
	},
	logoutButton: {
		color: 'var(--error)',
		borderBottomLeftRadius: 'var(--radius)',
		borderBottomRightRadius: 'var(--radius)'
	},
	backdrop: {
		position: 'fixed',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: 999
	}
};

export default TopNav;
