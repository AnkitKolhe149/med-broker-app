import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import orderService from '../../services/order.service';

function Prescriptions() {
	const navigate = useNavigate();
	const { showError } = useNotification();
	const [loading, setLoading] = useState(true);
	const [orders, setOrders] = useState([]);

	useEffect(() => {
		const loadOrders = async () => {
			try {
				setLoading(true);
				const result = await orderService.getCustomerOrders({ page: 1, limit: 100 });
				setOrders(result.orders || []);
			} catch (error) {
				console.error('Failed to load prescriptions', error);
				showError(error?.message || 'Failed to load prescriptions');
			} finally {
				setLoading(false);
			}
		};

		loadOrders();
	}, []);

	const prescriptionOrders = useMemo(() => (
		orders.filter((order) => {
			const snapshot = order?.checkoutSnapshot;
			if (snapshot?.prescriptionUrl) return true;
			return (order.items || []).some((item) => item?.medicine?.requiresPrescription);
		})
	), [orders]);

	if (loading) {
		return (
			<div style={{ minHeight: '50vh', display: 'grid', placeItems: 'center' }}>
				<p>Loading prescriptions...</p>
			</div>
		);
	}

	return (
		<main className="page">
			<div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '1.2rem' }}>
					<div>
						<h1 style={{ marginBottom: '.35rem' }}>My Prescriptions</h1>
						<p style={{ color: 'var(--text-secondary)' }}>Prescription-linked orders and uploaded Rx references.</p>
					</div>
					<button type="button" className="button-outline" onClick={() => navigate('/customer/catalog')}>
						Browse Medicines
					</button>
				</div>

				{prescriptionOrders.length === 0 ? (
					<div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1rem' }}>
						<p>No prescription orders found yet.</p>
					</div>
				) : (
					<div style={{ display: 'grid', gap: '.9rem' }}>
						{prescriptionOrders.map((order) => {
							const snapshot = order?.checkoutSnapshot || {};
							const prescriptionUrl = snapshot?.prescriptionUrl || null;
							const created = order?.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A';
							const total = Number((order?.totalCents || 0) / 100).toFixed(2);
							return (
								<article key={order.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1rem' }}>
									<div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
										<div>
											<p><strong>Order:</strong> {order.id}</p>
											<p><strong>Date:</strong> {created}</p>
											<p><strong>Status:</strong> {order.status}</p>
											<p><strong>Total:</strong> {total}</p>
										</div>
										<div style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-start' }}>
											<button type="button" className="button-outline" onClick={() => navigate('/customer/orders')}>
												View Orders
											</button>
											{prescriptionUrl ? (
												<a href={prescriptionUrl} target="_blank" rel="noreferrer" className="button">
													Open Prescription
												</a>
											) : null}
										</div>
									</div>
								</article>
							);
						})}
					</div>
				)}
			</div>
		</main>
	);
}

export default Prescriptions;
