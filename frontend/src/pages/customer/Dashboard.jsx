import React from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';
import { useUser } from '../../context/UserContext';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/currency';
import styles from './Dashboard.module.css';

function CustomerDashboard() {
	const navigate = useNavigate();
	const { user } = useUser();
	const { getTotalItems } = useCart();

	// Mock data
	const activeOrders = [
		{ id: 'ORD1705346291567', status: 'In Transit', eta: '2 days' },
		{ id: 'ORD1705259891890', status: 'Confirmed', eta: '4 days' }
	];

	const recentOrders = [
		{ id: 'ORD1705432891234', date: '2024-01-16', total: 1250.50, items: 3, status: 'Delivered' },
		{ id: 'ORD1705346291567', date: '2024-01-10', total: 850.00, items: 2, status: 'Delivered' },
		{ id: 'ORD1705259891890', date: '2024-01-05', total: 320.75, items: 5, status: 'Delivered' }
	];

	const currencyCode = localStorage.getItem('preferredCurrency') || 'USD';
	const formatPrice = (value) => formatCurrency(value, currencyCode, true);
	const savedAddress = user?.customer
		? `${user.customer.address || ''}, ${user.customer.city || ''}, ${user.customer.state || ''} ${user.customer.zipCode || ''}`
		: 'No saved address';
	const displayName = user?.customer?.fullName || user?.email || 'Customer';
	const buyerType = user?.customer?.buyerType || 'RETAIL';

	// Stats
	const totalOrders = 15;
	const totalSpent = 6850.25;
	const avgOrderValue = (totalSpent / totalOrders).toFixed(2);

	const handleLogout = () => {
		authService.logout();
		navigate('/login');
	};

	const orderStages = ['Ordered', 'Confirmed', 'Shipped', 'Delivered'];

	const getOrderStageIndex = (status = '') => {
		const normalized = status.toLowerCase();

		if (normalized.includes('delivered')) return 3;
		if (normalized.includes('ship') || normalized.includes('transit')) return 2;
		if (normalized.includes('confirm') || normalized.includes('pack')) return 1;
		return 0;
	};

	return (
		<main className={styles.dashboardMain}>
			{/* Left Sidebar */}
			<aside className={styles.sidebar}>
				<div className={`${styles.sidebarCard} card`}>
					<div className={styles.profileSection}>
						<div className={styles.largeAvatar}>{displayName.charAt(0).toUpperCase()}</div>
						<h2 className={styles.profileName}>{displayName}</h2>
						<p className={styles.profileEmail}>{user?.email}</p>
						
						<div className={styles.statBadges}>
							<div className={styles.badge}>
								<span className={styles.badgeValue}>{totalOrders}</span>
								<span className={styles.badgeLabel}>Orders</span>
							</div>
							<div className={styles.badge}>
								<span className={styles.badgeValue}>{getTotalItems() || 0}</span>
								<span className={styles.badgeLabel}>In Cart</span>
							</div>
							<div className={styles.badge}>
								<span className={styles.badgeValue}>{buyerType}</span>
								<span className={styles.badgeLabel}>Type</span>
							</div>
						</div>

						<div className={styles.profileActions}>
							<button className="button" onClick={() => navigate('/customer/profile')}>Edit Profile</button>
							<button className="button-outline" onClick={handleLogout}>Logout</button>
						</div>
					</div>

					<div className={styles.sidebarDivider}></div>

					<div className={styles.addressSection}>
						<p className={styles.sectionLabel}>Delivery address</p>
						<p className={styles.addressText}>{savedAddress}</p>
						<button className="button-outline" onClick={() => navigate('/customer/profile')}>Update</button>
					</div>

					<div className={styles.sidebarDivider}></div>

					<nav className={styles.sidebarNav}>
						<button 
							className={styles.navItem}
							onClick={() => navigate('/customer/catalog')}
						>
							<span>💊</span> Browse Medicines
						</button>
						<button 
							className={styles.navItem}
							onClick={() => navigate('/customer/orders')}
						>
							<span>📦</span> My Orders
						</button>
						<button 
							className={styles.navItem}
							onClick={() => navigate('/customer/prescriptions')}
						>
							<span>📋</span> Prescriptions
						</button>
						<button 
							className={styles.navItem}
							onClick={() => navigate('/customer/favorites')}
						>
							<span>❤️</span> Favorites
						</button>
					</nav>
				</div>
			</aside>

			{/* Main Content */}
			<div className={styles.mainContent}>
				<section className={styles.workspaceHero}>
					<div className={styles.workspaceHeroLeft}>
						<p className={styles.headerLabel}>Welcome back</p>
						<h1 className={styles.workspaceTitle}>Your Pharmacy Dashboard</h1>
						<p className={styles.workspaceText}>
							Track orders, review purchases, and manage your medicines from a calm, organized workspace.
						</p>
						<div className={styles.heroChips}>
							<span className={styles.heroChip}>Buyer: {buyerType}</span>
							<span className={styles.heroChip}>Currency: {currencyCode}</span>
							<span className={styles.heroChip}>{activeOrders.length} active orders</span>
						</div>
						<div className={styles.heroActionsRow}>
							<button className="button" onClick={() => navigate('/customer/catalog')}>Browse medicines</button>
							<button className="button-outline" onClick={() => navigate('/customer/orders')}>Review orders</button>
						</div>
					</div>

					<div className={styles.workspaceHeroRight}>
						<div className={styles.heroMetricCard}>
							<p>Monthly spend</p>
							<strong>{formatPrice(totalSpent)}</strong>
						</div>
						<div className={styles.heroMetricCard}>
							<p>Last order</p>
							<strong>{formatPrice(recentOrders[0]?.total || 0)}</strong>
						</div>
						<div className={styles.heroMetricCard}>
							<p>Delivery address</p>
							<strong>{savedAddress}</strong>
						</div>
					</div>
				</section>

				{/* Header */}
				<header className={styles.contentHeader}>
					<div>
						<p className={styles.sectionKicker}>Overview</p>
						<h2 className={styles.headerTitle}>A clear view of your activity</h2>
					</div>
					<div className={styles.headerRight}>
						<span className={styles.currencyBadge}>{currencyCode}</span>
					</div>
				</header>

				{/* Quick Stats */}
				<section className={styles.quickStats}>
					<div className={`${styles.statBox} card`}>
						<div className={styles.statBoxIcon} style={{ backgroundColor: 'rgba(21, 115, 71, 0.15)' }}>📈</div>
						<div>
							<p className={styles.statBoxLabel}>Total Spent</p>
							<p className={styles.statBoxValue}>{formatPrice(totalSpent)}</p>
						</div>
					</div>

					<div className={`${styles.statBox} card`}>
						<div className={styles.statBoxIcon} style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}>📦</div>
						<div>
							<p className={styles.statBoxLabel}>Avg. Order</p>
							<p className={styles.statBoxValue}>{formatPrice(avgOrderValue)}</p>
						</div>
					</div>

					<div className={`${styles.statBox} card`}>
						<div className={styles.statBoxIcon} style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)' }}>⏱️</div>
						<div>
							<p className={styles.statBoxLabel}>Active Orders</p>
							<p className={styles.statBoxValue}>{activeOrders.length}</p>
						</div>
					</div>

					<div className={`${styles.statBox} card`}>
						<div className={styles.statBoxIcon} style={{ backgroundColor: 'rgba(236, 72, 153, 0.15)' }}>✨</div>
						<div>
							<p className={styles.statBoxLabel}>Member Since</p>
							<p className={styles.statBoxValue}>2024</p>
						</div>
					</div>
				</section>

				{/* Active Orders Section */}
				<section className={styles.ordersSection}>
					<div className={styles.sectionHeaderMain}>
						<div>
							<h3 className={styles.sectionTitleMain}>Active Orders</h3>
							<p className={styles.sectionSubtitle}>Track your current deliveries</p>
						</div>
						<button className="button-outline" onClick={() => navigate('/customer/orders')}>View all</button>
					</div>

					<div className={styles.ordersList}>
						{activeOrders.map((order) => (
							<div key={order.id} className={`${styles.orderCard} card`}>
								{(() => {
									const stageIndex = getOrderStageIndex(order.status);
									return (
										<>
								<div className={styles.orderCardTop}>
									<div>
										<p className={styles.orderId}>{order.id}</p>
										<p className={styles.orderEta}>Estimated: {order.eta}</p>
									</div>
									<span className={`badge badge-success`}>{order.status}</span>
								</div>
										<div className={styles.stageRow}>
											{orderStages.map((stage, idx) => (
												<React.Fragment key={`${order.id}-${stage}`}>
													<div className={styles.stageItem}>
														<span className={`${styles.stageDot} ${idx <= stageIndex ? styles.stageDotActive : ''}`}></span>
														<span className={`${styles.stageText} ${idx <= stageIndex ? styles.stageTextActive : ''}`}>{stage}</span>
													</div>
													{idx < orderStages.length - 1 && (
														<span className={`${styles.stageConnector} ${idx < stageIndex ? styles.stageConnectorActive : ''}`}></span>
													)}
												</React.Fragment>
											))}
										</div>
										</>
									);
								})()}
							</div>
						))}
					</div>
				</section>

				{/* Recent Purchases */}
				<section className={styles.recentSection}>
					<div className={styles.sectionHeaderMain}>
						<div>
							<h3 className={styles.sectionTitleMain}>Recent Purchases</h3>
							<p className={styles.sectionSubtitle}>Your order history</p>
						</div>
					</div>

					<div className={styles.purchasesList}>
						{recentOrders.map((order) => (
							<div key={order.id} className={`${styles.purchaseItem} card`}>
								<div className={styles.purchaseLeft}>
									<p className={styles.purchaseOrderId}>{order.id}</p>
									<p className={styles.purchaseDate}>{new Date(order.date).toLocaleDateString('en-IN')}</p>
								</div>
								<div className={styles.purchaseMiddle}>
									<p className={styles.purchaseItems}>{order.items} items</p>
									<span className={`badge badge-info`}>{order.status}</span>
								</div>
								<div className={styles.purchaseRight}>
									<p className={styles.purchaseTotal}>{formatPrice(order.total)}</p>
								</div>
							</div>
						))}
					</div>
				</section>

				{/* Wholesale Banner */}
				{buyerType === 'WHOLESALE' && (
					<section className={styles.promoBanner}>
						<div className={styles.promoBannerContent}>
							<span className={styles.promoIcon}>🎁</span>
							<div>
								<h4>Wholesale Benefits Active</h4>
								<p>You are eligible for bulk pricing discounts and priority support on qualifying orders.</p>
							</div>
							<button className="button" onClick={() => navigate('/customer/catalog')}>Shop Wholesale</button>
						</div>
					</section>
				)}
			</div>

		</main>
	);
}

export default CustomerDashboard;