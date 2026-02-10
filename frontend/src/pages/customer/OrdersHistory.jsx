import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function OrdersHistory() {
	const navigate = useNavigate();
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState('all');
	const [expandedOrderId, setExpandedOrderId] = useState(null);

	// Sample orders data - will be fetched from API
	const sampleOrders = [
		{
			orderId: 'ORD1705432891234',
			date: '2024-01-16',
			status: 'delivered',
			total: 1250.50,
			items: [
				{ name: 'Paracetamol 500mg', quantity: 1, price: 45 },
				{ name: 'Amoxicillin 250mg', quantity: 2, price: 120 }
			],
			deliveredOn: '2024-01-18',
			deliveryAddress: 'Bangalore, Karnataka'
		},
		{
			orderId: 'ORD1705346291567',
			date: '2024-01-15',
			status: 'in_transit',
			total: 850.00,
			items: [
				{ name: 'Cetirizine 10mg', quantity: 1, price: 25 }
			],
			expectedDelivery: '2024-01-19',
			deliveryAddress: 'Mumbai, Maharashtra'
		},
		{
			orderId: 'ORD1705259891890',
			date: '2024-01-14',
			status: 'confirmed',
			total: 2100.75,
			items: [
				{ name: 'Omeprazole 20mg', quantity: 1, price: 85 },
				{ name: 'Metformin 500mg', quantity: 3, price: 60 }
			],
			expectedDelivery: '2024-01-17',
			deliveryAddress: 'Delhi, Delhi'
		},
		{
			orderId: 'ORD1705173491123',
			date: '2024-01-13',
			status: 'cancelled',
			total: 500.00,
			items: [
				{ name: 'Atorvastatin 10mg', quantity: 1, price: 95 }
			],
			cancelledOn: '2024-01-13',
			deliveryAddress: 'Pune, Maharashtra'
		}
	];

	useEffect(() => {
		loadOrders();
	}, []);

	const loadOrders = async () => {
		try {
			// In real app, fetch from API
			await new Promise(resolve => setTimeout(resolve, 500));
			setOrders(sampleOrders);
		} catch (error) {
			console.error('Failed to load orders:', error);
		} finally {
			setLoading(false);
		}
	};

	const getStatusColor = (status) => {
		switch (status) {
			case 'delivered':
				return 'var(--success)';
			case 'in_transit':
				return 'var(--info)';
			case 'confirmed':
				return 'var(--warning)';
			case 'cancelled':
				return 'var(--error)';
			default:
				return 'var(--text-secondary)';
		}
	};

	const getStatusIcon = (status) => {
		switch (status) {
			case 'delivered':
				return '✓';
			case 'in_transit':
				return '📦';
			case 'confirmed':
				return '⏳';
			case 'cancelled':
				return '✕';
			default:
				return '•';
		}
	};

	const getStatusLabel = (status) => {
		switch (status) {
			case 'delivered':
				return 'Delivered';
			case 'in_transit':
				return 'In Transit';
			case 'confirmed':
				return 'Confirmed';
			case 'cancelled':
				return 'Cancelled';
			default:
				return 'Unknown';
		}
	};

	const filteredOrders = filter === 'all' 
		? orders 
		: orders.filter(order => order.status === filter);

	if (loading) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
				<p>Loading orders...</p>
			</div>
		);
	}

	if (orders.length === 0) {
		return (
			<main className="page">
				<div className="container">
					<h1 className="section-title">My Orders</h1>
					<div style={styles.emptyState}>
						<div style={styles.emptyIcon}>📦</div>
						<p style={styles.emptyTitle}>No orders yet</p>
						<p style={styles.emptyText}>
							Start shopping to see your orders here
						</p>
						<button className="button" onClick={() => navigate('/customer/catalog')}>
							Browse Medicines
						</button>
					</div>
				</div>
			</main>
		);
	}

	return (
		<main className="page">
			<div className="container">
				<h1 className="section-title">My Orders</h1>

				{/* Filter Buttons */}
				<div style={styles.filterContainer}>
					<button
						onClick={() => setFilter('all')}
						style={{
							...styles.filterButton,
							backgroundColor: filter === 'all' ? 'var(--primary)' : 'var(--surface)',
							color: filter === 'all' ? 'white' : 'var(--text-primary)',
							borderColor: filter === 'all' ? 'var(--primary)' : 'var(--border)'
						}}
					>
						All Orders ({orders.length})
					</button>
					<button
						onClick={() => setFilter('confirmed')}
						style={{
							...styles.filterButton,
							backgroundColor: filter === 'confirmed' ? '#F59E0B' : 'var(--surface)',
							color: filter === 'confirmed' ? 'white' : 'var(--text-primary)',
							borderColor: filter === 'confirmed' ? '#F59E0B' : 'var(--border)'
						}}
					>
						Confirmed
					</button>
					<button
						onClick={() => setFilter('in_transit')}
						style={{
							...styles.filterButton,
							backgroundColor: filter === 'in_transit' ? 'var(--secondary)' : 'var(--surface)',
							color: filter === 'in_transit' ? 'white' : 'var(--text-primary)',
							borderColor: filter === 'in_transit' ? 'var(--secondary)' : 'var(--border)'
						}}
					>
						In Transit
					</button>
					<button
						onClick={() => setFilter('delivered')}
						style={{
							...styles.filterButton,
							backgroundColor: filter === 'delivered' ? 'var(--success)' : 'var(--surface)',
							color: filter === 'delivered' ? 'white' : 'var(--text-primary)',
							borderColor: filter === 'delivered' ? 'var(--success)' : 'var(--border)'
						}}
					>
						Delivered
					</button>
					<button
						onClick={() => setFilter('cancelled')}
						style={{
							...styles.filterButton,
							backgroundColor: filter === 'cancelled' ? 'var(--error)' : 'var(--surface)',
							color: filter === 'cancelled' ? 'white' : 'var(--text-primary)',
							borderColor: filter === 'cancelled' ? 'var(--error)' : 'var(--border)'
						}}
					>
						Cancelled
					</button>
				</div>

				{/* Orders List */}
				<div style={styles.ordersList}>
					{filteredOrders.map(order => (
						<div key={order.orderId} style={styles.orderCard}>
							{/* Header */}
							<div style={styles.orderHeader}>
								<div style={styles.orderInfo}>
									<p style={styles.orderId}>{order.orderId}</p>
									<p style={styles.orderDate}>{new Date(order.date).toLocaleDateString('en-IN')}</p>
								</div>

								<div style={styles.orderStatus}>
									<span
										style={{
											...styles.statusBadge,
											backgroundColor: getStatusColor(order.status),
											color: order.status === 'cancelled' ? 'white' : 'white'
										}}
									>
										{getStatusIcon(order.status)} {getStatusLabel(order.status)}
									</span>
								</div>

								<button
									onClick={() => setExpandedOrderId(expandedOrderId === order.orderId ? null : order.orderId)}
									style={styles.expandButton}
								>
									{expandedOrderId === order.orderId ? '▼' : '▶'}
								</button>
							</div>

							{/* Quick Summary */}
							<div style={styles.orderSummary}>
								<div>
									<p style={styles.itemCount}>{order.items.length} item(s)</p>
									<p style={styles.deliveryAddress}>📍 {order.deliveryAddress}</p>
								</div>
								<div style={styles.amountSection}>
									<p style={styles.totalLabel}>Total</p>
									<p style={styles.totalAmount}>₹{order.total.toFixed(2)}</p>
								</div>
							</div>

							{/* Expanded Details */}
							{expandedOrderId === order.orderId && (
								<div style={styles.expandedDetails}>
									<hr style={styles.divider} />

									{/* Items List */}
									<div style={styles.itemsSection}>
										<h3 style={styles.sectionTitle}>Items</h3>
										{order.items.map((item, idx) => (
											<div key={idx} style={styles.itemRow}>
												<div>
													<p style={styles.itemName}>{item.name}</p>
													<p style={styles.itemQty}>Qty: {item.quantity}</p>
												</div>
												<p style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(2)}</p>
											</div>
										))}
									</div>

									<hr style={styles.divider} />

									{/* Status Timeline */}
									<div style={styles.statusSection}>
										<h3 style={styles.sectionTitle}>Status</h3>
										{order.status === 'delivered' && (
											<p style={styles.statusText}>
												✓ Delivered on {new Date(order.deliveredOn).toLocaleDateString('en-IN')}
											</p>
										)}
										{order.status === 'in_transit' && (
											<p style={styles.statusText}>
												📦 Expected delivery by {new Date(order.expectedDelivery).toLocaleDateString('en-IN')}
											</p>
										)}
										{order.status === 'confirmed' && (
											<p style={styles.statusText}>
												⏳ Order confirmed. Expected delivery by {new Date(order.expectedDelivery).toLocaleDateString('en-IN')}
											</p>
										)}
										{order.status === 'cancelled' && (
											<p style={styles.statusText}>
												✕ Order cancelled on {new Date(order.cancelledOn).toLocaleDateString('en-IN')}
											</p>
										)}
									</div>

									<hr style={styles.divider} />

									{/* Actions */}
									<div style={styles.actions}>
										{order.status === 'delivered' && (
											<>
												<button style={styles.actionButton}>📥 Download Invoice</button>
												<button style={styles.actionButton}>⭐ Rate Order</button>
											</>
										)}
										{order.status === 'in_transit' && (
											<button style={styles.actionButton}>📍 Track Shipment</button>
										)}
										{order.status === 'cancelled' && (
											<button style={styles.actionButton}>💬 View Cancellation Reason</button>
										)}
										<button style={styles.helpButton}>❓ Help & Support</button>
									</div>
								</div>
							)}
						</div>
					))}
				</div>

				{filteredOrders.length === 0 && (
					<div style={styles.noResults}>
						<p>No {filter !== 'all' ? filter.replace('_', ' ') : ''} orders found</p>
					</div>
				)}
			</div>
		</main>
	);
}

const styles = {
	filterContainer: {
		display: 'flex',
		gap: '0.75rem',
		marginBottom: '1.5rem',
		flexWrap: 'wrap'
	},
	filterButton: {
		padding: '0.5rem 1rem',
		borderRadius: 'var(--radius)',
		border: '1px solid var(--border)',
		cursor: 'pointer',
		fontWeight: '500',
		fontSize: '0.9rem',
		transition: 'all 0.2s'
	},
	ordersList: {
		display: 'flex',
		flexDirection: 'column',
		gap: '1rem'
	},
	orderCard: {
		backgroundColor: 'white',
		borderRadius: 'var(--radius-lg)',
		border: '1px solid var(--border)',
		boxShadow: 'var(--shadow-sm)',
		overflow: 'hidden'
	},
	orderHeader: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: '1.25rem',
		backgroundColor: 'var(--surface)',
		borderBottom: '1px solid var(--border)',
		cursor: 'pointer'
	},
	orderInfo: {
		flex: 1
	},
	orderId: {
		fontSize: '0.95rem',
		fontWeight: '700',
		color: 'var(--text-primary)',
		margin: 0,
		fontFamily: 'monospace',
		letterSpacing: '0.5px'
	},
	orderDate: {
		fontSize: '0.8rem',
		color: 'var(--text-secondary)',
		margin: '0.25rem 0 0 0'
	},
	orderStatus: {
		flex: 0,
		marginLeft: '1rem'
	},
	statusBadge: {
		display: 'inline-block',
		padding: '0.4rem 0.8rem',
		borderRadius: 'var(--radius)',
		fontSize: '0.8rem',
		fontWeight: '600',
		whiteSpace: 'nowrap'
	},
	expandButton: {
		background: 'none',
		border: 'none',
		cursor: 'pointer',
		fontSize: '1rem',
		marginLeft: '1rem',
		color: 'var(--text-secondary)',
		padding: '0'
	},
	orderSummary: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: '1rem 1.25rem'
	},
	itemCount: {
		fontSize: '0.9rem',
		fontWeight: '600',
		color: 'var(--text-primary)',
		margin: 0
	},
	deliveryAddress: {
		fontSize: '0.85rem',
		color: 'var(--text-secondary)',
		margin: '0.5rem 0 0 0'
	},
	amountSection: {
		textAlign: 'right'
	},
	totalLabel: {
		fontSize: '0.8rem',
		color: 'var(--text-secondary)',
		margin: 0
	},
	totalAmount: {
		fontSize: '1.2rem',
		fontWeight: '700',
		color: 'var(--primary)',
		margin: '0.25rem 0 0 0'
	},
	expandedDetails: {
		padding: '1.25rem',
		backgroundColor: 'var(--background)'
	},
	divider: {
		border: 'none',
		borderTop: '1px solid var(--border)',
		margin: '1rem 0'
	},
	itemsSection: {
		marginBottom: '1rem'
	},
	sectionTitle: {
		fontSize: '0.95rem',
		fontWeight: '600',
		color: 'var(--text-primary)',
		margin: '0 0 0.75rem 0'
	},
	itemRow: {
		display: 'flex',
		justifyContent: 'space-between',
		padding: '0.5rem 0',
		fontSize: '0.9rem'
	},
	itemName: {
		fontWeight: '500',
		color: 'var(--text-primary)',
		margin: 0
	},
	itemQty: {
		fontSize: '0.8rem',
		color: 'var(--text-secondary)',
		margin: '0.25rem 0 0 0'
	},
	itemPrice: {
		fontWeight: '600',
		color: 'var(--primary)',
		margin: 0
	},
	statusSection: {
		marginBottom: '1rem'
	},
	statusText: {
		fontSize: '0.9rem',
		color: 'var(--text-secondary)',
		margin: 0,
		lineHeight: '1.5'
	},
	actions: {
		display: 'flex',
		gap: '0.75rem',
		flexWrap: 'wrap'
	},
	actionButton: {
		padding: '0.5rem 1rem',
		backgroundColor: 'var(--primary)',
		color: 'white',
		border: 'none',
		borderRadius: 'var(--radius)',
		fontSize: '0.85rem',
		fontWeight: '500',
		cursor: 'pointer'
	},
	helpButton: {
		padding: '0.5rem 1rem',
		backgroundColor: 'var(--surface)',
		color: 'var(--text-primary)',
		border: '1px solid var(--border)',
		borderRadius: 'var(--radius)',
		fontSize: '0.85rem',
		fontWeight: '500',
		cursor: 'pointer'
	},
	emptyState: {
		textAlign: 'center',
		padding: '3rem 1rem'
	},
	emptyIcon: {
		fontSize: '3rem',
		marginBottom: '1rem'
	},
	emptyTitle: {
		fontSize: '1.2rem',
		fontWeight: '600',
		color: 'var(--text-primary)',
		marginBottom: '0.5rem'
	},
	emptyText: {
		color: 'var(--text-secondary)',
		marginBottom: '1.5rem'
	},
	noResults: {
		textAlign: 'center',
		padding: '2rem',
		color: 'var(--text-secondary)'
	}
};

export default OrdersHistory;
