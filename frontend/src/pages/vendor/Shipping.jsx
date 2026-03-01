import React, { useState } from 'react';

function VendorShipping() {
	const [shipments, setShipments] = useState([
		{
			id: 1,
			orderId: 'ORD-001234',
			customer: 'Dr. Rajesh Kumar',
			items: 'Paracetamol 500mg x 2',
			status: 'shipped',
			trackingId: 'DHL123456789',
			carrier: 'DHL Express',
			estimatedDelivery: '2024-01-17',
			shippedDate: '2024-01-15'
		},
		{
			id: 2,
			orderId: 'ORD-001235',
			customer: 'Healing Hospital',
			items: 'Amoxicillin 250mg x 5',
			status: 'in-transit',
			trackingId: 'FDX987654321',
			carrier: 'FedEx',
			estimatedDelivery: '2024-01-18',
			shippedDate: '2024-01-14'
		},
		{
			id: 3,
			orderId: 'ORD-001236',
			customer: 'Health Plus Clinic',
			items: 'Cetirizine 10mg x 3',
			status: 'delivered',
			trackingId: 'SPL111222333',
			carrier: 'Spoton',
			deliveryDate: '2024-01-14',
			shippedDate: '2024-01-12'
		}
	]);

	const [selectedShipment, setSelectedShipment] = useState(null);
	const [filters, setFilters] = useState('all');

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
			case 'pending': return '⏳ Pending';
			case 'shipped': return '📦 Shipped';
			case 'in-transit': return '🚚 In Transit';
			case 'delivered': return '✓ Delivered';
			case 'failed': return '✗ Failed';
			default: return 'Unknown';
		}
	};

	const filteredShipments = filters === 'all' ? shipments : shipments.filter(s => s.status === filters);

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
			marginBottom: '2rem'
		},
		sectionTitle: {
			fontSize: '1.2rem',
			fontWeight: '700',
			color: 'var(--text-primary)',
			padding: '1.5rem 1.5rem 1rem 1.5rem',
			margin: 0,
			borderBottom: '1px solid var(--border)'
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
			box: 'shadow var(--shadow-lg)'
		},
		modalHeader: {
			fontSize: '1.5rem',
			fontWeight: '700',
			color: 'var(--text-primary)',
			marginBottom: '1.5rem',
			paddingBottom: '1rem',
			borderBottom: '1px solid var(--border)'
		},
		modalContent: {
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
		timeline: {
			padding: '1rem 0'
		},
		timelineItem: {
			display: 'flex',
			gap: '1rem',
			marginBottom: '1.5rem',
			position: 'relative'
		},
		timelineMarker: {
			width: '20px',
			height: '20px',
			borderRadius: '50%',
			backgroundColor: 'var(--primary)',
			color: 'white',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			fontSize: '0.8rem',
			fontWeight: '700',
			flexShrink: 0,
			marginTop: '0.2rem'
		},
		timelineContent: {
			flex: 1
		},
		timelineTitle: {
			fontWeight: '600',
			color: 'var(--text-primary)',
			marginBottom: '0.2rem'
		},
		timelineDescription: {
			fontSize: '0.85rem',
			color: 'var(--text-secondary)',
			marginBottom: '0.2rem'
		},
		button: {
			padding: '0.6rem 1.2rem',
			backgroundColor: 'var(--primary)',
			color: 'white',
			border: 'none',
			borderRadius: 'var(--radius)',
			cursor: 'pointer',
			fontWeight: '600',
			transition: 'all 0.2s'
		},
		closeButton: {
			padding: '0.4rem 0.8rem',
			backgroundColor: 'var(--surface)',
			border: '1px solid var(--border)',
			borderRadius: 'var(--radius)',
			cursor: 'pointer',
			fontWeight: '600',
			fontSize: '1.2rem',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center'
		},
		shippingStats: {
			display: 'grid',
			gridTemplateColumns: 'repeat(4, 1fr)',
			gap: '1rem',
			marginBottom: '2rem'
		},
		statCard: {
			backgroundColor: 'white',
			padding: '1.5rem',
			borderRadius: 'var(--radius-lg)',
			border: '1px solid var(--border)',
			textAlign: 'center'
		},
		statNumber: {
			fontSize: '2rem',
			fontWeight: '700',
			color: 'var(--primary)',
			margin: '0.5rem 0'
		},
		statLabel: {
			fontSize: '0.85rem',
			color: 'var(--text-secondary)',
			fontWeight: '500'
		}
	};

	return (
		<div style={styles.container}>
			{/* Header */}
			<div style={styles.header}>
				<h1 style={styles.title}>Shipping & Logistics</h1>
				<p style={styles.subtitle}>Manage shipments and track deliveries in real-time</p>
			</div>

			{/* Stats */}
			<div style={styles.shippingStats}>
				<div style={styles.statCard}>
					<div style={styles.statLabel}>Pending Shipments</div>
					<div style={styles.statNumber}>3</div>
					<small style={{ color: 'var(--warning)' }}>⚠ Action needed</small>
				</div>
				<div style={styles.statCard}>
					<div style={styles.statLabel}>In Transit</div>
					<div style={styles.statNumber}>5</div>
					<small style={{ color: 'var(--primary)' }}>📍 Being delivered</small>
				</div>
				<div style={styles.statCard}>
					<div style={styles.statLabel}>Delivered</div>
					<div style={styles.statNumber}>148</div>
					<small style={{ color: 'var(--success)' }}>✓ This month</small>
				</div>
				<div style={styles.statCard}>
					<div style={styles.statLabel}>Avg Delivery</div>
					<div style={styles.statNumber}>2.3d</div>
					<small style={{ color: 'var(--text-secondary)' }}>days</small>
				</div>
			</div>

			{/* Filters */}
			<div style={styles.filterBar}>
				{['all', 'pending', 'shipped', 'in-transit', 'delivered'].map(filter => (
					<button
						key={filter}
						style={filters === filter ? styles.filterButtonActive : styles.filterButton}
						onClick={() => setFilters(filter)}
					>
						{filter.replace('-', ' ').toUpperCase()}
					</button>
				))}
			</div>

			{/* Shipments Table */}
			<div style={styles.section}>
				<h2 style={styles.sectionTitle}>Shipments</h2>
				<table style={styles.table}>
					<thead>
						<tr style={{ backgroundColor: 'var(--surface)' }}>
							<th style={styles.tableHeader}>Order ID</th>
							<th style={styles.tableHeader}>Customer</th>
							<th style={styles.tableHeader}>Items</th>
							<th style={styles.tableHeader}>Carrier</th>
							<th style={styles.tableHeader}>Status</th>
							<th style={styles.tableHeader}>Est. Delivery</th>
							<th style={styles.tableHeader}>Action</th>
						</tr>
					</thead>
					<tbody>
						{filteredShipments.map(shipment => (
							<tr key={shipment.id} style={styles.tableRow}>
								<td style={styles.tableCell}>
									<strong>{shipment.orderId}</strong>
								</td>
								<td style={styles.tableCell}>{shipment.customer}</td>
								<td style={styles.tableCell}>{shipment.items}</td>
								<td style={styles.tableCell}>{shipment.carrier}</td>
								<td style={styles.tableCell}>
									<div
										style={{
											...styles.statusBadge,
											backgroundColor: getStatusColor(shipment.status)
										}}
									>
										{getStatusLabel(shipment.status)}
									</div>
								</td>
								<td style={styles.tableCell}>{shipment.estimatedDelivery}</td>
								<td style={styles.tableCell}>
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
			</div>

			{/* Shipment Details Modal */}
			<div style={selectedShipment ? { ...styles.modalOverlay, ...styles.modalActive } : styles.modalOverlay}>
				{selectedShipment && (
					<div style={styles.modal}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
							<h2 style={styles.modalHeader}>Shipment Details</h2>
							<button
								style={styles.closeButton}
								onClick={() => setSelectedShipment(null)}
							>
								✕
							</button>
						</div>

						<div style={styles.modalContent}>
							<div style={styles.modalField}>
								<div style={styles.label}>Order ID</div>
								<div style={styles.value}>{selectedShipment.orderId}</div>
							</div>
							<div style={styles.modalField}>
								<div style={styles.label}>Customer</div>
								<div style={styles.value}>{selectedShipment.customer}</div>
							</div>
							<div style={styles.modalField}>
								<div style={styles.label}>Carrier</div>
								<div style={styles.value}>{selectedShipment.carrier}</div>
							</div>
							<div style={styles.modalField}>
								<div style={styles.label}>Tracking ID</div>
								<div style={styles.value}>{selectedShipment.trackingId}</div>
							</div>
							<div style={styles.modalFieldFull}>
								<div style={styles.label}>Items</div>
								<div style={styles.value}>{selectedShipment.items}</div>
							</div>
						</div>

						<div style={{ ...styles.modalContent, marginBottom: '1.5rem' }}>
							<div style={styles.modalField}>
								<div style={styles.label}>Status</div>
								<div
									style={{
										...styles.statusBadge,
										backgroundColor: getStatusColor(selectedShipment.status),
										display: 'inline-block'
									}}
								>
									{getStatusLabel(selectedShipment.status)}
								</div>
							</div>
							<div style={styles.modalField}>
								<div style={styles.label}>Est. Delivery</div>
								<div style={styles.value}>{selectedShipment.estimatedDelivery}</div>
							</div>
						</div>

						<div style={{ marginBottom: '1.5rem' }}>
							<h3 style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>Tracking Timeline</h3>
							<div style={styles.timeline}>
								<div style={styles.timelineItem}>
									<div style={styles.timelineMarker}>1</div>
									<div style={styles.timelineContent}>
										<div style={styles.timelineTitle}>Shipped</div>
										<div style={styles.timelineDescription}>{selectedShipment.shippedDate}</div>
									</div>
								</div>
								{selectedShipment.status !== 'pending' && (
									<>
										<div style={styles.timelineItem}>
											<div style={styles.timelineMarker}>2</div>
											<div style={styles.timelineContent}>
												<div style={styles.timelineTitle}>In Transit</div>
												<div style={styles.timelineDescription}>Package is on its way</div>
											</div>
										</div>
										{(selectedShipment.status === 'delivered' || selectedShipment.status === 'in-transit') && (
											<div style={styles.timelineItem}>
												<div style={styles.timelineMarker}>✓</div>
												<div style={styles.timelineContent}>
													<div style={styles.timelineTitle}>
														{selectedShipment.status === 'delivered' ? 'Delivered' : 'Out for Delivery'}
													</div>
													<div style={styles.timelineDescription}>
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
							<button style={styles.button}>Print Label</button>
							<button style={{ ...styles.button, backgroundColor: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
								Contact Carrier
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default VendorShipping;
