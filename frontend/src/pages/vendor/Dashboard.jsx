import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';
import vendorService from '../../services/vendor.service';
import { useCurrency } from '../../context/CurrencyContext';
import { formatCurrency } from '../../utils/currency';
import VendorPageShell from '../../components/layout/VendorPageShell';
import styles from './Dashboard.module.css';
import { Pill, Package, Truck, Wallet, Star, Check, Clock, X, ShieldCheck } from 'lucide-react';

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
		totalReviews: 124,
		complianceScore: 92,
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
			const [userData, dashboard, profile] = await Promise.all([
				authService.getCurrentUser(),
				vendorService.getDashboard(),
				vendorService.getProfile()
			]);

			// Calculate compliance score
			let score = 92;
			if (profile?.complianceDocuments) {
				const statusPoints = { 'verified': 25, 'expiring-soon': 15, 'pending': 5, 'rejected': 0 };
				const totalPoints = profile.complianceDocuments.reduce((acc, doc) => acc + (statusPoints[doc.status] || 0), 0);
				const maxPoints = profile.complianceDocuments.length * 25;
				score = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
			}

			setUser(userData);
			if (dashboard && dashboard.metrics) {
				setDashboardData(prev => ({
					...prev,
					todaySales: Math.round((dashboard.metrics.todaySalesCents || 0) / 100),
					todayOrders: dashboard.metrics.todayOrders || 0,
					pendingOrders: dashboard.metrics.pendingOrders || 0,
					totalProducts: dashboard.metrics.totalProducts || 0,
					totalInventoryValue: Math.round((dashboard.metrics.totalInventoryValueCents || 0) / 100),
					averageRating: userData?.vendor?.rating || 0,
					totalReviews: userData?.vendor?.totalRatings || 0,
					complianceScore: score,
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
				}));
			}
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
			display: 'inline-flex',
			alignItems: 'center',
			gap: '0.4rem',
			padding: '0.4rem 0.8rem',
			borderRadius: '9999px',
			fontSize: '0.8rem',
			fontWeight: '700'
		};

		if (status === 'VERIFIED') {
			return <span style={{ ...badgeStyle, backgroundColor: 'var(--success-light)', color: 'var(--success)' }}><Check size={14} /> Verified Vendor</span>;
		}
		if (status === 'PENDING') {
			return <span style={{ ...badgeStyle, backgroundColor: 'var(--warning-light)', color: 'var(--warning)' }}><Clock size={14} /> Review Pending</span>;
		}
		if (status === 'REJECTED') {
			return <span style={{ ...badgeStyle, backgroundColor: 'var(--error-light)', color: 'var(--error)' }}><X size={14} /> Rejected</span>;
		}
		return <span style={{ ...badgeStyle, backgroundColor: 'var(--border-light)', color: 'var(--text-secondary)' }}>Status Unknown</span>;
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

	const salesTrend = dashboardData.weeklyTrend || [];
	const todaySalesVal = salesTrend[salesTrend.length - 1]?.sales || 0;
	const yesterdaySalesVal = salesTrend[salesTrend.length - 2]?.sales || 0;
	const salesDiff = todaySalesVal - yesterdaySalesVal;
	const salesGrowthPercent = yesterdaySalesVal > 0 
		? ((salesDiff / yesterdaySalesVal) * 100).toFixed(1) 
		: (todaySalesVal > 0 ? '100' : '0');
	const salesGrowthText = `${salesDiff >= 0 ? '↑' : '↓'} ${Math.abs(salesGrowthPercent)}% from yesterday`;

	const todayOrdersVal = salesTrend[salesTrend.length - 1]?.orders || 0;
	const yesterdayOrdersVal = salesTrend[salesTrend.length - 2]?.orders || 0;
	const ordersDiff = todayOrdersVal - yesterdayOrdersVal;
	const ordersGrowthPercent = yesterdayOrdersVal > 0 
		? ((ordersDiff / yesterdayOrdersVal) * 100).toFixed(1) 
		: (todayOrdersVal > 0 ? '100' : '0');
	const ordersGrowthText = `${ordersDiff >= 0 ? '↑' : '↓'} ${Math.abs(ordersGrowthPercent)}% from yesterday`;

	return (
		<div className={styles.container}>
			<VendorPageShell
				title="Vendor Dashboard"
				subtitle={`Welcome back, ${user?.vendor?.companyName || user?.email}! Here's your business performance.`}
				actions={(
					<div style={{ display: 'flex', gap: '0.75rem' }}>
						<button className={styles.inventoryButton} onClick={() => navigate('/vendor/stock')}>
							Manage Catalog
						</button>
						<button className={styles.logoutButton} onClick={handleLogout}>
							Logout
						</button>
					</div>
				)}
			>
				{user?.vendor?.verificationStatus === 'PENDING' && (
					<div className={styles.alertBox}>
						<div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
							<div style={{ padding: '0.5rem', background: 'var(--warning-light)', borderRadius: '50%', color: 'var(--warning)' }}>
								<Clock size={20} strokeWidth={2} />
							</div>
							<div>
								<h4 style={{ margin: '0 0 0.35rem 0', fontWeight: 700 }}>Profile Verification in Progress</h4>
								<p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
									Our team is currently reviewing your compliance documents. Verified status will be granted within 48 hours.
									<button 
										onClick={() => navigate('/vendor/compliance')} 
										style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, padding: '0 0 0 0.5rem', cursor: 'pointer' }}
									>
										Check Status →
									</button>
								</p>
							</div>
						</div>
					</div>
				)}

				<div className={styles.quickActionsSection}>
					<button type="button" className={styles.quickActionCard} onClick={() => navigate('/vendor/stock')}>
						<span className={styles.quickActionIcon}><Pill size={22} strokeWidth={1.5} /></span>
						<span className={styles.quickActionLabel}>Manage Stock</span>
						<span className={styles.quickActionHint}>Add / Update Inventory</span>
					</button>
					<button type="button" className={styles.quickActionCard} onClick={() => navigate('/vendor/orders')}>
						<span className={styles.quickActionIcon}><Package size={22} strokeWidth={1.5} /></span>
						<span className={styles.quickActionLabel}>Pending Orders</span>
						<span className={styles.quickActionHint}>Process customer requests</span>
					</button>
					<button type="button" className={styles.quickActionCard} onClick={() => navigate('/vendor/shipping')}>
						<span className={styles.quickActionIcon}><Truck size={22} strokeWidth={1.5} /></span>
						<span className={styles.quickActionLabel}>Shipments</span>
						<span className={styles.quickActionHint}>Track delivery progress</span>
					</button>
					<button type="button" className={styles.quickActionCard} onClick={() => navigate('/vendor/compliance')}>
						<span className={styles.quickActionIcon}><ShieldCheck size={22} strokeWidth={1.5} /></span>
						<span className={styles.quickActionLabel}>Compliance</span>
						<span className={styles.quickActionHint}>Trust Score & Documents</span>
					</button>
				</div>

				<div className={styles.metricsGrid}>
					<div className={styles.metricCard}>
						<div className={styles.metricLabel}>Today's Sales</div>
						<div className={styles.metricValue}>{formatMoney(dashboardData.todaySales)}</div>
						<div className={styles.metricChange}>{salesGrowthText}</div>
					</div>
					<div className={styles.metricCard}>
						<div className={styles.metricLabel}>Pending Orders</div>
						<div className={styles.metricValue}>{dashboardData.pendingOrders}</div>
						<div className={styles.metricChange} style={{ color: 'var(--warning)', fontWeight: 600 }}>Action Required</div>
					</div>
					<div className={styles.metricCard}>
						<div className={styles.metricLabel}>Trust Score</div>
						<div className={styles.metricValue} style={{ color: 'var(--primary)' }}>{dashboardData.complianceScore}%</div>
						<div className={styles.metricChange}><ShieldCheck size={12} /> Compliance health</div>
					</div>
					<div className={styles.metricCard}>
						<div className={styles.metricLabel}>Avg Rating</div>
						<div className={styles.metricValue}>{dashboardData.averageRating} <Star size={16} strokeWidth={1.5} fill="var(--warning)" color="var(--warning)" /></div>
						<div className={styles.metricChange}>{dashboardData.totalReviews} verified reviews</div>
					</div>
				</div>

				<div className={styles.chartsGrid}>
					<div className={styles.section}>
						<h2 className={styles.sectionTitle}>Weekly Sales Trend</h2>
						<div className={styles.chart}>
							{dashboardData.weeklyTrend.length === 0 && <p>No sales data available.</p>}
							{dashboardData.weeklyTrend.map((data, idx) => (
								<div key={idx} className={styles.barContainer}>
									<div className={styles.barValue}>{formatMoney(data.sales)}</div>
									<div
										className={styles.bar}
										style={{
											height: `${(data.sales / maxWeeklySales) * 150}px`
										}}
									/>
									<span className={styles.dayLabel}>{data.day}</span>
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
