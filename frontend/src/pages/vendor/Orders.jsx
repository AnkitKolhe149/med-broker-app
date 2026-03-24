import React, { useState } from 'react';
import VendorPageShell from '../../components/layout/VendorPageShell';
import styles from './Orders.module.css';

function VendorOrders() {
	const [orders, setOrders] = useState([
		{
			id: 'ORD-001234',
			customer: 'Dr. Rajesh Kumar',
			amount: 2450,
			items: 'Paracetamol 500mg x 2, Aspirin 100mg x 1',
			status: 'pending',
			date: '2024-01-15',
			time: '10:30 AM',
			payment: 'paid'
		},
		{
			id: 'ORD-001235',
			customer: 'Health Plus Clinic',
			amount: 5600,
			items: 'Amoxicillin 250mg x 5, Cephalexin 500mg x 3',
			status: 'confirmed',
			date: '2024-01-15',
			time: '09:15 AM',
			payment: 'paid'
		},
		{
			id: 'ORD-001236',
			customer: 'Healing Hospital',
			amount: 8900,
			items: 'Ciprofloxacin 500mg x 10, Metronidazole 400mg x 5',
			status: 'shipped',
			date: '2024-01-14',
			time: '02:45 PM',
			payment: 'paid'
		},
		{
			id: 'ORD-001237',
			customer: 'City Medical Center',
			amount: 3200,
			items: 'Cetirizine 10mg x 3, Loratadine 10mg x 2',
			status: 'delivered',
			date: '2024-01-13',
			time: '11:20 AM',
			payment: 'paid'
		},
		{
			id: 'ORD-001238',
			customer: 'Dr. Sarah Singh',
			amount: 1850,
			items: 'Atorvastatin 20mg x 1, Metformin 500mg x 1',
			status: 'pending',
			date: '2024-01-15',
			time: '08:50 AM',
			payment: 'pending'
		}
	]);

	const [selectedOrder, setSelectedOrder] = useState(null);
	const [filterStatus, setFilterStatus] = useState('all');

	const getStatusColor = (status) => {
		switch(status) {
			case 'pending': return 'var(--warning)';
			case 'confirmed': return 'var(--primary)';
			case 'shipped': return 'var(--info)';
			case 'delivered': return 'var(--success)';
			case 'cancelled': return 'var(--error)';
			default: return 'var(--text-secondary)';
		}
	};

	const getStatusLabel = (status) => {
		switch(status) {
			case 'pending': return '⏳ Pending';
			case 'confirmed': return '✓ Confirmed';
			case 'shipped': return '📦 Shipped';
			case 'delivered': return '✓ Delivered';
			case 'cancelled': return '✗ Cancelled';
			default: return 'Unknown';
		}
	};

	const updateOrderStatus = (orderId, newStatus) => {
		setOrders(orders.map(order =>
			order.id === orderId ? { ...order, status: newStatus } : order
		));
		setSelectedOrder(null);
	};

	const filteredOrders = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);

	return (
		<div className={styles.container}>
			<VendorPageShell
				title="Orders"
				subtitle="Manage and track all customer orders"
			>

			{/* Filters */}
			<div className={styles.filterBar}>
				{['all', 'pending', 'confirmed', 'shipped', 'delivered'].map(status => (
					<button
						key={status}
						className={filterStatus === status ? styles.filterButtonActive : styles.filterButton}
						onClick={() => setFilterStatus(status)}
					>
						{getStatusLabel(status)}
					</button>
				))}
			</div>

			{/* Orders Table */}
			<div className={styles.section}>
				<table className={styles.table}>
					<thead>
						<tr>
							<th className={styles.tableHeader}>Order ID</th>
							<th className={styles.tableHeader}>Customer</th>
							<th className={styles.tableHeader}>Amount</th>
							<th className={styles.tableHeader}>Status</th>
							<th className={styles.tableHeader}>Date</th>
							<th className={styles.tableHeader}>Action</th>
						</tr>
					</thead>
					<tbody>
						{filteredOrders.map(order => (
							<tr key={order.id} className={styles.tableRow}>
								<td className={styles.tableCell}>
									<strong>{order.id}</strong>
								</td>
								<td className={styles.tableCell}>{order.customer}</td>
								<td className={styles.tableCell}>
									<strong>₹{order.amount.toLocaleString()}</strong>
								</td>
								<td className={styles.tableCell}>
									<div
										className={styles.statusBadge}
										style={{
											backgroundColor: getStatusColor(order.status)
										}}
									>
										{getStatusLabel(order.status)}
									</div>
								</td>
								<td className={styles.tableCell}>{order.date}</td>
								<td className={styles.tableCell}>
									<button
										style={{
											padding: '0.4rem 0.8rem',
											backgroundColor: 'var(--primary)',
											color: 'white',
											border: 'none',
											borderRadius: 'var(--radius)',
											cursor: 'pointer',
											fontSize: '0.85rem',
											fontWeight: '500'
										}}
										onClick={() => setSelectedOrder(order)}
									>
										View
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Order Details Modal */}
			<div className={selectedOrder ? `${styles.modalOverlay} ${styles.modalActive}` : styles.modalOverlay}>
				{selectedOrder && (
					<div className={styles.modal}>
						<div className={styles.modalHeader}>
							<div>Order Details</div>
							<button
								className={styles.closeButton}
								onClick={() => setSelectedOrder(null)}
							>
								✕
							</button>
						</div>

						<div className={styles.modalGrid}>
							<div className={styles.modalField}>
								<div className={styles.label}>Order ID</div>
								<div className={styles.value}>{selectedOrder.id}</div>
							</div>
							<div className={styles.modalField}>
								<div className={styles.label}>Customer</div>
								<div className={styles.value}>{selectedOrder.customer}</div>
							</div>
							<div className={styles.modalField}>
								<div className={styles.label}>Date</div>
								<div className={styles.value}>{selectedOrder.date} {selectedOrder.time}</div>
							</div>
							<div className={styles.modalField}>
								<div className={styles.label}>Amount</div>
								<div className={styles.value} style={{ color: 'var(--primary)' }}>₹{selectedOrder.amount.toLocaleString()}</div>
							</div>
							<div className={styles.modalField}>
								<div className={styles.label}>Status</div>
								<div
									className={styles.statusBadge}
									style={{
										backgroundColor: getStatusColor(selectedOrder.status)
									}}
								>
									{getStatusLabel(selectedOrder.status)}
								</div>
							</div>
							<div className={styles.modalField}>
								<div className={styles.label}>Payment</div>
								<div className={styles.statusBadge} style={{
									backgroundColor: selectedOrder.payment === 'paid' ? 'var(--success)' : 'var(--warning)'
								}}>
									{selectedOrder.payment === 'paid' ? '✓ Paid' : '⏳ Pending'}
								</div>
							</div>
						</div>

						<div className={styles.modalFieldFull}>
							<div className={styles.label}>Items</div>
							<div className={styles.itemsList}>
								<div className={styles.item} style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
									<span className={styles.itemName}>{selectedOrder.items}</span>
								</div>
							</div>
						</div>

						{selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
							<div className={styles.modalFieldFull}>
								<div className={styles.label}>Update Status</div>
								<select
									style={{
										width: '100%',
										padding: '0.8rem',
										border: '1px solid var(--border)',
										borderRadius: 'var(--radius)',
										fontFamily: 'inherit',
										backgroundColor: 'white'
									}}
									defaultValue={selectedOrder.status}
									onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
								>
									{selectedOrder.status === 'pending' && (
										<>
											<option value="pending">Pending</option>
											<option value="confirmed">Confirm Order</option>
											<option value="cancelled">Cancel Order</option>
										</>
									)}
									{selectedOrder.status === 'confirmed' && (
										<>
											<option value="confirmed">Confirmed</option>
											<option value="shipped">Mark as Shipped</option>
										</>
									)}
									{selectedOrder.status === 'shipped' && (
										<>
											<option value="shipped">Shipped</option>
											<option value="delivered">Mark as Delivered</option>
										</>
									)}
								</select>
							</div>
						)}

						<div className={styles.actionButtons}>
							<button className={`${styles.button} ${styles.secondaryButton}`}>
								Print Invoice
							</button>
							<button className={`${styles.button} ${styles.secondaryButton}`}>
								Send Message
							</button>
						</div>
					</div>
				)}
			</div>
			</VendorPageShell>
		</div>
	);
}

export default VendorOrders;
