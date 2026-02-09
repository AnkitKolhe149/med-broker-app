import React from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';

function AdminDashboard() {
	const navigate = useNavigate();

	const handleLogout = () => {
		authService.logout();
		navigate('/login');
	};

	return (
		<main className="page">
			<div className="container">
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
					<div>
						<h1 className="section-title">Admin Dashboard</h1>
						<p className="section-subtitle">Platform Administration</p>
					</div>
					<button className="button-outline" onClick={handleLogout}>Logout</button>
				</div>

				<div className="grid grid-3">
					<div className="card">
						<h3>Vendor Verification</h3>
						<p className="section-subtitle">Review pending vendor profiles</p>
						<span className="badge">Coming Soon</span>
					</div>

					<div className="card">
						<h3>User Management</h3>
						<p className="section-subtitle">Manage customers and vendors</p>
						<span className="badge">Coming Soon</span>
					</div>

					<div className="card">
						<h3>Platform Analytics</h3>
						<p className="section-subtitle">View platform statistics</p>
						<span className="badge">Coming Soon</span>
					</div>
				</div>
			</div>
		</main>
	);
}

export default AdminDashboard;