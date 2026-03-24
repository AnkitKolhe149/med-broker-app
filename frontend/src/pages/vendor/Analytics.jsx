import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VendorPageShell from '../../components/layout/VendorPageShell';
import styles from './Analytics.module.css';

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

	return (
		<div className={styles.container}>
			<VendorPageShell
				title="Analytics & Insights"
				subtitle="Track performance trends and revenue signals"
				actions={(
					<div className={styles.timeRangeSelector}>
						{['week', 'month', 'quarter', 'year'].map(range => (
							<button
								key={range}
								className={`${styles.timeButton} ${timeRange === range ? styles.timeButtonActive : ''}`}
								onClick={() => setTimeRange(range)}
							>
								{range.charAt(0).toUpperCase() + range.slice(1)}
							</button>
						))}
					</div>
				)}
			>

			{/* Key Metrics */}
			<div className={styles.metricsGrid}>
				<div className={styles.metricCard}>
					<div className={styles.metricLabel}>Total Sales</div>
					<div className={styles.metricValue}>₹{analyticsData.totalSales.toLocaleString()}</div>
					<div className={styles.metricChange}>↑ 12.5% from last month</div>
				</div>
				<div className={styles.metricCard}>
					<div className={styles.metricLabel}>Total Orders</div>
					<div className={styles.metricValue}>{analyticsData.totalOrders}</div>
					<div className={styles.metricChange}>↑ 8.3% from last month</div>
				</div>
				<div className={styles.metricCard}>
					<div className={styles.metricLabel}>Avg Order Value</div>
					<div className={styles.metricValue}>₹{analyticsData.avgOrderValue.toFixed(2)}</div>
					<div className={styles.metricChange}>↑ 2.1% from last month</div>
				</div>
				<div className={styles.metricCard}>
					<div className={styles.metricLabel}>Conversion Rate</div>
					<div className={styles.metricValue}>{analyticsData.conversionRate}%</div>
					<div className={styles.metricChange}>↓ 0.5% from last month</div>
				</div>
			</div>

			{/* Charts */}
			<div className={styles.chartsGrid}>
				{/* Sales Trend */}
				<div className={styles.chartCard}>
					<div className={styles.chartTitle}>Sales Trend (Last 6 Months)</div>
					<div className={styles.chart}>
						{analyticsData.salesTrend.map((data, idx) => (
							<div key={idx} className={styles.salesBarContainer}>
								<div
									style={{
										...{
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
										height: `${(data.sales / 30000) * 250}px`
									}}
								>
									${(data.sales / 1000).toFixed(0)}K
								</div>
								<span className={styles.monthLabel}>{data.month}</span>
							</div>
						))}
					</div>
				</div>

				{/* Regional Performance */}
				<div className={styles.chartCard}>
					<div className={styles.chartTitle}>Orders by Region</div>
					<div>
						{analyticsData.regionData.map((region, idx) => (
							<div key={idx} className={styles.regionItem}>
								<div className={styles.regionHeader}>
									<span className={styles.regionName}>{region.region}</span>
									<span className={styles.regionOrders}>{region.orders} orders</span>
								</div>
								<div className={styles.progressTrack}>
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
			<div className={styles.tableCard}>
				<div className={styles.chartTitle}>Top Selling Products</div>
				<table className={styles.table}>
					<thead>
						<tr className={styles.tableHeadRow}>
							<th className={styles.tableHeader}>Product Name</th>
							<th className={styles.tableHeader}>Units Sold</th>
							<th className={styles.tableHeader}>Revenue</th>
							<th className={styles.tableHeader}>Action</th>
						</tr>
					</thead>
					<tbody>
						{analyticsData.topProducts.map((product, idx) => (
							<tr key={idx} className={styles.tableRow}>
								<td className={styles.tableCell}>
									<strong>{product.name}</strong>
								</td>
								<td className={styles.tableCell}>{product.sales}</td>
								<td className={styles.tableCell}>₹{product.revenue.toLocaleString()}</td>
								<td className={styles.tableCell}>
									<button className={styles.detailsButton}>
										View Details
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* AI Insights */}
			<div className={styles.insightBox}>
				<strong>💡 AI Insights:</strong> Based on current trends, your top-selling product (Paracetamol 500mg) has a rising demand in North India.
				Consider increasing inventory by 20% to avoid stockouts. Also, your Cetirizine 10mg could benefit from a 5-10% price optimization
				based on market competition.
			</div>
			</VendorPageShell>
		</div>
	);
}

export default VendorAnalytics;
