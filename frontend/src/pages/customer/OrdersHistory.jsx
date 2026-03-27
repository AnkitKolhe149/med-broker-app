import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../../components/common/Avatar';
import { useUser } from '../../context/UserContext';
import { formatCurrency } from '../../utils/currency';
import styles from './OrdersHistory.module.css';

function OrdersHistory() {
	const navigate = useNavigate();
	const { user } = useUser();
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState('all');
	const [expandedOrderId, setExpandedOrderId] = useState(null);
	const defaultCurrencyCode = localStorage.getItem('preferredCurrency') || 'USD';
	const formatPrice = (value, currencyCode = defaultCurrencyCode) => formatCurrency(value, currencyCode, true);

	// Sample orders data - will be fetched from API
	const sampleOrders = [
		{
			orderId: 'ORD1705432891234',
			date: '2024-01-16',
			status: 'delivered',
			currencyCode: defaultCurrencyCode,
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
			currencyCode: defaultCurrencyCode,
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
			currencyCode: defaultCurrencyCode,
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
			currencyCode: defaultCurrencyCode,
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
					<div className="page-header">
						<div className="title-group">
							<h1 className="section-title">My Orders</h1>
						</div>
					</div>
					<div className={styles.emptyState}>
						<div className={styles.emptyIcon}>📦</div>
						<p className={styles.emptyTitle}>No orders yet</p>
						<p className={styles.emptyText}>
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
				<div className="page-header">
					<div className="title-group">
						<h1 className="section-title">My Orders</h1>
						<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
							<Avatar 
								src={user?.customer?.profileImage}
								name={user?.customer?.fullName}
								size={30}
							/>
							<p className="section-subtitle">{user?.customer?.fullName || user?.email}</p>
						</div>
					</div>
				</div>

				{/* Filter Buttons */}
				<div className={styles.filterContainer}>
					<button
						onClick={() => setFilter('all')}
						className={styles.filterButton}
						style={{
							backgroundColor: filter === 'all' ? 'var(--primary)' : 'var(--surface)',
							color: filter === 'all' ? 'white' : 'var(--text-primary)',
							borderColor: filter === 'all' ? 'var(--primary)' : 'var(--border)'
						}}
					>
						All Orders ({orders.length})
					</button>
					<button
						onClick={() => setFilter('confirmed')}
						className={styles.filterButton}
						style={{
							backgroundColor: filter === 'confirmed' ? '#F59E0B' : 'var(--surface)',
							color: filter === 'confirmed' ? 'white' : 'var(--text-primary)',
							borderColor: filter === 'confirmed' ? '#F59E0B' : 'var(--border)'
						}}
					>
						Confirmed
					</button>
					<button
						onClick={() => setFilter('in_transit')}
						className={styles.filterButton}
						style={{
							backgroundColor: filter === 'in_transit' ? 'var(--secondary)' : 'var(--surface)',
							color: filter === 'in_transit' ? 'white' : 'var(--text-primary)',
							borderColor: filter === 'in_transit' ? 'var(--secondary)' : 'var(--border)'
						}}
					>
						In Transit
					</button>
					<button
						onClick={() => setFilter('delivered')}
						className={styles.filterButton}
						style={{
							backgroundColor: filter === 'delivered' ? 'var(--success)' : 'var(--surface)',
							color: filter === 'delivered' ? 'white' : 'var(--text-primary)',
							borderColor: filter === 'delivered' ? 'var(--success)' : 'var(--border)'
						}}
					>
						Delivered
					</button>
					<button
						onClick={() => setFilter('cancelled')}
						className={styles.filterButton}
						style={{
							backgroundColor: filter === 'cancelled' ? 'var(--error)' : 'var(--surface)',
							color: filter === 'cancelled' ? 'white' : 'var(--text-primary)',
							borderColor: filter === 'cancelled' ? 'var(--error)' : 'var(--border)'
						}}
					>
						Cancelled
					</button>
				</div>

				{/* Orders List */}
				<div className={styles.ordersList}>
					{filteredOrders.map(order => (
						<div key={order.orderId} className={styles.orderCard}>
							{/* Header */}
							<div className={styles.orderHeader}>
								<div className={styles.orderInfo}>
									<p className={styles.orderId}>{order.orderId}</p>
									<p className={styles.orderDate}>{new Date(order.date).toLocaleDateString('en-IN')}</p>
								</div>

								<div className={styles.orderStatus}>
									<span
										className={styles.statusBadge}
										style={{
											backgroundColor: getStatusColor(order.status),
											color: order.status === 'cancelled' ? 'white' : 'white'
										}}
									>
										{getStatusIcon(order.status)} {getStatusLabel(order.status)}
									</span>
								</div>

								<button
									onClick={() => setExpandedOrderId(expandedOrderId === order.orderId ? null : order.orderId)}
									className={styles.expandButton}
								>
									{expandedOrderId === order.orderId ? '▼' : '▶'}
								</button>
							</div>

							{/* Quick Summary */}
							<div className={styles.orderSummary}>
								<div>
									<p className={styles.itemCount}>{order.items.length} item(s)</p>
									<p className={styles.deliveryAddress}>📍 {order.deliveryAddress}</p>
								</div>
								<div className={styles.amountSection}>
									<p className={styles.totalLabel}>Total</p>
									<p className={styles.totalAmount}>{formatPrice(order.total, order.currencyCode)}</p>
								</div>
							</div>

							{/* Expanded Details */}
							{expandedOrderId === order.orderId && (
								<div className={styles.expandedDetails}>
									<hr className={styles.divider} />

									{/* Items List */}
									<div className={styles.itemsSection}>
										<h3 className={styles.sectionTitle}>Items</h3>
										{order.items.map((item, idx) => (
											<div key={idx} className={styles.itemRow}>
												<div>
													<p className={styles.itemName}>{item.name}</p>
													<p className={styles.itemQty}>Qty: {item.quantity}</p>
												</div>
												<p className={styles.itemPrice}>{formatPrice(item.price * item.quantity, order.currencyCode)}</p>
											</div>
										))}
									</div>

									<hr className={styles.divider} />

									{/* Status Timeline */}
									<div className={styles.statusSection}>
										<h3 className={styles.sectionTitle}>Status</h3>
										{order.status === 'delivered' && (
											<p className={styles.statusText}>
												✓ Delivered on {new Date(order.deliveredOn).toLocaleDateString('en-IN')}
											</p>
										)}
										{order.status === 'in_transit' && (
											<p className={styles.statusText}>
												📦 Expected delivery by {new Date(order.expectedDelivery).toLocaleDateString('en-IN')}
											</p>
										)}
										{order.status === 'confirmed' && (
											<p className={styles.statusText}>
												⏳ Order confirmed. Expected delivery by {new Date(order.expectedDelivery).toLocaleDateString('en-IN')}
											</p>
										)}
										{order.status === 'cancelled' && (
											<p className={styles.statusText}>
												✕ Order cancelled on {new Date(order.cancelledOn).toLocaleDateString('en-IN')}
											</p>
										)}
									</div>

									<hr className={styles.divider} />

									{/* Actions */}
									<div className={styles.actions}>
										{order.status === 'delivered' && (
											<>
												<button className={styles.actionButton}>📥 Download Invoice</button>
												<button className={styles.actionButton}>⭐ Rate Order</button>
											</>
										)}
										{order.status === 'in_transit' && (
											<button className={styles.actionButton}>📍 Track Shipment</button>
										)}
										{order.status === 'cancelled' && (
											<button className={styles.actionButton}>💬 View Cancellation Reason</button>
										)}
										<button className={styles.helpButton}>❓ Help & Support</button>
									</div>
								</div>
							)}
						</div>
					))}
				</div>

				{filteredOrders.length === 0 && (
					<div className={styles.noResults}>
						<p>No {filter !== 'all' ? filter.replace('_', ' ') : ''} orders found</p>
					</div>
				)}
			</div>
		</main>
	);
}

export default OrdersHistory;
