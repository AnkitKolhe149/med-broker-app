import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import authService from '../../services/auth.service';
import { useUser } from '../../context/UserContext';
import Avatar from '../common/Avatar';

function TopNav() {
	const navigate = useNavigate();
	const { getTotalItems } = useCart();
	const { user } = useUser();
	const [searchQuery, setSearchQuery] = useState('');
	const [showProfileMenu, setShowProfileMenu] = useState(false);
	const [showMobileMenu, setShowMobileMenu] = useState(false);
	const profileButtonRef = useRef(null);
	const profileMenuRef = useRef(null);

	useEffect(() => {
		const handleClickOutside = (e) => {
			if (
				profileButtonRef.current
				&& profileMenuRef.current
				&& !profileButtonRef.current.contains(e.target)
				&& !profileMenuRef.current.contains(e.target)
			) {
				setShowProfileMenu(false);
			}
		};

		if (showProfileMenu) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => document.removeEventListener('mousedown', handleClickOutside);
		}
	}, [showProfileMenu]);

	useEffect(() => {
		if (showMobileMenu) {
			setShowProfileMenu(false);
		}
	}, [showMobileMenu]);

	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth > 992) {
				setShowMobileMenu(false);
			}
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const handleSearch = (e) => {
		e.preventDefault();
		if (!searchQuery.trim()) return;

		navigate(`/customer/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
		setSearchQuery('');
		setShowMobileMenu(false);
	};

	const handleLogout = () => {
		authService.logout();
		setShowProfileMenu(false);
		setShowMobileMenu(false);
		navigate('/login');
	};

	const handleNavigate = (path) => {
		navigate(path);
		setShowProfileMenu(false);
		setShowMobileMenu(false);
	};

	const quickLinks = [
		{ label: 'Dashboard', path: '/customer/dashboard' },
		{ label: 'Browse Medicines', path: '/customer/catalog' },
		{ label: 'Cart', path: '/customer/cart' },
		{ label: 'My Orders', path: '/customer/orders' },
		{ label: 'Checkout', path: '/customer/checkout' },
		{ label: 'Payment', path: '/customer/payment' },
		{ label: 'Profile Settings', path: '/customer/profile' }
	];

	const totalItems = getTotalItems();
	const cartCountLabel = totalItems > 99 ? '99+' : String(totalItems);

	return (
		<header style={styles.header}>
			<div className="topnav-container" style={styles.container}>
				<div style={styles.leftSection}>
					<button
						type="button"
						className="topnav-logo"
						onClick={() => navigate('/customer/dashboard')}
						style={styles.logo}
					>
						MedBroker
					</button>
				</div>

				<button
					type="button"
					className="hamburgerMenu"
					onClick={() => setShowMobileMenu((prev) => !prev)}
					style={styles.hamburgerButton}
					aria-label="Toggle mobile menu"
					aria-expanded={showMobileMenu}
				>
					{showMobileMenu ? '✕ Close' : '☰ Menu'}
				</button>

				<div className={`topnav-right ${showMobileMenu ? 'show' : ''}`}>
					<div className="centerSection" style={styles.centerSection}>
						<form onSubmit={handleSearch} className="searchForm" style={styles.searchForm}>
							<input
								type="text"
								placeholder="Search medicines..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="searchInput"
								style={styles.searchInput}
							/>
							<button type="submit" className="searchButton" style={styles.searchButton}>
								Search
							</button>
						</form>
					</div>

					<div className="topnav-actions" style={styles.rightSection}>
						<button
							type="button"
							onClick={() => handleNavigate('/customer/cart')}
							className="cartButton"
							style={styles.cartButton}
							title="View Cart"
						>
							<span style={styles.cartIcon}>🛒 Cart</span>
							{totalItems > 0 && <span style={styles.cartBadge}>{cartCountLabel}</span>}
						</button>

						<div className="topnav-profile-container" style={styles.profileContainer}>
							<button
								type="button"
								ref={profileButtonRef}
								data-profile-button
								onClick={() => setShowProfileMenu((prev) => !prev)}
								className="profileButton"
								style={styles.profileButton}
								aria-expanded={showProfileMenu}
								aria-haspopup="menu"
								title="Open profile menu"
							>
								{user?.customer?.fullName ? (
									<>
										<Avatar
											src={user?.customer?.profileImage}
											name={user?.customer?.fullName}
											size={36}
										/>
										<span style={styles.profileChevron}>v</span>
									</>
								) : (
									<>
										<span style={styles.fallbackProfileText}>👤 Profile</span>
										<span style={styles.profileChevron}>v</span>
									</>
								)}
							</button>

							{showProfileMenu && (
								<>
									<div
										style={styles.backdrop}
										onClick={() => setShowProfileMenu(false)}
										aria-hidden="true"
									/>
									<div
										ref={profileMenuRef}
										className="topnav-profile-menu"
										data-profile-menu
										style={styles.profileMenu}
									>
										{user ? (
											<>
												<div className="topnav-profile-menu-header" style={styles.profileMenuHeader}>
													<Avatar
														src={user?.customer?.profileImage}
														name={user?.customer?.fullName}
														size={44}
													/>
													<div>
														<p style={styles.profileName}>{user?.customer?.fullName || 'User'}</p>
														<p style={styles.profileEmail}>{user?.email}</p>
														{user?.customer?.buyerType && (
															<span style={styles.buyerTypeBadge}>{user.customer.buyerType}</span>
														)}
													</div>
												</div>
												<div style={styles.menuDivider} />

												{quickLinks.map((link) => (
													<button
														type="button"
														key={link.path}
														className="topnav-profile-menu-item"
														style={styles.menuItem}
														onClick={() => handleNavigate(link.path)}
													>
														{link.label}
													</button>
												))}

												<div style={{ ...styles.menuDivider, marginTop: '0.5rem', marginBottom: '0.5rem' }} />

												<button
													type="button"
													className="topnav-profile-menu-item topnav-profile-menu-logout"
													style={{ ...styles.menuItem, ...styles.logoutButton }}
													onClick={handleLogout}
												>
													🚪 Logout
												</button>
											</>
										) : (
											<div style={{ padding: '1rem', textAlign: 'center' }}>Loading...</div>
										)}
									</div>
								</>
							)}
						</div>
					</div>
				</div>
			</div>
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
		boxShadow: 'var(--shadow-sm)',
		overflow: 'visible',
		contain: 'none'
	},
	container: {
		maxWidth: '1200px',
		margin: '0 auto',
		padding: '0 1rem',
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: '1.25rem',
		overflow: 'visible',
		contain: 'none'
	},
	leftSection: {
		flex: '0 0 auto'
	},
	logo: {
		background: 'none',
		border: 'none',
		fontSize: '1.5rem',
		fontWeight: '700',
		color: 'var(--primary)',
		cursor: 'pointer',
		borderRadius: 'var(--radius)',
		padding: '0.5rem 0'
	},
	hamburgerButton: {
		background: 'none',
		border: '1px solid var(--border)',
		padding: '0.35rem 0.7rem',
		borderRadius: 'var(--radius)',
		cursor: 'pointer',
		fontSize: '0.85rem',
		fontWeight: 600,
		color: 'var(--text-primary)'
	},
	centerSection: {
		flex: 1,
		minWidth: 0,
		maxWidth: '520px'
	},
	searchForm: {
		display: 'flex',
		gap: 0,
		borderRadius: 'var(--radius)'
	},
	searchInput: {
		flex: 1,
		padding: '0.75rem 1rem',
		border: '1px solid var(--border)',
		borderRadius: 'var(--radius) 0 0 var(--radius)',
		fontSize: '0.9rem',
		fontFamily: 'inherit',
		outline: 'none'
	},
	searchButton: {
		padding: '0.75rem 1rem',
		backgroundColor: 'var(--primary)',
		color: 'white',
		border: 'none',
		borderRadius: '0 var(--radius) var(--radius) 0',
		cursor: 'pointer',
		fontSize: '0.95rem'
	},
	rightSection: {
		display: 'flex',
		gap: '0.85rem',
		alignItems: 'center',
		flex: '0 0 auto'
	},
	cartButton: {
		position: 'relative',
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: '0.35rem',
		background: 'none',
		border: '1px solid var(--border)',
		cursor: 'pointer',
		padding: '0.52rem 1.1rem 0.52rem 0.85rem',
		minHeight: '40px',
		borderRadius: 'var(--radius)',
		overflow: 'visible'
	},
	cartIcon: {
		display: 'inline-block',
		fontSize: '0.9rem',
		fontWeight: 600,
		lineHeight: 1
	},
	cartBadge: {
		position: 'absolute',
		top: '2px',
		right: '2px',
		backgroundColor: 'var(--error)',
		color: 'white',
		border: '2px solid var(--surface)',
		borderRadius: '999px',
		minWidth: '20px',
		height: '20px',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: '0.68rem',
		fontWeight: '700',
		lineHeight: 1,
		padding: '0 5px',
		boxShadow: '0 3px 8px rgba(16, 32, 23, 0.25)',
		letterSpacing: '0.2px',
		pointerEvents: 'none'
	},
	profileContainer: {
		position: 'relative'
	},
	profileButton: {
		background: 'none',
		border: '1px solid var(--border)',
		cursor: 'pointer',
		padding: '4px 10px',
		borderRadius: 'var(--radius-full)',
		display: 'flex',
		alignItems: 'center',
		gap: '0.4rem',
		justifyContent: 'center',
		minHeight: '40px'
	},
	fallbackProfileText: {
		fontSize: '0.85rem',
		fontWeight: 600,
		color: 'var(--text-primary)'
	},
	profileChevron: {
		fontSize: '0.8rem',
		color: 'var(--text-secondary)',
		lineHeight: 1
	},
	profileMenu: {
		position: 'absolute',
		top: 'calc(100% + 0.5rem)',
		right: 0,
		backgroundColor: 'white',
		border: '1px solid var(--border)',
		borderRadius: '8px',
		boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
		minWidth: '320px',
		maxWidth: 'min(360px, calc(100vw - 1rem))',
		zIndex: 10000,
		overflow: 'hidden'
	},
	profileMenuHeader: {
		padding: '1rem',
		backgroundColor: 'var(--primary-light)',
		display: 'flex',
		alignItems: 'center',
		gap: '1rem'
	},
	profileName: {
		margin: 0,
		fontSize: '0.95rem',
		fontWeight: 600,
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
		fontWeight: 600
	},
	menuDivider: {
		border: 'none',
		borderTop: '1px solid var(--border)',
		margin: 0,
		padding: 0,
		height: '1px'
	},
	menuItem: {
		width: '100%',
		padding: '0.85rem 1rem',
		background: 'none',
		border: 'none',
		textAlign: 'left',
		cursor: 'pointer',
		fontSize: '0.95rem',
		color: 'var(--text-primary)',
		fontWeight: 500
	},
	logoutButton: {
		color: 'var(--error)'
	},
	backdrop: {
		position: 'fixed',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: 9999
	}
};

export default TopNav;
