import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';
import vendorService from '../../services/vendor.service';
import { useCurrency } from '../../context/CurrencyContext';
import { formatCurrency } from '../../utils/currency';
import VendorPageShell from '../../components/layout/VendorPageShell';
import styles from './Dashboard.module.css';
import { Pill, Package, Truck, Wallet, Star, Check, Clock, X } from 'lucide-react';

function VendorDashboard() {
	const navigate = useNavigate();
	const { currency, convert } = useCurrency();
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [dashboardData, setDashboardData] = useState({
		todaySales: 0,
		todayOrders: 0,
		pendingOrders: 0,
		totalProducts: 0,
		totalInventoryValue: 0,
		averageRating: 4.8,
		totalReviews: 0,
		conversionRate: 3.45,
		weeklyTrend: [],
		recentOrders: [],
		lowStockProducts: []
	});
	const formatMoney = (value) => formatCurrency(convert(value, 'INR'), currency, true);

	useEffect(() => {
		loadUserData();
	}, []);

	const loadUserData = async () => {
		try {
			setLoading(true);
			const [userData, dashboard] = await Promise.all([
				authService.getCurrentUser(),
				vendorService.getDashboard()
			]);

			setUser(userData);
			setDashboardData({
				todaySales: Math.round((dashboard.metrics?.todaySalesCents || 0) / 100),
				todayOrders: dashboard.metrics?.todayOrders || 0,
				pendingOrders: dashboard.metrics?.pendingOrders || 0,
				totalProducts: dashboard.metrics?.totalProducts || 0,
				totalInventoryValue: Math.round((dashboard.metrics?.totalInventoryValueCents || 0) / 100),
				averageRating: 4.8,
				totalReviews: 0,
				conversionRate: 3.45,
				weeklyTrend: (dashboard.weeklyTrend || []).map((item) => ({
					day: item.day,
					sales: Math.round((item.salesCents || 0) / 100),
					orders: item.orders || 0
				})),
				recentOrders: (dashboard.recentOrders || []).map((order) => ({
					id: order.id,
					customer: order.customer,
					amount: Math.round((order.amountCents || 0) / 100),
					status: order.status,
					time: new Date(order.createdAt).toLocaleString()
				})),
				lowStockProducts: dashboard.lowStockProducts || []
			});
		} catch (error) {
			console.error('Failed to load user data:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = () => {
		authService.logout();
		navigate('/login');
	};

	const getVerificationBadge = (status) => {
		const badgeStyle = {
			display: 'inline-block',
			padding: '0.4rem 0.8rem',
			borderRadius: '9999px',
			fontSize: '0.8rem',
			fontWeight: '600'
		};

		if (status === 'VERIFIED') {
			return <span style={{ ...badgeStyle, backgroundColor: 'var(--green-100)', color: 'var(--success)' }}><Check size={12} /> Verified</span>;
		}
		if (status === 'PENDING') {
			return <span style={{ ...badgeStyle, backgroundColor: 'var(--yellow-100)', color: 'var(--warning)' }}><Clock size={12} /> Pending</span>;
		}
		if (status === 'REJECTED') {
			return <span style={{ ...badgeStyle, backgroundColor: 'var(--red-100)', color: 'var(--error)' }}><X size={12} /> Rejected</span>;
		}
		return null;
	};

	const maxWeeklySales = Math.max(...dashboardData.weeklyTrend.map((data) => data.sales), 1);

	if (loading) {
		return (
			<div className={styles.container}>
				<VendorPageShell title="Vendor Dashboard" subtitle="Loading live metrics...">
					<div className={styles.section}>Loading dashboard data...</div>
				</VendorPageShell>
			</div>
		);
	}

	return (
		<div className={styles.container}>
			<VendorPageShell
				title="Vendor Dashboard"
				subtitle={`Welcome, ${user?.vendor?.companyName || user?.email}! Here's your business overview.`}
				actions={(
					<>
						<button className={styles.inventoryButton} onClick={() => navigate('/vendor/stock')}>
							Manage Inventory & Stock
						</button>
						<button className={styles.logoutButton} onClick={handleLogout}>
							Logout
						</button>
					</>
				)}
			>
				{user?.vendor?.verificationStatus === 'PENDING' && (
					<div className={styles.alertBox}>
						<strong><Clock size={14} strokeWidth={1.5} /> Verification in Progress</strong>
						<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
							Your vendor profile is under review. Our team will verify your documents within 24-48 hours. You'll receive an email notification once approved.
						</p>
					</div>
				)}

				<div className={styles.quickActionsSection}>
					<button type="button" className={styles.quickActionCard} onClick={() => navigate('/vendor/stock')}>
						<span className={styles.quickActionIcon}><Pill size={22} strokeWidth={1.5} /></span>
						<span className={styles.quickActionLabel}>Add / Update Stock</span>
						<span className={styles.quickActionHint}>Manage inventory and pricing</span>
					</button>
					<button type="button" className={styles.quickActionCard} onClick={() => navigate('/vendor/orders')}>
						<span className={styles.quickActionIcon}><Package size={22} strokeWidth={1.5} /></span>
						<span className={styles.quickActionLabel}>Process Orders</span>
						<span className={styles.quickActionHint}>Review pending order queue</span>
					</button>
					<button type="button" className={styles.quickActionCard} onClick={() => navigate('/vendor/shipping')}>
						<span className={styles.quickActionIcon}><Truck size={22} strokeWidth={1.5} /></span>
						<span className={styles.quickActionLabel}>Track Shipping</span>
						<span className={styles.quickActionHint}>Update shipment progress</span>
					</button>
					<button type="button" className={styles.quickActionCard} onClick={() => navigate('/vendor/payments')}>
						<span className={styles.quickActionIcon}><Wallet size={22} strokeWidth={1.5} /></span>
						<span className={styles.quickActionLabel}>View Payments</span>
						<span className={styles.quickActionHint}>Check settlements and ledger</span>
					</button>
				</div>

				<div className={styles.metricsGrid}>
					<div className={styles.metricCard}>
						<div className={styles.metricLabel}>Today's Sales</div>
						<div className={styles.metricValue}>{formatMoney(dashboardData.todaySales)}</div>
						<div className={styles.metricChange}>â†‘ 12.5% from yesterday</div>
					</div>
					<div className={styles.metricCard}>
						<div className={styles.metricLabel}>Today's Orders</div>
						<div className={styles.metricValue}>{dashboardData.todayOrders}</div>
						<div className={styles.metricChange}>â†‘ 8.3% from yesterday</div>
					</div>
					<div className={styles.metricCard}>
						<div className={styles.metricLabel}>Pending Orders</div>
						<div className={styles.metricValue}>{dashboardData.pendingOrders}</div>
						<div className={styles.metricChange}>Action needed</div>
					</div>
					<div className={styles.metricCard}>
						<div className={styles.metricLabel}>Total Products</div>
						<div className={styles.metricValue}>{dashboardData.totalProducts}</div>
						<div className={styles.metricChange}>Active inventory</div>
					</div>
					<div className={styles.metricCard}>
						<div className={styles.metricLabel}>Avg Rating</div>
						<div className={styles.metricValue}>{dashboardData.averageRating} <Star size={14} strokeWidth={1.5} fill="currentColor" /></div>
						<div className={styles.metricChange}>{dashboardData.totalReviews} reviews</div>
					</div>
				</div>

				<div className={styles.chartsGrid}>
					<div className={styles.section}>
						<h2 className={styles.sectionTitle}>Weekly Sales Trend</h2>
						<div className={styles.chart}>
							{dashboardData.weeklyTrend.length === 0 && <p>No sales data available.</p>}
							{dashboardData.weeklyTrend.map((data, idx) => (
								<div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
									<div
										className={styles.bar}
										style={{
											height: `${(data.sales / maxWeeklySales) * 150}px`
										}}
									>
										{formatMoney(data.sales)}
									</div>
									<span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{data.day}</span>
								</div>
							))}
						</div>
					</div>

					<div className={styles.section}>
						<h2 className={styles.sectionTitle}>Business Profile</h2>
						<div style={{ display: 'grid', gap: '0.8rem' }}>
							<div>
								<div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '0.2rem' }}>
									VERIFICATION STATUS
								</div>
								<div>{getVerificationBadge(user?.vendor?.verificationStatus)}</div>
							</div>
							<div>
								<div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '0.2rem' }}>
									TYPE
								</div>
								<div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{user?.vendor?.vendorType || 'N/A'}</div>
							</div>
							<div>
								<div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '0.2rem' }}>
									INVENTORY VALUE
								</div>
								<div style={{ color: 'var(--primary)', fontWeight: '600' }}>{formatMoney(dashboardData.totalInventoryValue)}</div>
							</div>
						</div>
					</div>
				</div>

				<div className={styles.chartsGrid}>
					<div className={styles.section}>
						<h2 className={styles.sectionTitle}>Recent Orders</h2>
						<table className={styles.table}>
							<thead>
								<tr>
									<th className={styles.tableHeader}>Order ID</th>
									<th className={styles.tableHeader}>Customer</th>
									<th className={styles.tableHeader}>Amount</th>
									<th className={styles.tableHeader}>Status</th>
								</tr>
							</thead>
							<tbody>
								{dashboardData.recentOrders.map((order, idx) => (
									<tr key={idx} className={styles.tableRow}>
										<td className={styles.tableCell}>
											<strong>{order.id}</strong>
										</td>
										<td className={styles.tableCell}>{order.customer}</td>
										<td className={styles.tableCell}>{formatMoney(order.amount)}</td>
										<td className={styles.tableCell}>
											<span
												className={styles.statusBadge}
												style={{
													backgroundColor:
														order.status === 'pending'
															? 'var(--yellow-100)'
															: order.status === 'paid'
															? 'var(--blue-100)'
															: order.status === 'shipped'
															? 'var(--green-100)'
															: order.status === 'cancelled'
															? 'var(--red-100)'
															: 'var(--green-100)',
													color:
														order.status === 'pending'
															? 'var(--warning)'
															: order.status === 'paid'
															? 'var(--primary)'
															: order.status === 'shipped'
															? 'var(--success)'
															: order.status === 'cancelled'
															? 'var(--error)'
															: 'var(--success)'
												}}
											>
												{order.status.toUpperCase()}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<div className={styles.section}>
						<h2 className={styles.sectionTitle}>Low Stock Alert</h2>
						<button
							type="button"
							className={styles.inlineInventoryButton}
							onClick={() => navigate('/vendor/stock')}
						>
							Update Stocks
						</button>
						{dashboardData.lowStockProducts.length > 0 ? (
							<div style={{ display: 'grid', gap: '1rem' }}>
								{dashboardData.lowStockProducts.map((product, idx) => (
									<div
										key={idx}
										style={{
											padding: '1rem',
											backgroundColor: 'var(--surface)',
											borderRadius: 'var(--radius)',
											borderLeft: '4px solid var(--warning)'
										}}
									>
										<div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
											{product.name}
										</div>
										<div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
											Current: <strong>{product.stock}</strong> | Threshold: <strong>{product.threshold}</strong>
										</div>
										<div
											style={{
												width: '100%',
												height: '6px',
												backgroundColor: 'var(--border)',
												borderRadius: '3px',
												overflow: 'hidden'
											}}
										>
											<div
												style={{
													width: `${(product.stock / product.threshold) * 100}%`,
													height: '100%',
													backgroundColor: 'var(--warning)'
												}}
											/>
										</div>
									</div>
								))}
							</div>
						) : (
							<p style={{ color: 'var(--success)', textAlign: 'center', padding: '1rem' }}><Check size={16} /> All products are well-stocked!</p>
						)}
					</div>
				</div>
			</VendorPageShell>
		</div>
	);
}

export default VendorDashboard;
