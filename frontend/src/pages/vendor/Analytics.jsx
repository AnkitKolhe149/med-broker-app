import React, { useEffect, useState } from 'react';
import VendorPageShell from '../../components/layout/VendorPageShell';
import vendorService from '../../services/vendor.service';
import styles from './Analytics.module.css';

function VendorAnalytics() {
	const [timeRange, setTimeRange] = useState('month');
	const [loading, setLoading] = useState(true);
	const [analyticsData, setAnalyticsData] = useState({
		totalSales: 0,
		totalOrders: 0,
		conversionRate: 3.45,
		avgOrderValue: 0,
		topProducts: [],
		salesTrend: [],
		regionData: []
	});

	useEffect(() => {
		const loadAnalytics = async () => {
			try {
				setLoading(true);
				const response = await vendorService.getAnalytics(timeRange);
				setAnalyticsData({
					totalSales: Math.round((response.metrics?.totalSalesCents || 0) / 100),
					totalOrders: response.metrics?.totalOrders || 0,
					conversionRate: response.metrics?.conversionRate || 0,
					avgOrderValue: Math.round((response.metrics?.avgOrderValueCents || 0) / 100),
					topProducts: (response.topProducts || []).map((p) => ({
						id: p.id,
						name: p.name,
						sales: p.unitsSold,
						revenue: Math.round((p.revenueCents || 0) / 100)
					})),
					salesTrend: (response.salesTrend || []).map((t) => ({
						month: t.label,
						sales: Math.round((t.salesCents || 0) / 100)
					})),
					regionData: (response.regionData || []).map((r) => ({
						region: r.region,
						orders: r.orders,
						revenue: Math.round((r.revenueCents || 0) / 100)
					}))
				});
			} catch (error) {
				console.error('Failed to load analytics data:', error);
			} finally {
				setLoading(false);
			}
		};

		loadAnalytics();
	}, [timeRange]);

	const maxSalesTrend = Math.max(...analyticsData.salesTrend.map((data) => data.sales), 1);
	const maxRegionOrders = Math.max(...analyticsData.regionData.map((region) => region.orders), 1);

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
			{loading && <div className={styles.chartCard}>Loading analytics...</div>}

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
						{analyticsData.salesTrend.length === 0 && <p>No trend data available.</p>}
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
										height: `${(data.sales / maxSalesTrend) * 250}px`
									}}
								>
									₹{(data.sales / 1000).toFixed(0)}K
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
						{analyticsData.regionData.length === 0 && <p>No region data available.</p>}
						{analyticsData.regionData.map((region, idx) => (
							<div key={idx} className={styles.regionItem}>
								<div className={styles.regionHeader}>
									<span className={styles.regionName}>{region.region}</span>
									<span className={styles.regionOrders}>{region.orders} orders</span>
								</div>
								<div className={styles.progressTrack}>
									<div
										style={{
											width: `${(region.orders / maxRegionOrders) * 100}%`,
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
						{analyticsData.topProducts.length === 0 && (
							<tr className={styles.tableRow}>
								<td className={styles.tableCell} colSpan={4}>No product performance data available.</td>
							</tr>
						)}
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
