import React, { useState } from 'react';

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

	const styles = {
		container: {
			padding: '2rem',
			backgroundColor: 'var(--surface)',
			minHeight: '100vh'
		},
		header: {
			marginBottom: '2rem'
		},
		title: {
			fontSize: '2rem',
			fontWeight: '700',
			color: 'var(--text-primary)',
			margin: 0,
			marginBottom: '0.5rem'
		},
		subtitle: {
			fontSize: '0.95rem',
			color: 'var(--text-secondary)',
			margin: 0
		},
		filterBar: {
			display: 'flex',
			gap: '0.5rem',
			marginBottom: '2rem',
			flexWrap: 'wrap'
		},
		filterButton: {
			padding: '0.6rem 1.2rem',
			border: '1px solid var(--border)',
			backgroundColor: 'white',
			borderRadius: 'var(--radius)',
			cursor: 'pointer',
			fontWeight: '500',
			transition: 'all 0.2s',
			fontSize: '0.9rem'
		},
		filterButtonActive: {
			padding: '0.6rem 1.2rem',
			border: 'none',
			backgroundColor: 'var(--primary)',
			color: 'white',
			borderRadius: 'var(--radius)',
			cursor: 'pointer',
			fontWeight: '500',
			transition: 'all 0.2s',
			fontSize: '0.9rem'
		},
		section: {
			backgroundColor: 'white',
			borderRadius: 'var(--radius-lg)',
			border: '1px solid var(--border)',
			boxShadow: 'var(--shadow-sm)',
			marginBottom: '2rem',
			overflow: 'hidden'
		},
		table: {
			width: '100%',
			borderCollapse: 'collapse'
		},
		tableHeader: {
			backgroundColor: 'var(--surface)',
			fontWeight: '600',
			color: 'var(--text-primary)',
			padding: '1rem 1.5rem',
			textAlign: 'left',
			borderBottom: '2px solid var(--border)',
			fontSize: '0.9rem'
		},
		tableRow: {
			borderBottom: '1px solid var(--border)',
			transition: 'background-color 0.2s',
			cursor: 'pointer'
		},
		tableRowHover: {
			backgroundColor: 'var(--primary-light)'
		},
		tableCell: {
			padding: '1rem 1.5rem',
			textAlign: 'left',
			fontSize: '0.9rem'
		},
		statusBadge: {
			display: 'inline-block',
			padding: '0.4rem 0.8rem',
			borderRadius: 'var(--radius)',
			fontSize: '0.8rem',
			fontWeight: '600',
			color: 'white'
		},
		modalOverlay: {
			display: 'none',
			position: 'fixed',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			backgroundColor: 'rgba(0,0,0,0.5)',
			zIndex: 1000,
			alignItems: 'center',
			justifyContent: 'center'
		},
		modalActive: {
			display: 'flex'
		},
		modal: {
			backgroundColor: 'white',
			borderRadius: 'var(--radius-lg)',
			padding: '2rem',
			maxWidth: '600px',
			width: '90%',
			maxHeight: '80vh',
			overflow: 'auto',
			boxShadow: 'var(--shadow-lg)'
		},
		modalHeader: {
			fontSize: '1.5rem',
			fontWeight: '700',
			color: 'var(--text-primary)',
			marginBottom: '1.5rem',
			paddingBottom: '1rem',
			borderBottom: '1px solid var(--border)',
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center'
		},
		modalGrid: {
			display: 'grid',
			gridTemplateColumns: '1fr 1fr',
			gap: '1.5rem',
			marginBottom: '1.5rem'
		},
		modalField: {
			gridColumn: 'auto'
		},
		modalFieldFull: {
			gridColumn: '1 / -1'
		},
		label: {
			display: 'block',
			fontSize: '0.85rem',
			fontWeight: '600',
			color: 'var(--text-secondary)',
			marginBottom: '0.4rem',
			textTransform: 'uppercase'
		},
		value: {
			fontSize: '0.95rem',
			color: 'var(--text-primary)',
			fontWeight: '500'
		},
		itemsList: {
			backgroundColor: 'var(--surface)',
			borderRadius: 'var(--radius)',
			padding: '1rem'
		},
		item: {
			display: 'flex',
			justifyContent: 'space-between',
			paddingBottom: '0.8rem',
			marginBottom: '0.8rem',
			borderBottom: '1px solid var(--border)'
		},
		itemName: {
			color: 'var(--text-primary)',
			fontWeight: '500'
		},
		itemPrice: {
			color: 'var(--primary)',
			fontWeight: '600'
		},
		actionButtons: {
			display: 'flex',
			gap: '0.8rem',
			marginTop: '1.5rem'
		},
		button: {
			flex: 1,
			padding: '0.8rem',
			border: 'none',
			borderRadius: 'var(--radius)',
			cursor: 'pointer',
			fontWeight: '600',
			transition: 'all 0.2s'
		},
		primaryButton: {
			backgroundColor: 'var(--primary)',
			color: 'white'
		},
		secondaryButton: {
			backgroundColor: 'white',
			border: '1px solid var(--border)',
			color: 'var(--text-primary)'
		},
		closeButton: {
			background: 'none',
			border: 'none',
			fontSize: '1.5rem',
			cursor: 'pointer',
			color: 'var(--text-secondary)'
		}
	};

	return (
		<div style={styles.container}>
			{/* Header */}
			<div style={styles.header}>
				<h1 style={styles.title}>Orders</h1>
				<p style={styles.subtitle}>Manage and track all customer orders</p>
			</div>

			{/* Filters */}
			<div style={styles.filterBar}>
				{['all', 'pending', 'confirmed', 'shipped', 'delivered'].map(status => (
					<button
						key={status}
						style={filterStatus === status ? styles.filterButtonActive : styles.filterButton}
						onClick={() => setFilterStatus(status)}
					>
						{getStatusLabel(status)}
					</button>
				))}
			</div>

			{/* Orders Table */}
			<div style={styles.section}>
				<table style={styles.table}>
					<thead>
						<tr>
							<th style={styles.tableHeader}>Order ID</th>
							<th style={styles.tableHeader}>Customer</th>
							<th style={styles.tableHeader}>Amount</th>
							<th style={styles.tableHeader}>Status</th>
							<th style={styles.tableHeader}>Date</th>
							<th style={styles.tableHeader}>Action</th>
						</tr>
					</thead>
					<tbody>
						{filteredOrders.map(order => (
							<tr key={order.id} style={styles.tableRow}>
								<td style={styles.tableCell}>
									<strong>{order.id}</strong>
								</td>
								<td style={styles.tableCell}>{order.customer}</td>
								<td style={styles.tableCell}>
									<strong>₹{order.amount.toLocaleString()}</strong>
								</td>
								<td style={styles.tableCell}>
									<div
										style={{
											...styles.statusBadge,
											backgroundColor: getStatusColor(order.status)
										}}
									>
										{getStatusLabel(order.status)}
									</div>
								</td>
								<td style={styles.tableCell}>{order.date}</td>
								<td style={styles.tableCell}>
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
			<div style={selectedOrder ? { ...styles.modalOverlay, ...styles.modalActive } : styles.modalOverlay}>
				{selectedOrder && (
					<div style={styles.modal}>
						<div style={styles.modalHeader}>
							<div>Order Details</div>
							<button
								style={styles.closeButton}
								onClick={() => setSelectedOrder(null)}
							>
								✕
							</button>
						</div>

						<div style={styles.modalGrid}>
							<div style={styles.modalField}>
								<div style={styles.label}>Order ID</div>
								<div style={styles.value}>{selectedOrder.id}</div>
							</div>
							<div style={styles.modalField}>
								<div style={styles.label}>Customer</div>
								<div style={styles.value}>{selectedOrder.customer}</div>
							</div>
							<div style={styles.modalField}>
								<div style={styles.label}>Date</div>
								<div style={styles.value}>{selectedOrder.date} {selectedOrder.time}</div>
							</div>
							<div style={styles.modalField}>
								<div style={styles.label}>Amount</div>
								<div style={{ ...styles.value, color: 'var(--primary)' }}>₹{selectedOrder.amount.toLocaleString()}</div>
							</div>
							<div style={styles.modalField}>
								<div style={styles.label}>Status</div>
								<div
									style={{
										...styles.statusBadge,
										backgroundColor: getStatusColor(selectedOrder.status),
										display: 'inline-block'
									}}
								>
									{getStatusLabel(selectedOrder.status)}
								</div>
							</div>
							<div style={styles.modalField}>
								<div style={styles.label}>Payment</div>
								<div style={{
									...styles.statusBadge,
									backgroundColor: selectedOrder.payment === 'paid' ? 'var(--success)' : 'var(--warning)',
									display: 'inline-block'
								}}>
									{selectedOrder.payment === 'paid' ? '✓ Paid' : '⏳ Pending'}
								</div>
							</div>
						</div>

						<div style={styles.modalFieldFull}>
							<div style={styles.label}>Items</div>
							<div style={styles.itemsList}>
								<div style={{ ...styles.item, borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
									<span style={styles.itemName}>{selectedOrder.items}</span>
								</div>
							</div>
						</div>

						{selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
							<div style={styles.modalFieldFull}>
								<div style={styles.label}>Update Status</div>
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

						<div style={styles.actionButtons}>
							<button style={{ ...styles.button, ...styles.secondaryButton }}>
								Print Invoice
							</button>
							<button style={{ ...styles.button, ...styles.secondaryButton }}>
								Send Message
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default VendorOrders;
