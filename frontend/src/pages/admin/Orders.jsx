import React, { useEffect, useState } from 'react';
import adminService from '../../services/admin.service';
import { useCurrency } from '../../context/CurrencyContext';
import './AdminOperations.css';

const AdminOrders = () => {
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState('');
	const [updatingId, setUpdatingId] = useState(null);
	const { formatCurrency } = useCurrency();

	const loadOrders = async () => {
		try {
			setLoading(true);
			const response = await adminService.getAdminOrders({ status: statusFilter || undefined, limit: 30 });
			setOrders(response?.data || []);
		} catch (error) {
			console.error('Failed to load admin orders', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadOrders();
	}, [statusFilter]);

	const handleStatusChange = async (orderId, status) => {
		try {
			setUpdatingId(orderId);
			await adminService.updateOrderStatus(orderId, status);
			await loadOrders();
		} catch (error) {
			console.error('Failed to update order status', error);
			alert(error?.response?.data?.message || 'Failed to update order status');
		} finally {
			setUpdatingId(null);
		}
	};

	if (loading) return <div className="admin-loading"><div className="spinner"></div>Loading orders...</div>;

	return (
		<section className="admin-ops-page">
			<header className="page-header">
				<div>
					<h1>Order Management</h1>
					<p>Review, filter and update marketplace orders.</p>
				</div>
			</header>

			<div className="admin-ops-toolbar">
				<select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
					<option value="">All statuses</option>
					<option value="PENDING">Pending</option>
					<option value="PAID">Paid</option>
					<option value="SHIPPED">Shipped</option>
					<option value="CANCELLED">Cancelled</option>
				</select>
			</div>

			<div className="admin-ops-table-wrap">
				<table className="admin-table">
					<thead>
						<tr>
							<th>Order</th>
							<th>Customer</th>
							<th>Items</th>
							<th>Total</th>
							<th>Status</th>
							<th>Payment</th>
							<th>Action</th>
						</tr>
					</thead>
					<tbody>
						{orders.map((order) => (
							<tr key={order.id}>
								<td>
									<strong>{order.id.slice(0, 8)}</strong>
									<div className="admin-muted">{new Date(order.createdAt).toLocaleString()}</div>
								</td>
								<td>{order.user?.name || order.user?.email || 'Customer'}</td>
								<td>{order.items?.length || 0}</td>
								<td>{formatCurrency((order.totalCents || 0) / 100)}</td>
								<td><span className={`admin-pill ${String(order.status || '').toLowerCase()}`}>{order.status}</span></td>
								<td><span className={`admin-pill ${String(order.payment?.status || 'INITIATED').toLowerCase()}`}>{order.payment?.status || 'INITIATED'}</span></td>
								<td>
									<div className="admin-ops-actions">
										<button className="btn btn-secondary" disabled={updatingId === order.id} onClick={() => handleStatusChange(order.id, 'SHIPPED')}>Ship</button>
										<button className="btn btn-secondary" disabled={updatingId === order.id} onClick={() => handleStatusChange(order.id, 'CANCELLED')}>Cancel</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</section>
	);
};

export default AdminOrders;
