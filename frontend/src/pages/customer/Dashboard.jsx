import React from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';
import { useUser } from '../../context/UserContext';
import { formatCurrency } from '../../utils/currency';

function CustomerDashboard() {
	const navigate = useNavigate();
	const { user } = useUser();

	const activeOrders = [
		{ id: 'ORD1705346291567', status: 'In Transit', eta: '2 days' },
		{ id: 'ORD1705259891890', status: 'Confirmed', eta: '4 days' }
	];
	const lastOrder = {
		id: 'ORD1705432891234',
		date: '2024-01-16',
		total: 1250.50,
		items: 3
	};
	const currencyCode = localStorage.getItem('preferredCurrency') || 'USD';
	const formatPrice = (value) => formatCurrency(value, currencyCode, true);
	const savedAddress = user?.customer
		? `${user.customer.address || ''}, ${user.customer.city || ''}, ${user.customer.state || ''} ${user.customer.zipCode || ''}`
		: 'No saved address';

	const handleLogout = () => {
		authService.logout();
		navigate('/login');
	};

	return (
		<main className="page">
			<div className="container">
				<div className="page-header">
					<div className="title-group">
						<h1 className="section-title">Customer Dashboard</h1>
						<p className="section-subtitle">Welcome back, {user?.customer?.fullName || user?.email}!</p>
					</div>
					<div className="page-actions">
						<button className="button-outline" onClick={handleLogout}>Logout</button>
					</div>
				</div>

				<section className="section">
					<div className="section-grid">
					<div className="card">
						<h3>Welcome</h3>
						<p className="section-subtitle">Buyer Type: {user?.customer?.buyerType || 'N/A'}</p>
						<p className="section-subtitle">Member: {user?.email}</p>
						<button className="button" onClick={() => navigate('/customer/profile')}>Profile Settings</button>
					</div>

					<div className="card">
						<h3>Active Orders</h3>
						{activeOrders.map(order => (
							<div key={order.id} style={{ marginBottom: '0.75rem' }}>
								<p className="section-subtitle">{order.id}</p>
								<span className="badge">{order.status} · ETA {order.eta}</span>
							</div>
						))}
						<button className="button-outline" onClick={() => navigate('/customer/orders')}>View Orders</button>
					</div>

					<div className="card">
						<h3>Last Order Summary</h3>
						<p className="section-subtitle">Order ID: {lastOrder.id}</p>
						<p className="section-subtitle">Date: {new Date(lastOrder.date).toLocaleDateString('en-IN')}</p>
						<p className="section-subtitle">Items: {lastOrder.items} · Total: {formatPrice(lastOrder.total)}</p>
						<button className="button-outline" onClick={() => navigate('/customer/orders')}>Track Order</button>
					</div>
				</div>
			</section>

			<section className="section">
				<div className="section-grid">
					<div className="card">
						<h3>Saved Address</h3>
						<p className="section-subtitle">{savedAddress || 'No saved address'}</p>
						<button className="button-outline" onClick={() => navigate('/customer/profile')}>Edit Address</button>
					</div>

					<div className="card">
						<h3>Quick Actions</h3>
						<div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
							<button className="button" onClick={() => navigate('/customer/catalog')}>Browse Medicines</button>
							<button className="button-outline" onClick={() => navigate('/customer/orders')}>View Orders</button>
							<button className="button-outline" onClick={() => navigate('/customer/profile')}>Profile Settings</button>
						</div>
					</div>
				</div>

				{user?.customer?.buyerType === 'WHOLESALE' && (
					<div className="alert alert-success" style={{ marginTop: '2rem' }}>
						<strong>✓ Wholesale Benefits Active</strong>
						<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
							You're eligible for bulk pricing discounts on qualifying orders.
						</p>
					</div>
				)}
			</section>
		</div>
	</main>
	);
}

export default CustomerDashboard;