import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';

const BUYER_TYPES = ['RETAIL', 'WHOLESALE'];

const COUNTRIES = [
	'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
	'UAE', 'Singapore', 'Kenya', 'South Africa', 'Germany'
];

function CustomerOnboarding() {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		fullName: '',
		buyerType: 'RETAIL',
		businessName: '',
		gstin: '',
		country: 'India',
		city: '',
		deliveryAddress: '',
		contactNumber: ''
	});
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		// Check if user is authenticated and is a customer
		if (!authService.isAuthenticated()) {
			navigate('/login');
			return;
		}

		if (authService.getUserRole() !== 'CUSTOMER') {
			navigate('/');
			return;
		}

		// Check if profile is already complete
		if (authService.isProfileComplete()) {
			navigate('/customer/catalog');
		}
	}, [navigate]);

	const handleInputChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value
		});
		setError('');
	};

	const handleBuyerTypeChange = (buyerType) => {
		setFormData({
			...formData,
			buyerType,
			// Clear business fields when switching to retail
			...(buyerType === 'RETAIL' ? { businessName: '', gstin: '' } : {})
		});
		setError('');
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');

		// Validate wholesale buyer requirements
		if (formData.buyerType === 'WHOLESALE' && !formData.businessName) {
			setError('Business name is required for wholesale buyers');
			return;
		}

		// Validate GSTIN if provided
		if (formData.gstin && formData.gstin.length !== 15) {
			setError('GSTIN must be exactly 15 characters');
			return;
		}

		setLoading(true);

		try {
			await authService.completeCustomerOnboarding(formData);
			
			// Show success message
			alert('Welcome to MedIQ! Your profile is now complete.');
			
			// Redirect to customer catalog
			navigate('/customer/catalog');
		} catch (err) {
			setError(err.response?.data?.message || err.message || 'Onboarding failed. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="page">
			<div className="container">
				<div className="card reveal" style={{ maxWidth: '900px', margin: '0 auto' }}>
					<div style={{ marginBottom: '2rem', textAlign: 'center' }}>
						<h2 className="section-title">Customer Onboarding</h2>
						<p className="section-subtitle">
							Complete your profile to start ordering medicines
						</p>
						<div style={{ marginTop: '1rem' }}>
							<span className="badge">Step 2 of 2: Personal Details</span>
						</div>
					</div>

					<form onSubmit={handleSubmit} className="grid">
						{error && (
							<div style={{
								padding: '0.75rem',
								backgroundColor: '#fee',
								border: '1px solid #fcc',
								borderRadius: '8px',
								color: '#c33'
							}}>
								{error}
							</div>
						)}

						<div>
							<label className="label">Buyer Type *</label>
							<div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
								<button
									type="button"
									className={formData.buyerType === 'RETAIL' ? 'button' : 'button-outline'}
									onClick={() => handleBuyerTypeChange('RETAIL')}
								>
									Retail (Individual/Small orders)
								</button>
								<button
									type="button"
									className={formData.buyerType === 'WHOLESALE' ? 'button' : 'button-outline'}
									onClick={() => handleBuyerTypeChange('WHOLESALE')}
								>
									Wholesale (Bulk orders/Business)
								</button>
							</div>
							<p className="section-subtitle" style={{ marginTop: '0.5rem' }}>
								{formData.buyerType === 'RETAIL' 
									? 'Perfect for hospitals, clinics, and small pharmacies' 
									: 'Ideal for distributors, large chains, and bulk buyers (with pricing benefits)'}
							</p>
						</div>

						<div className="form-row">
							<div>
								<label className="label">Full Name *</label>
								<input
									className="input"
									type="text"
									name="fullName"
									placeholder="John Doe"
									value={formData.fullName}
									onChange={handleInputChange}
									required
								/>
							</div>
							<div>
								<label className="label">Contact Number *</label>
								<input
									className="input"
									type="tel"
									name="contactNumber"
									placeholder="+91 98765 43210"
									value={formData.contactNumber}
									onChange={handleInputChange}
									required
								/>
							</div>
						</div>

						{formData.buyerType === 'WHOLESALE' && (
							<div className="form-row">
								<div>
									<label className="label">Business Name *</label>
									<input
										className="input"
										type="text"
										name="businessName"
										placeholder="ABC Pharma Distributors"
										value={formData.businessName}
										onChange={handleInputChange}
										required
									/>
								</div>
								<div>
									<label className="label">GSTIN (Optional)</label>
									<input
										className="input"
										type="text"
										name="gstin"
										placeholder="22AAAAA0000A1Z5"
										value={formData.gstin}
										onChange={handleInputChange}
										maxLength={15}
									/>
									<small style={{ color: '#666', fontSize: '0.85rem' }}>
										Required for tax invoice generation
									</small>
								</div>
							</div>
						)}

						<div className="form-row">
							<div>
								<label className="label">Country *</label>
								<select
									className="select"
									name="country"
									value={formData.country}
									onChange={handleInputChange}
									required
								>
									{COUNTRIES.map(country => (
										<option key={country} value={country}>{country}</option>
									))}
								</select>
							</div>
							<div>
								<label className="label">City *</label>
								<input
									className="input"
									type="text"
									name="city"
									placeholder="Mumbai"
									value={formData.city}
									onChange={handleInputChange}
									required
								/>
							</div>
						</div>

						<div>
							<label className="label">Delivery Address *</label>
							<textarea
								className="input"
								name="deliveryAddress"
								placeholder="Complete delivery address with pincode"
								value={formData.deliveryAddress}
								onChange={handleInputChange}
								rows={3}
								required
								style={{ resize: 'vertical' }}
							/>
						</div>

						<div style={{
							marginTop: '1rem',
							padding: '1rem',
							backgroundColor: '#e8f8e9',
							borderRadius: '8px',
							border: '1px solid #b3e8b5'
						}}>
							<strong style={{ color: '#43A047' }}>✓ Benefits of completing your profile</strong>
							<ul style={{ margin: '0.5rem 0 0 1.2rem', color: '#5a6b76', fontSize: '0.9rem' }}>
								<li>Access to verified medicine catalog from multiple vendors</li>
								<li>Real-time pricing based on your buyer type</li>
								<li>Secure payment gateway integration</li>
								<li>Order tracking and automated invoice generation</li>
								{formData.buyerType === 'WHOLESALE' && (
									<li><strong>Wholesale pricing discounts on bulk orders</strong></li>
								)}
							</ul>
						</div>

						<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
							<button
								type="button"
								className="button-outline"
								onClick={() => {
									if (window.confirm('Are you sure you want to logout? Your progress will be lost.')) {
										authService.logout();
										navigate('/login');
									}
								}}
							>
								Logout
							</button>
							<button type="submit" className="button" disabled={loading}>
								{loading ? 'Completing...' : 'Complete Profile & Start Shopping'}
							</button>
						</div>
					</form>
				</div>
			</div>
		</main>
	);
}

export default CustomerOnboarding;