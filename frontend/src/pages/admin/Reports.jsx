import React, { useEffect, useState } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import adminService from '../../services/admin.service';
import './AdminOperations.css';

const AdminReports = () => {
	const [report, setReport] = useState(null);
	const [loading, setLoading] = useState(true);
	const { formatCurrency } = useCurrency();

	useEffect(() => {
		const load = async () => {
			try {
				setLoading(true);
				const response = await adminService.getReportsOverview();
				setReport(response?.data || null);
			} catch (error) {
				console.error('Failed to load reports overview', error);
			} finally {
				setLoading(false);
			}
		};

		load();
	}, []);

	if (loading) return <div className="admin-loading"><div className="spinner"></div>Loading reports...</div>;
	if (!report) return <div className="admin-error">Unable to load report overview.</div>;

	return (
		<section className="admin-ops-page">
			<header className="page-header">
				<div>
					<h1>Reports & Analytics</h1>
					<p>Executive snapshot of growth, risk, and payment health.</p>
				</div>
			</header>

			<div className="admin-ops-summary">
				<div className="admin-ops-summary-card"><h4>Total Revenue</h4><p>{formatCurrency((report.summary?.totalRevenueCents || 0) / 100)}</p></div>
				<div className="admin-ops-summary-card"><h4>Paid Orders</h4><p>{report.summary?.paidOrders || 0}</p></div>
				<div className="admin-ops-summary-card"><h4>Cancelled Orders</h4><p>{report.summary?.cancelledOrders || 0}</p></div>
				<div className="admin-ops-summary-card"><h4>Refunded Payments</h4><p>{report.summary?.refundedPayments || 0}</p></div>
			</div>

			<div className="admin-ops-table-wrap">
				<table className="admin-table">
					<thead>
						<tr>
							<th>Month</th>
							<th>Paid Orders</th>
							<th>Revenue</th>
						</tr>
					</thead>
					<tbody>
						{(report.trends || []).map((item) => (
							<tr key={item.key}>
								<td>{item.label}</td>
								<td>{item.orders}</td>
								<td>{formatCurrency((item.revenueCents || 0) / 100)}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</section>
	);
};

export default AdminReports;
