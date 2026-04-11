import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';
import { useUser } from '../../context/UserContext';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useNotification } from '../../context/NotificationContext';
import { convertPrice, formatCurrency } from '../../utils/currency';
import orderService from '../../services/order.service';
import styles from './Dashboard.module.css';
import { BarChart2, Package, Pill, Settings, ClipboardList, Heart, TrendingUp, Timer, Sparkles, Gift } from 'lucide-react';

function CustomerDashboard() {
	const navigate = useNavigate();
	const { user } = useUser();
	const { getTotalItems } = useCart();
	const { currency, exchangeRates } = useCurrency();
	const { showError } = useNotification();
	const [orders, setOrders] = useState([]);
	const [loadingOrders, setLoadingOrders] = useState(true);
	const currencyCode = currency || user?.preferredCurrency || 'INR';
	const formatPrice = (value) => formatCurrency(convertPrice(value, 'INR', currencyCode, exchangeRates), currencyCode, true);
	const savedAddress = user?.customer
		? `${user.customer.address || ''}, ${user.customer.city || ''}, ${user.customer.state || ''} ${user.customer.zipCode || ''}`
		: 'No saved address';
	const displayName = user?.customer?.fullName || user?.email || 'Customer';
	const buyerType = user?.customer?.buyerType || 'RETAIL';

	useEffect(() => {
		const loadOrders = async () => {
			try {
				setLoadingOrders(true);
				const result = await orderService.getCustomerOrders({ page: 1, limit: 100 });
				setOrders(result.orders || []);
			} catch (error) {
				console.error('Failed to load dashboard orders', error);
				showError(error?.response?.data?.message || 'Failed to load dashboard data');
			} finally {
				setLoadingOrders(false);
			}
		};

		loadOrders();
	}, []);

	const metrics = useMemo(() => {
		const totalOrders = orders.length;
		const totalSpent = orders.reduce((sum, order) => sum + ((order.totalCents || 0) / 100), 0);
		const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
		const activeOrders = orders.filter((order) => ['PENDING', 'PAID', 'SHIPPED'].includes(order.status));
		const recentOrders = [...orders]
			.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
			.slice(0, 5)
			.map((order) => ({
				id: order.id,
				date: order.createdAt,
				total: Number(((order.totalCents || 0) / 100).toFixed(2)),
				items: (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0),
				status: order.status,
				medicineQuantityMap: (order.items || []).reduce((map, item) => {
					const name = item?.medicine?.name;
					if (!name) return map;
					const qty = Math.max(1, Number(item?.quantity) || 1);
					map.set(name, (map.get(name) || 0) + qty);
					return map;
				}, new Map())
			}));

		return {
			totalOrders,
			totalSpent,
			avgOrderValue,
			activeOrders,
			recentOrders
		};
	}, [orders]);

	const handleLogout = () => {
		authService.logout();
		navigate('/login');
	};

	const tabItems = [
		{ id: 'overview', label: 'Overview', icon: <BarChart2 size={18} strokeWidth={1.5} /> },
		{ id: 'orders', label: 'Orders', icon: <Package size={18} strokeWidth={1.5} /> },
		{ id: 'medicines', label: 'Medicines', icon: <Pill size={18} strokeWidth={1.5} /> },
		{ id: 'settings', label: 'Settings', icon: <Settings size={18} strokeWidth={1.5} /> }
	];

	const orderStages = ['Ordered', 'Confirmed', 'Shipped', 'Delivered'];

	const getOrderStageIndex = (status = '') => {
		const normalized = status.toLowerCase();
		if (normalized.includes('cancel')) return 0;
		if (normalized.includes('delivered')) return 3;
		if (normalized.includes('ship')) return 2;
		if (normalized.includes('paid') || normalized.includes('confirm') || normalized.includes('pend')) return 1;
		return 0;
	};

	const getEtaLabel = (status = '') => {
		const normalized = status.toLowerCase();
		if (normalized.includes('ship')) return 'On the way';
		if (normalized.includes('paid') || normalized.includes('confirm') || normalized.includes('pend')) return 'Preparing order';
		if (normalized.includes('delivered')) return 'Delivered';
		if (normalized.includes('cancel')) return 'Cancelled';
		return 'Pending update';
	};

	const extractMedicineQuantityMap = (order) => {
		const groupedByMedicine = new Map();
		(order.items || []).forEach((item) => {
			const medicineName = item?.medicine?.name;
			if (!medicineName) return;
			const quantity = Math.max(1, Number(item?.quantity) || 1);
			groupedByMedicine.set(medicineName, (groupedByMedicine.get(medicineName) || 0) + quantity);
		});
		return groupedByMedicine;
	};

	const getOrderDisplayName = (medicineQuantityMap) => {
		const groupedEntries = Array.from(medicineQuantityMap.entries());
		if (groupedEntries.length === 0) {
			return 'Medicine order';
		}

		if (groupedEntries.length === 1) {
			const [medicineName, totalQuantity] = groupedEntries[0];
			return `${medicineName} x${totalQuantity}`;
		}

		if (groupedEntries.length === 2) {
			const [firstMedicineName, firstQuantity] = groupedEntries[0];
			const [secondMedicineName, secondQuantity] = groupedEntries[1];
			return `${firstMedicineName} x${firstQuantity}, ${secondMedicineName} x${secondQuantity}`;
		}

		const [firstMedicineName, firstQuantity] = groupedEntries[0];
		return `${firstMedicineName} x${firstQuantity} + ${groupedEntries.length - 1} more`;
	};

	const getTotalQuantity = (medicineQuantityMap) => (
		Array.from(medicineQuantityMap.values()).reduce((sum, qty) => sum + qty, 0)
	);

	const groupedActiveOrders = useMemo(() => {
		const grouped = new Map();

		metrics.activeOrders.forEach((order) => {
			const medicineQuantityMap = extractMedicineQuantityMap(order);
			const medicineKey = Array.from(medicineQuantityMap.keys()).sort().join('|') || 'unknown';
			const groupKey = `${order.status}::${medicineKey}`;

			if (!grouped.has(groupKey)) {
				grouped.set(groupKey, {
					status: order.status,
					medicineQuantityMap: new Map(),
					orderCount: 0,
					latestCreatedAt: order.createdAt ? new Date(order.createdAt).toISOString() : new Date(0).toISOString()
				});
			}

			const group = grouped.get(groupKey);
			group.orderCount += 1;
			group.latestCreatedAt = new Date(order.createdAt || 0) > new Date(group.latestCreatedAt)
				? new Date(order.createdAt).toISOString()
				: group.latestCreatedAt;

			medicineQuantityMap.forEach((qty, name) => {
				group.medicineQuantityMap.set(name, (group.medicineQuantityMap.get(name) || 0) + qty);
			});
		});

		return Array.from(grouped.values()).sort((a, b) => new Date(b.latestCreatedAt) - new Date(a.latestCreatedAt));
	}, [metrics.activeOrders]);

	const previewActiveOrders = useMemo(() => groupedActiveOrders.slice(0, 3), [groupedActiveOrders]);
	const previewRecentOrders = useMemo(() => metrics.recentOrders.slice(0, 3), [metrics.recentOrders]);

	return (
		<main className={styles.dashboardMain}>
			<aside className={styles.sidebar}>
				<div className={`${styles.sidebarCard} card`}>
					<div className={styles.profileSection}>
						<div className={styles.largeAvatar}>{displayName.charAt(0).toUpperCase()}</div>
						<h2 className={styles.profileName}>{displayName}</h2>
						<p className={styles.profileEmail}>{user?.email}</p>

						<div className={styles.statBadges}>
							<div className={styles.badge}>
								<span className={styles.badgeValue}>{metrics.totalOrders}</span>
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
							<Pill size={16} strokeWidth={1.5} /> Browse Medicines
						</button>
						<button 
							className={styles.navItem}
							onClick={() => navigate('/customer/orders')}
						>
							<Package size={16} strokeWidth={1.5} /> My Orders
						</button>
						<button 
							className={styles.navItem}
							onClick={() => navigate('/customer/prescriptions')}
						>
							<ClipboardList size={16} strokeWidth={1.5} /> Prescriptions
						</button>
						<button 
							className={styles.navItem}
							onClick={() => navigate('/customer/favorites')}
						>
							<Heart size={16} strokeWidth={1.5} /> Favorites
						</button>
					</nav>
				</div>
			</aside>

			<div className={styles.mainContent}>
				<section className={styles.workspaceHero}>
					<div className={styles.workspaceHeroLeft}>
						<p className={styles.headerLabel}>Welcome back</p>
						<h1 className={styles.workspaceTitle}>Your Pharmacy Dashboard</h1>
						<p className={styles.workspaceText}>Track orders, review purchases, and manage your medicines from a calm, organized workspace.</p>
						<div className={styles.heroChips}>
							<span className={styles.heroChip}>Buyer: {buyerType}</span>
							<span className={styles.heroChip}>Currency: {currencyCode}</span>
							<span className={styles.heroChip}>{metrics.activeOrders.length} open of {metrics.totalOrders} total</span>
						</div>
						<div className={styles.heroActionsRow}>
							<button className="button" onClick={() => navigate('/customer/catalog')}>Browse medicines</button>
							<button className="button-outline" onClick={() => navigate('/customer/orders')}>Review orders</button>
						</div>
					</div>

					<div className={styles.workspaceHeroRight}>
						<div className={styles.heroMetricCard}>
							<p>Lifetime spend</p>
							<strong>{formatPrice(metrics.totalSpent)}</strong>
						</div>
						<div className={styles.heroMetricCard}>
							<p>Last order</p>
							<strong>{formatPrice(metrics.recentOrders[0]?.total || 0)}</strong>
						</div>
						<div className={styles.heroMetricCard}>
							<p>Delivery address</p>
							<strong>{savedAddress}</strong>
						</div>
					</div>
				</section>

				<header className={styles.contentHeader}>
					<div>
						<p className={styles.sectionKicker}>Overview</p>
						<h2 className={styles.headerTitle}>A clear view of your activity</h2>
					</div>
					<div className={styles.headerRight}>
						<span className={styles.currencyBadge}>{currencyCode}</span>
					</div>
				</header>

				<section className={styles.quickStats}>
					<div className={`${styles.statBox} card`}>
						<div className={styles.statBoxIcon} style={{ backgroundColor: 'rgba(21, 115, 71, 0.15)' }}><TrendingUp size={20} strokeWidth={1.5} /></div>
						<div>
							<p className={styles.statBoxLabel}>Total Spent</p>
							<p className={styles.statBoxValue}>{formatPrice(metrics.totalSpent)}</p>
						</div>
					</div>
					<div className={`${styles.statBox} card`}>
						<div className={styles.statBoxIcon} style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}><Package size={20} strokeWidth={1.5} /></div>
						<div>
							<p className={styles.statBoxLabel}>Avg. Order</p>
							<p className={styles.statBoxValue}>{formatPrice(metrics.avgOrderValue)}</p>
						</div>
					</div>
					<div className={`${styles.statBox} card`}>
						<div className={styles.statBoxIcon} style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)' }}><Timer size={20} strokeWidth={1.5} /></div>
						<div>
							<p className={styles.statBoxLabel}>Open Orders</p>
							<p className={styles.statBoxValue}>{metrics.activeOrders.length}</p>
						</div>
					</div>
					<div className={`${styles.statBox} card`}>
						<div className={styles.statBoxIcon} style={{ backgroundColor: 'rgba(236, 72, 153, 0.15)' }}><Sparkles size={20} strokeWidth={1.5} /></div>
						<div>
							<p className={styles.statBoxLabel}>Member Since</p>
							<p className={styles.statBoxValue}>{user?.createdAt ? new Date(user.createdAt).getFullYear() : 'N/A'}</p>
						</div>
					</div>
				</section>

				<section className={styles.ordersSection}>
					<div className={styles.sectionHeaderMain}>
						<div>
							<h3 className={styles.sectionTitleMain}>Open Orders</h3>
							<p className={styles.sectionSubtitle}>Track current deliveries ({metrics.activeOrders.length} of {metrics.totalOrders}){groupedActiveOrders.length > 3 ? ' • showing first 3' : ''}</p>
						</div>
						<button className="button-outline" onClick={() => navigate('/customer/orders')}>View all</button>
					</div>

					<div className={styles.ordersList}>
						{loadingOrders ? (
							<div className={`${styles.orderCard} card`}>Loading active orders...</div>
						) : metrics.activeOrders.length === 0 ? (
							<div className={`${styles.orderCard} card`}>No active orders yet.</div>
						) : (
							previewActiveOrders.map((group, index) => {
								const stageIndex = getOrderStageIndex(group.status);
								const totalQuantity = getTotalQuantity(group.medicineQuantityMap);
								return (
									<div key={`${group.status}-${index}`} className={`${styles.orderCard} card`}>
										<div className={styles.orderCardTop}>
											<div>
												<p className={styles.orderId}>{getOrderDisplayName(group.medicineQuantityMap)}</p>
												<p className={styles.orderRef}>Combined {group.orderCount} order{group.orderCount > 1 ? 's' : ''}</p>
												<p className={styles.orderEta}>Status: {getEtaLabel(group.status)} • Qty {totalQuantity}</p>
											</div>
											<span className={`badge badge-success`}>{group.status}</span>
										</div>
										<div className={styles.stageRow}>
											{orderStages.map((stage, idx) => (
												<React.Fragment key={`${group.status}-${index}-${stage}`}>
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
									</div>
								);
							})
						)}
					</div>
				</section>

				<section className={styles.recentSection}>
					<div className={styles.sectionHeaderMain}>
						<div>
							<h3 className={styles.sectionTitleMain}>Recent Purchases</h3>
							<p className={styles.sectionSubtitle}>Your order history{metrics.recentOrders.length > 3 ? ' • showing first 3' : ''}</p>
						</div>
						<button className="button-outline" onClick={() => navigate('/customer/orders')}>View all</button>
					</div>

					<div className={styles.purchasesList}>
						{loadingOrders ? (
							<div className={`${styles.purchaseItem} card`}>Loading recent purchases...</div>
						) : metrics.recentOrders.length === 0 ? (
							<div className={`${styles.purchaseItem} card`}>No orders placed yet.</div>
						) : (
							previewRecentOrders.map((order) => (
								<div key={order.id} className={`${styles.purchaseItem} card`}>
									<div className={styles.purchaseLeft}>
										<p className={styles.purchaseOrderId}>{getOrderDisplayName(order.medicineQuantityMap)}</p>
										<p className={styles.purchaseDate}>{order.date ? new Date(order.date).toLocaleDateString('en-IN') : '-'}</p>
									</div>
									<div className={styles.purchaseMiddle}>
										<p className={styles.purchaseItems}>{getTotalQuantity(order.medicineQuantityMap)} units • Order #{String(order.id).slice(0, 8)}</p>
										<span className={`badge badge-info`}>{order.status}</span>
									</div>
									<div className={styles.purchaseRight}>
										<p className={styles.purchaseTotal}>{formatPrice(order.total)}</p>
									</div>
								</div>
							))
						)}
					</div>
				</section>

				{buyerType === 'WHOLESALE' && (
					<section className={styles.promoBanner}>
						<div className={styles.promoBannerContent}>
							<Gift size={24} strokeWidth={1.5} className={styles.promoIcon} />
							<div>
								<h4>Wholesale Benefits Active</h4>
								<p>You are eligible for wholesale pricing and priority support on qualifying orders.</p>
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
