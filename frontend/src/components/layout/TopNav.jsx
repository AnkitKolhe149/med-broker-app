import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import authService from '../../services/auth.service';
import { useUser } from '../../context/UserContext';
import Avatar from '../common/Avatar';

function TopNav() {
	const navigate = useNavigate();
	const location = useLocation();
	const [urlSearchParams, setUrlSearchParams] = useSearchParams();
	const { getTotalItems } = useCart();
	const { user } = useUser();
	const [searchQuery, setSearchQuery] = useState('');
	const [showProfileMenu, setShowProfileMenu] = useState(false);
	const [showMobileMenu, setShowMobileMenu] = useState(false);
	const profileButtonRef = useRef(null);
	const profileMenuRef = useRef(null);

	const focusProfileMenuItem = (index) => {
		const menuButtons = profileMenuRef.current
			? Array.from(profileMenuRef.current.querySelectorAll('button.topnav-profile-menu-item'))
			: [];

		if (!menuButtons.length) return;

		const boundedIndex = Math.max(0, Math.min(index, menuButtons.length - 1));
		menuButtons[boundedIndex].focus();
	};

	const openProfileMenuAndFocus = (index = 0) => {
		setShowProfileMenu(true);
		window.requestAnimationFrame(() => focusProfileMenuItem(index));
	};

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
		if (location.pathname === '/customer/catalog') {
			setSearchQuery(urlSearchParams.get('search') || '');
		}
	}, [location.pathname, urlSearchParams]);

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
		setShowMobileMenu(false);
	};

	const handleClearSearch = () => {
		setSearchQuery('');

		if (location.pathname === '/customer/catalog' && urlSearchParams.get('search')) {
			const nextParams = new URLSearchParams(urlSearchParams);
			nextParams.delete('search');
			setUrlSearchParams(nextParams);
		}
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

	const handleProfileButtonKeyDown = (e) => {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			openProfileMenuAndFocus(0);
			return;
		}

		if (e.key === 'ArrowUp') {
			e.preventDefault();
			const menuButtons = profileMenuRef.current
				? Array.from(profileMenuRef.current.querySelectorAll('button.topnav-profile-menu-item'))
				: [];
			openProfileMenuAndFocus(Math.max(menuButtons.length - 1, 0));
			return;
		}

		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			if (showProfileMenu) {
				setShowProfileMenu(false);
			} else {
				openProfileMenuAndFocus(0);
			}
		}
	};

	const handleProfileMenuKeyDown = (e) => {
		const menuButtons = profileMenuRef.current
			? Array.from(profileMenuRef.current.querySelectorAll('button.topnav-profile-menu-item'))
			: [];

		if (!menuButtons.length) return;

		const currentIndex = menuButtons.findIndex((button) => button === document.activeElement);

		if (e.key === 'Escape') {
			e.preventDefault();
			setShowProfileMenu(false);
			profileButtonRef.current?.focus();
			return;
		}

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % menuButtons.length;
			menuButtons[nextIndex].focus();
			return;
		}

		if (e.key === 'ArrowUp') {
			e.preventDefault();
			const prevIndex = currentIndex < 0 ? menuButtons.length - 1 : (currentIndex - 1 + menuButtons.length) % menuButtons.length;
			menuButtons[prevIndex].focus();
			return;
		}

		if (e.key === 'Home') {
			e.preventDefault();
			menuButtons[0].focus();
			return;
		}

		if (e.key === 'End') {
			e.preventDefault();
			menuButtons[menuButtons.length - 1].focus();
		}
	};

	const profileMenuSections = [
		{
			title: 'Account',
			items: [
				{ label: 'Dashboard', path: '/customer/dashboard', icon: '🏠' },
				{ label: 'Profile Settings', path: '/customer/profile', icon: '⚙️' }
			]
		},
		{
			title: 'Shopping',
			items: [
				{ label: 'Browse Medicines', path: '/customer/catalog', icon: '💊' },
				{ label: 'Cart', path: '/customer/cart', icon: '🛒' },
				{ label: 'My Orders', path: '/customer/orders', icon: '📦' },
				{ label: 'Checkout', path: '/customer/checkout', icon: '✅' },
				{ label: 'Payment', path: '/customer/payment', icon: '💳' }
			]
		}
	];

	const totalItems = getTotalItems();
	const cartCountLabel = totalItems > 99 ? '99+' : String(totalItems);
	const hasAppliedSearch = location.pathname === '/customer/catalog' && Boolean(urlSearchParams.get('search')?.trim());
	const utilityLinks = [
		{ label: 'Help Center', path: '/customer/profile' },
		{ label: 'Track Orders', path: '/customer/orders' },
		{ label: 'Profile', path: '/customer/profile' }
	];
	const categoryLinks = [
		{ label: 'All Medicines', search: '' },
		{ label: 'Diabetes Care', search: 'diabetes' },
		{ label: 'Cardiac Care', search: 'cardiac' },
		{ label: 'Supplements', search: 'supplements' },
		{ label: 'Devices', search: 'device' },
		{ label: 'Personal Care', search: 'personal care' },
		{ label: 'Offers', path: '/customer/catalog' }
	];

	const openCategory = (item) => {
		if (item.path) {
			handleNavigate(item.path);
			return;
		}

		const search = item.search ? `?search=${encodeURIComponent(item.search)}` : '';
		handleNavigate(`/customer/catalog${search}`);
	};

	return (
		<header style={styles.header}>
			<div className="topnav-utility-bar" style={styles.utilityBar}>
				<div className="topnav-container" style={styles.utilityContainer}>
					<div style={styles.utilityLeft}>Trusted healthcare procurement platform</div>
					<div style={styles.utilityRight}>
						{utilityLinks.map((item) => (
							<button
								type="button"
								key={item.path}
								onClick={() => handleNavigate(item.path)}
								className="topnav-utility-link"
								style={styles.utilityLink}
							>
								{item.label}
							</button>
						))}
					</div>
				</div>
			</div>

			<div className="topnav-main-bar" style={styles.mainBar}>
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
									placeholder="Search medicines, brands or conditions"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="searchInput"
									style={styles.searchInput}
								/>
								{hasAppliedSearch && (
									<button
										type="button"
										onClick={handleClearSearch}
										className="searchClearButton"
										style={styles.searchClearButton}
										aria-label="Clear search"
										title="Clear search"
									>
										x
									</button>
								)}
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
									onKeyDown={handleProfileButtonKeyDown}
									className="profileButton"
									style={styles.profileButton}
									aria-expanded={showProfileMenu}
									aria-haspopup="menu"
									aria-controls="topnav-profile-menu"
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
											<span style={styles.fallbackProfileText}>👤 Account</span>
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
											id="topnav-profile-menu"
											className="topnav-profile-menu"
											data-profile-menu
											style={styles.profileMenu}
											role="menu"
											onKeyDown={handleProfileMenuKeyDown}
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

													{profileMenuSections.map((section, sectionIndex) => (
														<div key={section.title} className="topnav-profile-menu-section" style={styles.menuSection}>
															<p className="topnav-profile-menu-section-title" style={styles.menuSectionTitle}>{section.title}</p>
															{section.items.map((item) => (
																<button
																	type="button"
																	key={item.path}
																	className="topnav-profile-menu-item"
																	style={styles.menuItem}
																	onClick={() => handleNavigate(item.path)}
																	role="menuitem"
																>
																	<span className="topnav-profile-menu-item-icon" style={styles.menuItemIcon} aria-hidden="true">{item.icon}</span>
																	<span>{item.label}</span>
																</button>
															))}
															{sectionIndex < profileMenuSections.length - 1 && <div style={{ ...styles.menuDivider, marginTop: '0.55rem', marginBottom: '0.55rem' }} />}
														</div>
													))}

													<div style={{ ...styles.menuDivider, marginTop: '0.5rem', marginBottom: '0.5rem' }} />

													<button
														type="button"
														className="topnav-profile-menu-item topnav-profile-menu-logout"
														style={{ ...styles.menuItem, ...styles.logoutButton }}
														onClick={handleLogout}
														role="menuitem"
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
			</div>

			<div className="topnav-category-bar" style={styles.categoryBar}>
				<div className="topnav-container" style={styles.categoryContainer}>
					<nav className="topnav-category-nav" style={styles.categoryNav} aria-label="Medicine categories">
						{categoryLinks.map((item) => (
							<button
								type="button"
								key={item.label}
								onClick={() => openCategory(item)}
								className="topnav-category-item"
								style={styles.categoryItem}
							>
								{item.label}
							</button>
						))}
					</nav>
				</div>
			</div>
		</header>
	);
}

const styles = {
	header: {
		backgroundColor: 'transparent',
		position: 'sticky',
		top: 0,
		zIndex: 100,
		overflow: 'visible',
		contain: 'none'
	},
	utilityBar: {
		background: 'linear-gradient(90deg, rgba(12, 73, 50, 0.98) 0%, rgba(15, 93, 63, 0.98) 100%)',
		borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
	},
	utilityContainer: {
		maxWidth: '1320px',
		margin: '0 auto',
		padding: '0.38rem 1.25rem',
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: '1rem'
	},
	utilityLeft: {
		fontSize: '0.74rem',
		letterSpacing: '0.02em',
		color: 'rgba(231, 255, 244, 0.92)'
	},
	utilityRight: {
		display: 'flex',
		gap: '0.75rem',
		alignItems: 'center',
		flexWrap: 'wrap',
		justifyContent: 'flex-end'
	},
	utilityLink: {
		background: 'none',
		border: 'none',
		color: '#dcfce7',
		fontSize: '0.76rem',
		fontWeight: 600,
		cursor: 'pointer',
		padding: '0.1rem 0.25rem'
	},
	mainBar: {
		backgroundColor: 'rgba(255, 255, 255, 0.88)',
		backdropFilter: 'blur(10px)',
		borderBottom: '1px solid rgba(21, 115, 71, 0.16)',
		boxShadow: '0 4px 14px rgba(16, 32, 23, 0.08)',
		padding: '0.68rem 0'
	},
	container: {
		maxWidth: '1320px',
		margin: '0 auto',
		padding: '0 1.25rem',
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
		fontSize: '1.45rem',
		fontWeight: '700',
		color: 'var(--primary)',
		cursor: 'pointer',
		borderRadius: 'var(--radius)',
		padding: '0.45rem 0.2rem',
		letterSpacing: '0.2px',
		transition: 'transform 0.2s ease, color 0.2s ease'
	},
	hamburgerButton: {
		background: 'rgba(255, 255, 255, 0.86)',
		border: '1px solid rgba(21, 115, 71, 0.2)',
		padding: '0.35rem 0.7rem',
		borderRadius: 'var(--radius)',
		cursor: 'pointer',
		fontSize: '0.85rem',
		fontWeight: 600,
		color: 'var(--text-primary)',
		boxShadow: '0 2px 8px rgba(16, 32, 23, 0.08)'
	},
	centerSection: {
		flex: 1,
		minWidth: 0,
		maxWidth: '640px'
	},
	searchForm: {
		display: 'flex',
		gap: 0,
		borderRadius: 'var(--radius)',
		overflow: 'hidden',
		boxShadow: '0 2px 10px rgba(16, 32, 23, 0.08)'
	},
	searchInput: {
		flex: 1,
		padding: '0.7rem 0.95rem',
		border: '1px solid rgba(21, 115, 71, 0.2)',
		borderRadius: 'var(--radius) 0 0 var(--radius)',
		fontSize: '0.9rem',
		fontFamily: 'inherit',
		outline: 'none',
		backgroundColor: 'rgba(255, 255, 255, 0.92)'
	},
	searchClearButton: {
		padding: '0.7rem 0.85rem',
		backgroundColor: 'rgba(255, 255, 255, 0.92)',
		color: 'var(--text-secondary)',
		borderTop: '1px solid rgba(21, 115, 71, 0.2)',
		borderBottom: '1px solid rgba(21, 115, 71, 0.2)',
		borderLeft: 'none',
		borderRight: 'none',
		cursor: 'pointer',
		fontSize: '0.95rem',
		fontWeight: 700,
		lineHeight: 1
	},
	searchButton: {
		padding: '0.7rem 1rem',
		backgroundColor: 'var(--primary)',
		color: 'white',
		border: 'none',
		borderRadius: '0 var(--radius) var(--radius) 0',
		cursor: 'pointer',
		fontSize: '0.92rem',
		fontWeight: 600
	},
	rightSection: {
		display: 'flex',
		gap: '0.7rem',
		alignItems: 'center',
		flex: '0 0 auto'
	},
	cartButton: {
		position: 'relative',
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: '0.35rem',
		background: 'rgba(255, 255, 255, 0.86)',
		border: '1px solid rgba(21, 115, 71, 0.2)',
		cursor: 'pointer',
		padding: '0.5rem 1rem 0.5rem 0.82rem',
		minHeight: '40px',
		borderRadius: 'var(--radius)',
		overflow: 'visible',
		boxShadow: '0 2px 8px rgba(16, 32, 23, 0.08)',
		transition: 'transform 0.2s ease, box-shadow 0.2s ease'
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
		background: 'rgba(255, 255, 255, 0.88)',
		border: '1px solid rgba(21, 115, 71, 0.2)',
		cursor: 'pointer',
		padding: '4px 10px',
		borderRadius: 'var(--radius-full)',
		display: 'flex',
		alignItems: 'center',
		gap: '0.4rem',
		justifyContent: 'center',
		minHeight: '40px',
		boxShadow: '0 2px 8px rgba(16, 32, 23, 0.08)',
		transition: 'transform 0.2s ease, box-shadow 0.2s ease'
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
		backgroundColor: 'rgba(255, 255, 255, 0.96)',
		backdropFilter: 'blur(12px)',
		border: '1px solid rgba(21, 115, 71, 0.16)',
		borderRadius: '14px',
		boxShadow: '0 16px 36px rgba(16, 32, 23, 0.2)',
		minWidth: '320px',
		maxWidth: 'min(360px, calc(100vw - 1rem))',
		zIndex: 10000,
		overflow: 'hidden',
		paddingBottom: '0.25rem'
	},
	profileMenuHeader: {
		padding: '1rem',
		backgroundColor: 'rgba(21, 115, 71, 0.08)',
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
		borderTop: '1px solid var(--border-light)',
		margin: 0,
		padding: 0,
		height: '1px'
	},
	menuSection: {
		padding: '0 0.4rem'
	},
	menuSectionTitle: {
		margin: '0.7rem 0.6rem 0.4rem',
		fontSize: '0.72rem',
		fontWeight: 700,
		letterSpacing: '0.06em',
		textTransform: 'uppercase',
		color: 'var(--text-light)'
	},
	menuItem: {
		width: '100%',
		padding: '0.66rem 0.85rem',
		background: 'none',
		border: 'none',
		textAlign: 'left',
		cursor: 'pointer',
		fontSize: '0.9rem',
		color: 'var(--text-primary)',
		fontWeight: 500,
		transition: 'background-color 0.22s var(--ease-standard), color 0.22s var(--ease-standard), transform 0.16s var(--ease-standard)',
		display: 'flex',
		alignItems: 'center',
		gap: '0.6rem',
		borderRadius: '10px'
	},
	menuItemIcon: {
		width: '1.1rem',
		textAlign: 'center',
		fontSize: '0.95rem',
		lineHeight: 1
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
		zIndex: 9999,
		backgroundColor: 'rgba(16, 32, 23, 0.14)'
	},
	categoryBar: {
		background: 'linear-gradient(90deg, rgba(10, 58, 40, 0.98) 0%, rgba(12, 73, 50, 0.98) 100%)',
		borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
	},
	categoryContainer: {
		maxWidth: '1320px',
		margin: '0 auto',
		padding: '0 1.25rem'
	},
	categoryNav: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.38rem',
		overflowX: 'auto',
		padding: '0.36rem 0',
		scrollbarWidth: 'none'
	},
	categoryItem: {
		background: 'none',
		border: '1px solid transparent',
		borderRadius: '8px',
		color: '#e2f9ee',
		fontSize: '0.84rem',
		fontWeight: 600,
		padding: '0.4rem 0.62rem',
		cursor: 'pointer',
		whiteSpace: 'nowrap',
		transition: 'all 0.2s ease'
	}
};

export default TopNav;
