import React, { useEffect, useMemo, useState } from 'react';
import VendorPageShell from '../../components/layout/VendorPageShell';
import styles from './Shipping.module.css';
import { Clock, Package, Truck, Check, X, AlertTriangle, MapPin } from 'lucide-react';
import orderService from '../../services/order.service';
import { useNotification } from '../../context/NotificationContext';

function VendorShipping() {
	const { showError } = useNotification();
	const [shipments, setShipments] = useState([]);
	const [loading, setLoading] = useState(true);

	const [selectedShipment, setSelectedShipment] = useState(null);
	const [filters, setFilters] = useState('all');

	useEffect(() => {
		const loadShipments = async () => {
			try {
				setLoading(true);
				const result = await orderService.getVendorOrders({ page: 1, limit: 100 });
				const mapped = (result.orders || []).map((order, index) => {
					const shipmentStatus = order.status === 'shipped'
						? 'shipped'
						: order.status === 'paid'
							? 'pending'
							: order.status === 'cancelled'
								? 'failed'
								: 'delivered';

					return {
						id: index + 1,
						orderId: order.id,
						customer: order.customer || 'Customer',
						items: (order.items || []).map((item) => `${item.name} x ${item.quantity}`).join(', '),
						status: shipmentStatus,
						trackingId: order.id.slice(0, 12).toUpperCase(),
						carrier: 'MedIQ Logistics',
						estimatedDelivery: order.status === 'shipped' ? 'In progress' : 'Pending dispatch',
						shippedDate: order.createdAt ? new Date(order.createdAt).toISOString().slice(0, 10) : '-',
						deliveryDate: order.status === 'shipped' ? null : order.status === 'delivered' ? new Date().toISOString().slice(0, 10) : null
					};
				});

				setShipments(mapped);
			} catch (error) {
				console.error('Failed to load shipments:', error);
				showError(error?.response?.data?.message || 'Failed to load shipments');
			} finally {
				setLoading(false);
			}
		};

		loadShipments();
	}, [showError]);

	const getStatusColor = (status) => {
		switch(status) {
			case 'pending': return 'var(--warning)';
			case 'shipped': return 'var(--primary)';
			case 'in-transit': return 'var(--info)';
			case 'delivered': return 'var(--success)';
			case 'failed': return 'var(--error)';
			default: return 'var(--text-secondary)';
		}
	};

	const getStatusLabel = (status) => {
		switch(status) {
			case 'pending': return <><Clock size={12} strokeWidth={1.5} /> Pending</>;
			case 'shipped': return <><Package size={12} strokeWidth={1.5} /> Shipped</>;
			case 'in-transit': return <><Truck size={12} strokeWidth={1.5} /> In Transit</>;
			case 'delivered': return <><Check size={12} strokeWidth={1.5} /> Delivered</>;
			case 'failed': return <><X size={12} strokeWidth={1.5} /> Failed</>;
			default: return 'Unknown';
		}
	};

	const filteredShipments = useMemo(() => (
		filters === 'all' ? shipments : shipments.filter((s) => s.status === filters)
	), [shipments, filters]);

	return (
		<div className={styles.container}>
			<VendorPageShell
				title="Shipping & Logistics"
				subtitle="Manage shipments and track deliveries in real-time"
			>

			{/* Stats */}
			<div className={styles.shippingStats}>
				<div className={styles.statCard}>
					<div className={styles.statLabel}>Pending Shipments</div>
					<div className={styles.statNumber}>3</div>
					<small style={{ color: 'var(--warning)' }}><AlertTriangle size={12} strokeWidth={1.5} /> Action needed</small>
				</div>
				<div className={styles.statCard}>
					<div className={styles.statLabel}>In Transit</div>
					<div className={styles.statNumber}>5</div>
					<small style={{ color: 'var(--primary)' }}><MapPin size={12} strokeWidth={1.5} /> Being delivered</small>
				</div>
				<div className={styles.statCard}>
					<div className={styles.statLabel}>Delivered</div>
					<div className={styles.statNumber}>148</div>
					<small style={{ color: 'var(--success)' }}><Check size={12} strokeWidth={1.5} /> This month</small>
				</div>
				<div className={styles.statCard}>
					<div className={styles.statLabel}>Avg Delivery</div>
					<div className={styles.statNumber}>2.3d</div>
					<small style={{ color: 'var(--text-secondary)' }}>days</small>
				</div>
			</div>

			{/* Filters */}
			<div className={styles.filterBar}>
				{['all', 'pending', 'shipped', 'in-transit', 'delivered'].map(filter => (
					<button
						key={filter}
						className={filters === filter ? styles.filterButtonActive : styles.filterButton}
						onClick={() => setFilters(filter)}
					>
						{filter.replace('-', ' ').toUpperCase()}
					</button>
				))}
			</div>

			{/* Shipments Table */}
			<div className={styles.section}>
				<h2 className={styles.sectionTitle}>Shipments</h2>
				{loading ? (
					<div style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Loading shipment data...</div>
				) : (
				<table className={styles.table}>
					<thead>
						<tr style={{ backgroundColor: 'var(--surface)' }}>
							<th className={styles.tableHeader}>Order ID</th>
							<th className={styles.tableHeader}>Customer</th>
							<th className={styles.tableHeader}>Items</th>
							<th className={styles.tableHeader}>Carrier</th>
							<th className={styles.tableHeader}>Status</th>
							<th className={styles.tableHeader}>Est. Delivery</th>
							<th className={styles.tableHeader}>Action</th>
						</tr>
					</thead>
					<tbody>
						{filteredShipments.map(shipment => (
							<tr key={shipment.id} className={styles.tableRow}>
								<td className={styles.tableCell}>
									<strong>{shipment.orderId}</strong>
								</td>
								<td className={styles.tableCell}>{shipment.customer}</td>
								<td className={styles.tableCell}>{shipment.items}</td>
								<td className={styles.tableCell}>{shipment.carrier}</td>
								<td className={styles.tableCell}>
									<div
										className={styles.statusBadge}
										style={{
											backgroundColor: getStatusColor(shipment.status)
										}}
									>
										{getStatusLabel(shipment.status)}
									</div>
								</td>
								<td className={styles.tableCell}>{shipment.estimatedDelivery}</td>
								<td className={styles.tableCell}>
									<button
										style={{
											padding: '0.4rem 0.8rem',
											border: '1px solid var(--primary)',
											backgroundColor: 'white',
											color: 'var(--primary)',
											borderRadius: 'var(--radius)',
											cursor: 'pointer',
											fontSize: '0.85rem',
											fontWeight: '500'
										}}
										onClick={() => setSelectedShipment(shipment)}
									>
										View
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
				)}
			</div>

			{/* Shipment Details Modal */}
			<div className={selectedShipment ? `${styles.modalOverlay} ${styles.modalActive}` : styles.modalOverlay}>
				{selectedShipment && (
					<div className={styles.modal}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
							<h2 className={styles.modalHeader}>Shipment Details</h2>
							<button
								className={styles.closeButton}
								onClick={() => setSelectedShipment(null)}
							>
								<X size={16} strokeWidth={1.5} />
							</button>
						</div>

						<div className={styles.modalContent}>
							<div className={styles.modalField}>
								<div className={styles.label}>Order ID</div>
								<div className={styles.value}>{selectedShipment.orderId}</div>
							</div>
							<div className={styles.modalField}>
								<div className={styles.label}>Customer</div>
								<div className={styles.value}>{selectedShipment.customer}</div>
							</div>
							<div className={styles.modalField}>
								<div className={styles.label}>Carrier</div>
								<div className={styles.value}>{selectedShipment.carrier}</div>
							</div>
							<div className={styles.modalField}>
								<div className={styles.label}>Tracking ID</div>
								<div className={styles.value}>{selectedShipment.trackingId}</div>
							</div>
							<div className={styles.modalFieldFull}>
								<div className={styles.label}>Items</div>
								<div className={styles.value}>{selectedShipment.items}</div>
							</div>
						</div>

						<div className={styles.modalContent} style={{ marginBottom: '1.5rem' }}>
							<div className={styles.modalField}>
								<div className={styles.label}>Status</div>
								<div
									className={styles.statusBadge}
									style={{
										backgroundColor: getStatusColor(selectedShipment.status)
									}}
								>
									{getStatusLabel(selectedShipment.status)}
								</div>
							</div>
							<div className={styles.modalField}>
								<div className={styles.label}>Est. Delivery</div>
								<div className={styles.value}>{selectedShipment.estimatedDelivery}</div>
							</div>
						</div>

						<div style={{ marginBottom: '1.5rem' }}>
							<h3 style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>Tracking Timeline</h3>
							<div className={styles.timeline}>
								<div className={styles.timelineItem}>
									<div className={styles.timelineMarker}>1</div>
									<div className={styles.timelineContent}>
										<div className={styles.timelineTitle}>Shipped</div>
										<div className={styles.timelineDescription}>{selectedShipment.shippedDate}</div>
									</div>
								</div>
								{selectedShipment.status !== 'pending' && (
									<>
										<div className={styles.timelineItem}>
											<div className={styles.timelineMarker}>2</div>
											<div className={styles.timelineContent}>
												<div className={styles.timelineTitle}>In Transit</div>
												<div className={styles.timelineDescription}>Package is on its way</div>
											</div>
										</div>
										{(selectedShipment.status === 'delivered' || selectedShipment.status === 'in-transit') && (
											<div className={styles.timelineItem}>
												<div className={styles.timelineMarker}><Check size={14} strokeWidth={2} /></div>
												<div className={styles.timelineContent}>
													<div className={styles.timelineTitle}>
														{selectedShipment.status === 'delivered' ? 'Delivered' : 'Out for Delivery'}
													</div>
													<div className={styles.timelineDescription}>
														{selectedShipment.deliveryDate || 'Expected ' + selectedShipment.estimatedDelivery}
													</div>
												</div>
											</div>
										)}
									</>
								)}
							</div>
						</div>

						<div style={{ display: 'flex', gap: '1rem' }}>
							<button className={styles.button}>Print Label</button>
							<button className={styles.button} style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
								Contact Carrier
							</button>
						</div>
					</div>
				)}
			</div>
			</VendorPageShell>
		</div>
	);
}

export default VendorShipping;
