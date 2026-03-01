import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function VendorAnalytics() {
	const navigate = useNavigate();
	const [timeRange, setTimeRange] = useState('month');
	const [analyticsData, setAnalyticsData] = useState({
		totalSales: 125450,
		totalOrders: 348,
		conversionRate: 3.45,
		avgOrderValue: 360.37,
		topProducts: [
			{ id: 1, name: 'Paracetamol 500mg', sales: 1250, revenue: 56250 },
			{ id: 2, name: 'Amoxicillin 250mg', sales: 890, revenue: 106800 },
			{ id: 3, name: 'Cetirizine 10mg', sales: 756, revenue: 18900 }
		],
		salesTrend: [
			{ month: 'Jan', sales: 12500 },
			{ month: 'Feb', sales: 15600 },
			{ month: 'Mar', sales: 18900 },
			{ month: 'Apr', sales: 22400 },
			{ month: 'May', sales: 28600 },
			{ month: 'Jun', sales: 27450 }
		],
		regionData: [
			{ region: 'North India', orders: 145, revenue: 52300 },
			{ region: 'South India', orders: 102, revenue: 38900 },
			{ region: 'Central India', orders: 78, revenue: 29800 },
			{ region: 'East India', orders: 23, revenue: 4450 }
		]
	});

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
		title: {
			fontSize: '2rem',
			fontWeight: '700',
			color: 'var(--text-primary)',
			margin: 0
		},
		timeRangeSelector: {
			display: 'flex',
			gap: '0.5rem'
		},
		timeButton: {
			padding: '0.6rem 1.2rem',
			border: '1px solid var(--border)',
			borderRadius: 'var(--radius)',
			backgroundColor: 'white',
			cursor: 'pointer',
			fontWeight: '500',
			transition: 'all 0.2s'
		},
		timeButtonActive: {
			padding: '0.6rem 1.2rem',
			border: 'none',
			borderRadius: 'var(--radius)',
			backgroundColor: 'var(--primary)',
			color: 'white',
			cursor: 'pointer',
			fontWeight: '500',
			transition: 'all 0.2s'
		},
		metricsGrid: {
			display: 'grid',
			gridTemplateColumns: 'repeat(4, 1fr)',
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
			fontSize: '0.85rem',
			color: 'var(--text-secondary)',
			fontWeight: '500',
			textTransform: 'uppercase',
			marginBottom: '0.5rem'
		},
		metricValue: {
			fontSize: '2rem',
			fontWeight: '700',
			color: 'var(--primary)',
			margin: '0.5rem 0'
		},
		metricChange: {
			fontSize: '0.8rem',
			color: 'var(--success)',
			fontWeight: '600'
		},
		chartsGrid: {
			display: 'grid',
			gridTemplateColumns: '1fr 1fr',
			gap: '2rem',
			marginBottom: '2rem'
		},
		chartCard: {
			backgroundColor: 'white',
			borderRadius: 'var(--radius-lg)',
			padding: '1.5rem',
			border: '1px solid var(--border)',
			boxShadow: 'var(--shadow-sm)'
		},
		chartTitle: {
			fontSize: '1.1rem',
			fontWeight: '700',
			color: 'var(--text-primary)',
			marginBottom: '1.5rem',
			paddingBottom: '1rem',
			borderBottom: '1px solid var(--border)'
		},
		chart: {
			height: '300px',
			display: 'flex',
			alignItems: 'flex-end',
			gap: '1rem',
			justifyContent: 'space-around'
		},
		bar: {
			backgroundColor: 'var(--primary)',
			borderRadius: 'var(--radius)',
			minWidth: '40px',
			display: 'flex',
			alignItems: 'flex-end',
			justifyContent: 'center',
			color: 'white',
			fontSize: '0.8rem',
			padding: '0.5rem'
		},
		tableCard: {
			backgroundColor: 'white',
			borderRadius: 'var(--radius-lg)',
			padding: '1.5rem',
			border: '1px solid var(--border)',
			boxShadow: 'var(--shadow-sm)'
		},
		table: {
			width: '100%',
			borderCollapse: 'collapse'
		},
		tableHeader: {
			backgroundColor: 'var(--surface)',
			fontWeight: '600',
			color: 'var(--text-primary)',
			padding: '1rem',
			textAlign: 'left',
			borderBottom: '2px solid var(--border)'
		},
		tableRow: {
			borderBottom: '1px solid var(--border)',
			padding: '1rem'
		},
		tableCell: {
			padding: '1rem',
			textAlign: 'left'
		},
		insightBox: {
			backgroundColor: 'var(--primary-light)',
			border: '1px solid var(--green-200)',
			borderRadius: 'var(--radius-lg)',
			padding: '1rem',
			marginTop: '1rem',
			fontSize: '0.9rem',
			color: 'var(--text-secondary)',
			lineHeight: '1.6'
		}
	};

	return (
		<div style={styles.container}>
			{/* Header */}
			<div style={styles.header}>
				<h1 style={styles.title}>Analytics & Insights</h1>
				<div style={styles.timeRangeSelector}>
					{['week', 'month', 'quarter', 'year'].map(range => (
						<button
							key={range}
							style={timeRange === range ? styles.timeButtonActive : styles.timeButton}
							onClick={() => setTimeRange(range)}
						>
							{range.charAt(0).toUpperCase() + range.slice(1)}
						</button>
					))}
				</div>
			</div>

			{/* Key Metrics */}
			<div style={styles.metricsGrid}>
				<div style={styles.metricCard}>
					<div style={styles.metricLabel}>Total Sales</div>
					<div style={styles.metricValue}>₹{analyticsData.totalSales.toLocaleString()}</div>
					<div style={styles.metricChange}>↑ 12.5% from last month</div>
				</div>
				<div style={styles.metricCard}>
					<div style={styles.metricLabel}>Total Orders</div>
					<div style={styles.metricValue}>{analyticsData.totalOrders}</div>
					<div style={styles.metricChange}>↑ 8.3% from last month</div>
				</div>
				<div style={styles.metricCard}>
					<div style={styles.metricLabel}>Avg Order Value</div>
					<div style={styles.metricValue}>₹{analyticsData.avgOrderValue.toFixed(2)}</div>
					<div style={styles.metricChange}>↑ 2.1% from last month</div>
				</div>
				<div style={styles.metricCard}>
					<div style={styles.metricLabel}>Conversion Rate</div>
					<div style={styles.metricValue}>{analyticsData.conversionRate}%</div>
					<div style={styles.metricChange}>↓ 0.5% from last month</div>
				</div>
			</div>

			{/* Charts */}
			<div style={styles.chartsGrid}>
				{/* Sales Trend */}
				<div style={styles.chartCard}>
					<div style={styles.chartTitle}>Sales Trend (Last 6 Months)</div>
					<div style={styles.chart}>
						{analyticsData.salesTrend.map((data, idx) => (
							<div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
								<div
									style={{
										...styles.bar,
										height: `${(data.sales / 30000) * 250}px`
									}}
								>
									${(data.sales / 1000).toFixed(0)}K
								</div>
								<span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{data.month}</span>
							</div>
						))}
					</div>
				</div>

				{/* Regional Performance */}
				<div style={styles.chartCard}>
					<div style={styles.chartTitle}>Orders by Region</div>
					<div>
						{analyticsData.regionData.map((region, idx) => (
							<div key={idx} style={{ marginBottom: '1.5rem' }}>
								<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
									<span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{region.region}</span>
									<span style={{ color: 'var(--text-secondary)' }}>{region.orders} orders</span>
								</div>
								<div style={{
									width: '100%',
									height: '8px',
									backgroundColor: 'var(--surface)',
									borderRadius: '4px',
									overflow: 'hidden'
								}}>
									<div
										style={{
											width: `${(region.orders / 145) * 100}%`,
											height: '100%',
											backgroundColor: 'var(--primary)',
											borderRadius: '4px'
										}}
									/>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Top Products */}
			<div style={styles.tableCard}>
				<div style={styles.chartTitle}>Top Selling Products</div>
				<table style={styles.table}>
					<thead>
						<tr style={{ backgroundColor: 'var(--surface)' }}>
							<th style={styles.tableHeader}>Product Name</th>
							<th style={styles.tableHeader}>Units Sold</th>
							<th style={styles.tableHeader}>Revenue</th>
							<th style={styles.tableHeader}>Action</th>
						</tr>
					</thead>
					<tbody>
						{analyticsData.topProducts.map((product, idx) => (
							<tr key={idx} style={styles.tableRow}>
								<td style={styles.tableCell}>
									<strong>{product.name}</strong>
								</td>
								<td style={styles.tableCell}>{product.sales}</td>
								<td style={styles.tableCell}>₹{product.revenue.toLocaleString()}</td>
								<td style={styles.tableCell}>
									<button style={{
										padding: '0.4rem 0.8rem',
										backgroundColor: 'var(--primary)',
										color: 'white',
										border: 'none',
										borderRadius: 'var(--radius)',
										cursor: 'pointer',
										fontSize: '0.85rem'
									}}>
										View Details
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* AI Insights */}
			<div style={styles.insightBox}>
				<strong>💡 AI Insights:</strong> Based on current trends, your top-selling product (Paracetamol 500mg) has a rising demand in North India.
				Consider increasing inventory by 20% to avoid stockouts. Also, your Cetirizine 10mg could benefit from a 5-10% price optimization
				based on market competition.
			</div>
		</div>
	);
}

export default VendorAnalytics;
