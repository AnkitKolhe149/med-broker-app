import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';

function VendorDashboard() {
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

	const getVerificationBadge = (status) => {
		if (status === 'VERIFIED') return <span className="badge badge-success">✓ Verified</span>;
		if (status === 'PENDING') return <span className="badge badge-warning">⏳ Pending Verification</span>;
		if (status === 'REJECTED') return <span className="badge badge-error">✗ Rejected</span>;
		return null;
	};

	return (
		<main className="page">
			<div className="container">
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
					<div>
						<h1 className="section-title">Vendor Dashboard</h1>
						<p className="section-subtitle">Welcome, {user?.vendor?.companyName || user?.email}!</p>
					</div>
					<button className="button-outline" onClick={handleLogout}>Logout</button>
				</div>

				{user?.vendor?.verificationStatus === 'PENDING' && (
					<div className="alert alert-warning" style={{ marginBottom: '2rem' }}>
						<strong>⏳ Verification in Progress</strong>
						<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
							Your vendor profile is under review. Our team will verify your GSTIN and drug license details within 24-48 hours.
							You'll receive an email notification once approved.
						</p>
					</div>
				)}

				<div className="grid grid-3">
					<div className="card">
						<h3>Verification Status</h3>
						<p className="section-subtitle" style={{ marginBottom: '1rem' }}>
							{getVerificationBadge(user?.vendor?.verificationStatus)}
						</p>
						<p style={{ fontSize: '0.85rem', color: '#666' }}>
							Type: {user?.vendor?.vendorType || 'N/A'}
						</p>
					</div>

					<div className="card">
						<h3>Inventory Management</h3>
						<p className="section-subtitle">Manage your medicine catalog</p>
						<span className="badge">Coming Soon</span>
					</div>

					<div className="card">
						<h3>Orders & Sales</h3>
						<p className="section-subtitle">Track incoming orders</p>
						<span className="badge">Coming Soon</span>
					</div>
				</div>

				<div className="card-soft" style={{ marginTop: '2rem' }}>
					<h3>Business Information</h3>
					<div className="grid grid-2" style={{ marginTop: '1rem' }}>
						<div>
							<p><strong>Company:</strong> {user?.vendor?.companyName}</p>
							<p><strong>GSTIN:</strong> {user?.vendor?.gstinNumber}</p>
							<p><strong>License:</strong> {user?.vendor?.drugLicenseNumber}</p>
						</div>
						<div>
							<p><strong>Location:</strong> {user?.vendor?.city || user?.vendor?.state}, {user?.vendor?.country}</p>
							<p><strong>Contact:</strong> {user?.vendor?.contactPersonName}</p>
							<p><strong>Phone:</strong> {user?.vendor?.contactNumber}</p>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}

export default VendorDashboard;