import React from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';
import { useUser } from '../../context/UserContext';
import { formatCurrency } from '../../utils/currency';
import styles from './Dashboard.module.css';

function CustomerDashboard() {
	const navigate = useNavigate();
	const { user } = useUser();

	const activeOrders = [
		{ id: 'ORD1705346291567', status: 'In Transit', eta: '2 days' },
		{ id: 'ORD1705259891890', status: 'Confirmed', eta: '4 days' }
	];
	const lastOrder = {
		id: 'ORD1705432891234',
		date: '2024-01-16',
		total: 1250.50,
		items: 3
	};
	const currencyCode = localStorage.getItem('preferredCurrency') || 'USD';
	const formatPrice = (value) => formatCurrency(value, currencyCode, true);
	const savedAddress = user?.customer
		? `${user.customer.address || ''}, ${user.customer.city || ''}, ${user.customer.state || ''} ${user.customer.zipCode || ''}`
		: 'No saved address';
	const displayName = user?.customer?.fullName || user?.email || 'Customer';
	const buyerType = user?.customer?.buyerType || 'N/A';
	const orderStatusLabel = activeOrders[0]?.status || 'No active orders';

	const handleLogout = () => {
		authService.logout();
		navigate('/login');
	};

	return (
		<main className={`page ${styles.dashboardPage}`}>
			<div className={`container ${styles.dashboardContainer}`}>
				<header className={`${styles.heroCard} card`}>
					<div className={styles.heroLeft}>
						<p className={styles.kicker}>Customer workspace</p>
						<h1 className={styles.heroTitle}>Good to see you, {displayName}</h1>
						<p className={styles.heroText}>
							Track orders, manage your address, and browse medicines from one simple dashboard.
						</p>
						<div className={styles.heroPills}>
							<span className={styles.heroPill}>Buyer type: {buyerType}</span>
							<span className={styles.heroPill}>Preferred currency: {currencyCode}</span>
						</div>
					</div>

					<div className={styles.heroRight}>
						<div className={styles.accountCard}>
							<div className={styles.avatar}>{displayName.charAt(0).toUpperCase()}</div>
							<div>
								<p className={styles.accountLabel}>Signed in as</p>
								<p className={styles.accountName}>{displayName}</p>
								<p className={styles.accountMeta}>{user?.email}</p>
							</div>
						</div>
						<div className={styles.heroActions}>
							<button className="button" onClick={() => navigate('/customer/catalog')}>Browse medicines</button>
							<button className="button-outline" onClick={handleLogout}>Logout</button>
						</div>
					</div>
				</header>

				<section className={styles.statsGrid}>
					<div className={`${styles.statCard} card`}>
						<p className={styles.statLabel}>Active orders</p>
						<p className={styles.statValue}>{activeOrders.length}</p>
						<p className={styles.statHint}>{orderStatusLabel} · fastest ETA {activeOrders[0]?.eta}</p>
					</div>
					<div className={`${styles.statCard} card`}>
						<p className={styles.statLabel}>Last order total</p>
						<p className={styles.statValue}>{formatPrice(lastOrder.total)}</p>
						<p className={styles.statHint}>{lastOrder.items} items · placed {new Date(lastOrder.date).toLocaleDateString('en-IN')}</p>
					</div>
					<div className={`${styles.statCard} card`}>
						<p className={styles.statLabel}>Saved address</p>
						<p className={styles.statValueSmall}>{savedAddress}</p>
						<p className={styles.statHint}>Used for delivery and order confirmation</p>
					</div>
					<div className={`${styles.statCard} card`}>
						<p className={styles.statLabel}>Profile</p>
						<p className={styles.statValueSmall}>Manage account details</p>
						<p className={styles.statHint}>Update contact and buyer settings anytime</p>
					</div>
				</section>

				<section className={styles.contentGrid}>
					<div className={`${styles.primaryPanel} card`}>
						<div className={styles.sectionHeader}>
							<div>
								<p className={styles.sectionKicker}>Next steps</p>
								<h2 className={styles.sectionTitle}>What you can do now</h2>
							</div>
						</div>

						<div className={styles.actionList}>
							<button className={styles.actionRow} onClick={() => navigate('/customer/catalog')}>
								<span className={styles.actionIcon}>↗</span>
								<span>
									<strong>Browse medicines</strong>
									<small>Search inventory and add items to cart</small>
								</span>
							</button>
							<button className={styles.actionRow} onClick={() => navigate('/customer/orders')}>
								<span className={styles.actionIcon}>↻</span>
								<span>
									<strong>Review orders</strong>
									<small>Check delivery progress and past purchases</small>
								</span>
							</button>
							<button className={styles.actionRow} onClick={() => navigate('/customer/profile')}>
								<span className={styles.actionIcon}>◎</span>
								<span>
									<strong>Update profile</strong>
									<small>Edit address, buyer type, and contact details</small>
								</span>
							</button>
						</div>

						{user?.customer?.buyerType === 'WHOLESALE' && (
							<div className={styles.highlightBanner}>
								<strong>Wholesale benefits active</strong>
								<p>You are eligible for bulk pricing discounts on qualifying orders.</p>
							</div>
						)}
					</div>

					<aside className={styles.sideColumn}>
						<div className={`${styles.sideCard} card`}>
							<p className={styles.sectionKicker}>Active orders</p>
							<h2 className={styles.sectionTitle}>Delivery snapshot</h2>
							<div className={styles.orderList}>
								{activeOrders.map((order) => (
									<div key={order.id} className={styles.orderItem}>
										<div>
											<p className={styles.orderId}>{order.id}</p>
											<p className={styles.orderMeta}>ETA {order.eta}</p>
										</div>
										<span className="badge">{order.status}</span>
									</div>
								))}
							</div>
							<button className="button-outline" onClick={() => navigate('/customer/orders')}>View all orders</button>
						</div>

						<div className={`${styles.sideCard} card`}>
							<p className={styles.sectionKicker}>Last order</p>
							<h2 className={styles.sectionTitle}>Recent purchase</h2>
							<div className={styles.summaryStack}>
								<p><span>Order ID</span><strong>{lastOrder.id}</strong></p>
								<p><span>Date</span><strong>{new Date(lastOrder.date).toLocaleDateString('en-IN')}</strong></p>
								<p><span>Items</span><strong>{lastOrder.items}</strong></p>
								<p><span>Total</span><strong>{formatPrice(lastOrder.total)}</strong></p>
							</div>
							<button className="button" onClick={() => navigate('/customer/orders')}>Track order</button>
						</div>
					</aside>
				</section>
			</div>
		</main>
	);
}

export default CustomerDashboard;