import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';

function VendorDashboard() {
	const navigate = useNavigate();
	const [user, setUser] = useState(null);
	const [dashboardData, setDashboardData] = useState({
		todaySales: 12450,
		todayOrders: 24,
		pendingOrders: 8,
		totalProducts: 156,
		totalInventoryValue: 450000,
		averageRating: 4.8,
		totalReviews: 342,
		conversionRate: 3.45,
		weeklyTrend: [
			{ day: 'Mon', sales: 8500, orders: 15 },
			{ day: 'Tue', sales: 9200, orders: 18 },
			{ day: 'Wed', sales: 7800, orders: 14 },
			{ day: 'Thu', sales: 10500, orders: 21 },
			{ day: 'Fri', sales: 12450, orders: 24 },
			{ day: 'Sat', sales: 11200, orders: 22 },
			{ day: 'Sun', sales: 9800, orders: 19 }
		],
		recentOrders: [
			{ id: 'ORD-001', customer: 'Dr. Kumar', amount: 2450, status: 'pending', time: '5 mins ago' },
			{ id: 'ORD-002', customer: 'Health Clinic', amount: 5600, status: 'confirmed', time: '25 mins ago' },
			{ id: 'ORD-003', customer: 'Hospital Wing', amount: 8900, status: 'shipped', time: '2 hours ago' }
		],
		lowStockProducts: [
			{ id: 1, name: 'Paracetamol 500mg', stock: 15, threshold: 50 },
			{ id: 2, name: 'Cetirizine 10mg', stock: 8, threshold: 30 }
		]
	});

	useEffect(() => {
		loadUserData();
	}, []);

	const loadUserData = async () => {
		try {
			const userData = await authService.getCurrentUser();
			setUser(userData);
		} catch (error) {
			console.error('Failed to load user data:', error);
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

		if (status === 'VERIFIED')
			return <span style={{ ...badgeStyle, backgroundColor: 'var(--green-100)', color: 'var(--success)' }}>✓ Verified</span>;
		if (status === 'PENDING')
			return <span style={{ ...badgeStyle, backgroundColor: 'var(--yellow-100)', color: 'var(--warning)' }}>⏳ Pending</span>;
		if (status === 'REJECTED')
			return <span style={{ ...badgeStyle, backgroundColor: 'var(--red-100)', color: 'var(--error)' }}>✗ Rejected</span>;
		return null;
	};

	const styles = {
		container: {
			padding: '2rem',
			backgroundColor: 'var(--surface)',
			minHeight: '100vh'
		},
		header: {
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
			marginBottom: '2rem'
		},
		headerLeft: {
			flex: 1
		},
		title: {
			fontSize: '2rem',
			fontWeight: '700',
			color: 'var(--text-primary)',
			margin: 0,
			marginBottom: '0.3rem'
		},
		subtitle: {
			fontSize: '0.95rem',
			color: 'var(--text-secondary)',
			margin: 0
		},
		logoutButton: {
			padding: '0.6rem 1.2rem',
			backgroundColor: 'white',
			border: '1px solid var(--border)',
			borderRadius: 'var(--radius)',
			cursor: 'pointer',
			fontWeight: '600',
			transition: 'all 0.2s'
		},
		alertBox: {
			backgroundColor: 'var(--warning-light)',
			border: `2px solid var(--warning)`,
			borderRadius: 'var(--radius)',
			padding: '1rem',
			marginBottom: '2rem',
			color: 'var(--warning-dark)'
		},
		metricsGrid: {
			display: 'grid',
			gridTemplateColumns: 'repeat(5, 1fr)',
			gap: '1.5rem',
			marginBottom: '2rem'
		},
		metricCard: {
			backgroundColor: 'white',
			borderRadius: 'var(--radius-lg)',
			padding: '1.5rem',
			border: '1px solid var(--border)',
			boxShadow: 'var(--shadow-sm)'
		},
		metricLabel: {
			fontSize: '0.8rem',
			color: 'var(--text-secondary)',
			fontWeight: '500',
			textTransform: 'uppercase',
			marginBottom: '0.5rem'
		},
		metricValue: {
			fontSize: '1.8rem',
			fontWeight: '700',
			color: 'var(--primary)',
			margin: '0.5rem 0'
		},
		metricChange: {
			fontSize: '0.75rem',
			color: 'var(--success)',
			fontWeight: '600'
		},
		chartsGrid: {
			display: 'grid',
			gridTemplateColumns: '1fr 1fr',
			gap: '1.5rem',
			marginBottom: '2rem'
		},
		section: {
			backgroundColor: 'white',
			borderRadius: 'var(--radius-lg)',
			padding: '1.5rem',
			border: '1px solid var(--border)',
			boxShadow: 'var(--shadow-sm)'
		},
		sectionTitle: {
			fontSize: '1.1rem',
			fontWeight: '700',
			color: 'var(--text-primary)',
			marginBottom: '1rem',
			paddingBottom: '1rem',
			borderBottom: '1px solid var(--border)',
			margin: '0 0 1.5rem 0'
		},
		chart: {
			height: '200px',
			display: 'flex',
			alignItems: 'flex-end',
			gap: '0.8rem',
			justifyContent: 'space-around'
		},
		bar: {
			backgroundColor: 'var(--primary)',
			borderRadius: 'var(--radius)',
			minWidth: '30px',
			display: 'flex',
			alignItems: 'flex-end',
			justifyContent: 'center',
			color: 'white',
			fontSize: '0.7rem',
			padding: '0.3rem'
		},
		table: {
			width: '100%',
			borderCollapse: 'collapse'
		},
		tableHeader: {
			backgroundColor: 'var(--surface)',
			fontWeight: '600',
			color: 'var(--text-primary)',
			padding: '0.8rem',
			textAlign: 'left',
			borderBottom: '2px solid var(--border)',
			fontSize: '0.85rem'
		},
		tableRow: {
			borderBottom: '1px solid var(--border)',
			padding: '0.8rem'
		},
		tableCell: {
			padding: '0.8rem',
			textAlign: 'left',
			fontSize: '0.85rem'
		},
		statusBadge: {
			display: 'inline-block',
			padding: '0.3rem 0.6rem',
			borderRadius: '4px',
			fontSize: '0.75rem',
			fontWeight: '600'
		}
	};

	return (
		<div style={styles.container}>
			{/* Header */}
			<div style={styles.header}>
				<div style={styles.headerLeft}>
					<h1 style={styles.title}>Vendor Dashboard</h1>
					<p style={styles.subtitle}>Welcome, {user?.vendor?.companyName || user?.email}! Here's your business overview.</p>
				</div>
				<button style={styles.logoutButton} onClick={handleLogout}>
					Logout
				</button>
			</div>

			{/* Verification Alert */}
			{user?.vendor?.verificationStatus === 'PENDING' && (
				<div style={styles.alertBox}>
					<strong>⏳ Verification in Progress</strong>
					<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
						Your vendor profile is under review. Our team will verify your documents within 24-48 hours. You'll receive an email notification once approved.
					</p>
				</div>
			)}

			{/* Key Metrics */}
			<div style={styles.metricsGrid}>
				<div style={styles.metricCard}>
					<div style={styles.metricLabel}>Today's Sales</div>
					<div style={styles.metricValue}>₹{dashboardData.todaySales.toLocaleString()}</div>
					<div style={styles.metricChange}>↑ 12.5% from yesterday</div>
				</div>
				<div style={styles.metricCard}>
					<div style={styles.metricLabel}>Today's Orders</div>
					<div style={styles.metricValue}>{dashboardData.todayOrders}</div>
					<div style={styles.metricChange}>↑ 8.3% from yesterday</div>
				</div>
				<div style={styles.metricCard}>
					<div style={styles.metricLabel}>Pending Orders</div>
					<div style={styles.metricValue}>{dashboardData.pendingOrders}</div>
					<div style={styles.metricChange}>Action needed</div>
				</div>
				<div style={styles.metricCard}>
					<div style={styles.metricLabel}>Total Products</div>
					<div style={styles.metricValue}>{dashboardData.totalProducts}</div>
					<div style={styles.metricChange}>Active inventory</div>
				</div>
				<div style={styles.metricCard}>
					<div style={styles.metricLabel}>Avg Rating</div>
					<div style={styles.metricValue}>{dashboardData.averageRating} ⭐</div>
					<div style={styles.metricChange}>{dashboardData.totalReviews} reviews</div>
				</div>
			</div>

			{/* Charts */}
			<div style={styles.chartsGrid}>
				{/* Weekly Sales Trend */}
				<div style={styles.section}>
					<h2 style={styles.sectionTitle}>Weekly Sales Trend</h2>
					<div style={styles.chart}>
						{dashboardData.weeklyTrend.map((data, idx) => (
							<div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
								<div
									style={{
										...styles.bar,
										height: `${(data.sales / 13000) * 150}px`
									}}
								>
									₹{(data.sales / 1000).toFixed(0)}K
								</div>
								<span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{data.day}</span>
							</div>
						))}
					</div>
				</div>

				{/* Business Info Card */}
				<div style={styles.section}>
					<h2 style={styles.sectionTitle}>Business Profile</h2>
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
							<div style={{ color: 'var(--primary)', fontWeight: '600' }}>₹{dashboardData.totalInventoryValue.toLocaleString()}</div>
						</div>
					</div>
				</div>
			</div>

			{/* Recent Orders & Low Stock */}
			<div style={styles.chartsGrid}>
				{/* Recent Orders */}
				<div style={styles.section}>
					<h2 style={styles.sectionTitle}>Recent Orders</h2>
					<table style={styles.table}>
						<thead>
							<tr>
								<th style={styles.tableHeader}>Order ID</th>
								<th style={styles.tableHeader}>Customer</th>
								<th style={styles.tableHeader}>Amount</th>
								<th style={styles.tableHeader}>Status</th>
							</tr>
						</thead>
						<tbody>
							{dashboardData.recentOrders.map((order, idx) => (
								<tr key={idx} style={styles.tableRow}>
									<td style={styles.tableCell}>
										<strong>{order.id}</strong>
									</td>
									<td style={styles.tableCell}>{order.customer}</td>
									<td style={styles.tableCell}>₹{order.amount.toLocaleString()}</td>
									<td style={styles.tableCell}>
										<span
											style={{
												...styles.statusBadge,
												backgroundColor:
													order.status === 'pending'
														? 'var(--yellow-100)'
														: order.status === 'confirmed'
														? 'var(--blue-100)'
														: 'var(--green-100)',
												color:
													order.status === 'pending'
														? 'var(--warning)'
														: order.status === 'confirmed'
														? 'var(--primary)'
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

				{/* Low Stock Alert */}
				<div style={styles.section}>
					<h2 style={styles.sectionTitle}>Low Stock Alert</h2>
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
						<p style={{ color: 'var(--success)', textAlign: 'center', padding: '1rem' }}>✓ All products are well-stocked!</p>
					)}
				</div>
			</div>
		</div>
	);
}

export default VendorDashboard;