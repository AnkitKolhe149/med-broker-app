import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';

function CustomerDashboard() {
	const navigate = useNavigate();
	const [user, setUser] = useState(null);

	useEffect(() => {
		loadUserData();
	}, []);

	const loadUserData = async () => {
		try {
			const userData = await authService.getCurrentUser();
			setUser(userData);
		} catch (error) {
			console.error('Failed to load user data:', error);
		}
	};

	const handleLogout = () => {
		authService.logout();
		navigate('/login');
	};

	return (
		<main className="page">
			<div className="container">
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
					<div>
						<h1 className="section-title">Customer Dashboard</h1>
						<p className="section-subtitle">Welcome back, {user?.customer?.fullName || user?.email}!</p>
					</div>
					<button className="button-outline" onClick={handleLogout}>Logout</button>
				</div>

				<div className="grid grid-3">
					<div className="card">
						<h3>Browse Catalog</h3>
						<p className="section-subtitle">Explore medicines from verified vendors</p>
						<button className="button" onClick={() => navigate('/customer/catalog')}>View Catalog</button>
					</div>

					<div className="card">
						<h3>My Orders</h3>
						<p className="section-subtitle">Track your order status</p>
						<span className="badge">Coming Soon</span>
					</div>

					<div className="card">
						<h3>My Profile</h3>
						<p className="section-subtitle">Buyer Type: {user?.customer?.buyerType || 'N/A'}</p>
						<p className="section-subtitle">Location: {user?.customer?.city}, {user?.customer?.country}</p>
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
			</div>
		</main>
	);
}

export default CustomerDashboard;