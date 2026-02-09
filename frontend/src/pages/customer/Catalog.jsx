import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';

function Catalog() {
	const navigate = useNavigate();
	const [medicines, setMedicines] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Sample medicine data - will be replaced with API call
		setMedicines([
			{
				id: 1,
				name: 'Paracetamol 500mg',
				category: 'Analgesics',
				price: 45.00,
				vendor: 'PharmaCorp India',
				inStock: true
			},
			{
				id: 2,
				name: 'Amoxicillin 250mg',
				category: 'Antibiotics',
				price: 120.00,
				vendor: 'MediSupply Ltd',
				inStock: true
			},
			{
				id: 3,
				name: 'Cetirizine 10mg',
				category: 'Antihistamines',
				price: 25.00,
				vendor: 'HealthPlus Pharma',
				inStock: true
			},
			{
				id: 4,
				name: 'Omeprazole 20mg',
				category: 'Antacids',
				price: 85.00,
				vendor: 'PharmaCorp India',
				inStock: true
			},
			{
				id: 5,
				name: 'Metformin 500mg',
				category: 'Antidiabetics',
				price: 60.00,
				vendor: 'DiabeCare Inc',
				inStock: true
			},
			{
				id: 6,
				name: 'Atorvastatin 10mg',
				category: 'Cardiovascular',
				price: 95.00,
				vendor: 'CardioPharma',
				inStock: false
			}
		]);
		setLoading(false);
	}, []);

	const handleLogout = () => {
		authService.logout();
		navigate('/login');
	};

	if (loading) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
				<p>Loading catalog...</p>
			</div>
		);
	}

	return (
		<main className="page">
			<div className="container">
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
					<div>
						<h1 className="section-title">Medicine Catalog</h1>
						<p className="section-subtitle">Browse and order medicines from verified vendors</p>
					</div>
					<div style={{ display: 'flex', gap: '0.75rem' }}>
						<button className="button-outline" onClick={() => navigate('/customer/dashboard')}>Dashboard</button>
						<button className="button-outline" onClick={handleLogout}>Logout</button>
					</div>
				</div>

				<div className="grid grid-3">
					{medicines.map(medicine => (
						<div key={medicine.id} className="card">
							<div style={{ marginBottom: '1rem' }}>
								<h3 style={{ marginBottom: '0.5rem' }}>{medicine.name}</h3>
								<span className="badge">{medicine.category}</span>
							</div>
							<p className="section-subtitle">Vendor: {medicine.vendor}</p>
							<div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
								<strong style={{ fontSize: '1.25rem', color: '#1E88E5' }}>₹{medicine.price.toFixed(2)}</strong>
								{medicine.inStock ? (
									<button className="button">Add to Cart</button>
								) : (
									<span className="badge badge-error">Out of Stock</span>
								)}
							</div>
						</div>
					))}
				</div>

				<div className="alert alert-info" style={{ marginTop: '2rem' }}>
					<strong>ℹ️ Demo Mode</strong>
					<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
						This is sample catalog data. Real medicine data will be loaded from the API once vendors add their inventory.
					</p>
				</div>
			</div>
		</main>
	);
}

export default Catalog;