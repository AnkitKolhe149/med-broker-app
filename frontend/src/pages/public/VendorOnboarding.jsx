import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';
import authService from '../../services/auth.service';

const VENDOR_TYPES = ['MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY'];

const INDIAN_STATES = [
	'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
	'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
	'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
	'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
	'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
	'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const COUNTRIES = [
	'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
	'UAE', 'Singapore', 'Kenya', 'South Africa', 'Germany'
];

function VendorOnboarding() {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		companyName: '',
		vendorType: 'MANUFACTURER',
		country: 'India',
		state: '',
		gstinNumber: '',
		drugLicenseNumber: '',
		businessAddress: '',
		contactPersonName: '',
		bankAccountDetails: {
			accountHolderName: '',
			accountNumber: '',
			bankName: '',
			ifscCode: '',
			branchName: '',
			upiId: '',
			payoutReferenceId: ''
		}
	});
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		// Check if user is authenticated and is a vendor
		if (!authService.isAuthenticated()) {
			navigate('/login');
			return;
		}

		if (authService.getUserRole() !== 'VENDOR') {
			navigate('/');
			return;
		}

		// Check if profile is already complete
		if (authService.isProfileComplete()) {
			navigate('/vendor/dashboard');
		}
	}, [navigate]);

	const handleInputChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value
		});
		setError('');
	};

	const handleBankDetailChange = (field, value) => {
		setFormData({
			...formData,
			bankAccountDetails: {
				...formData.bankAccountDetails,
				[field]: value
			}
		});
		setError('');
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');

		// Basic GSTIN validation
		if (formData.gstinNumber.length !== 15) {
			setError('GSTIN must be exactly 15 characters');
			return;
		}

		setLoading(true);

		try {
			await authService.completeVendorOnboarding(formData);
			
			// Show success message
			alert('Vendor onboarding completed! Your profile is under verification. You will be notified once approved.');
			
			// Redirect to vendor dashboard
			navigate('/vendor/dashboard');
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
						<h2 className="section-title">Vendor Onboarding</h2>
						<p className="section-subtitle">
							Complete your business profile to start selling on MedIQ
						</p>
						<div style={{ marginTop: '1rem' }}>
							<span className="badge">Step 2 of 2: Business Details</span>
						</div>
							<p className="section-subtitle" style={{ marginTop: '0.75rem' }}>
								We'll reuse your account mobile number, so you do not need to enter it again here.
							</p>
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

						<div className="form-row">
							<div>
								<label className="label">Business / Company Name *</label>
								<input
									className="input"
									type="text"
									name="companyName"
									placeholder="CareMeds Pvt Ltd"
									value={formData.companyName}
									onChange={handleInputChange}
									required
								/>
							</div>
							<div>
								<label className="label">Vendor Type *</label>
								<select
									className="select"
									name="vendorType"
									value={formData.vendorType}
									onChange={handleInputChange}
									required
								>
									{VENDOR_TYPES.map(type => (
										<option key={type} value={type}>
											{type.charAt(0) + type.slice(1).toLowerCase()}
										</option>
									))}
								</select>
							</div>
						</div>

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
								<label className="label">State / Region *</label>
								{formData.country === 'India' ? (
									<select
										className="select"
										name="state"
										value={formData.state}
										onChange={handleInputChange}
										required
									>
										<option value="">Select state</option>
										{INDIAN_STATES.map(state => (
											<option key={state} value={state}>{state}</option>
										))}
									</select>
								) : (
									<input
										className="input"
										type="text"
										name="state"
										placeholder="Enter state or region"
										value={formData.state}
										onChange={handleInputChange}
										required
									/>
								)}
							</div>
						</div>

						<div className="form-row">
							<div>
								<label className="label">GSTIN Number *</label>
								<input
									className="input"
									type="text"
									name="gstinNumber"
									placeholder="22AAAAA0000A1Z5"
									value={formData.gstinNumber}
									onChange={handleInputChange}
									maxLength={15}
									required
								/>
								<small style={{ color: '#666', fontSize: '0.85rem' }}>
									15 characters (e.g., 22AAAAA0000A1Z5)
								</small>
							</div>
							<div>
								<label className="label">Drug License Number *</label>
								<input
									className="input"
									type="text"
									name="drugLicenseNumber"
									placeholder="DL-MH-12345"
									value={formData.drugLicenseNumber}
									onChange={handleInputChange}
									required
								/>
							</div>
						</div>

						<div>
							<label className="label">Business Address *</label>
							<textarea
								className="input"
								name="businessAddress"
								placeholder="Complete business address with pincode"
								value={formData.businessAddress}
								onChange={handleInputChange}
								rows={3}
								required
								style={{ resize: 'vertical' }}
							/>
						</div>

						<div className="form-row">
							<div>
								<label className="label">Contact Person Name *</label>
								<input
									className="input"
									type="text"
									name="contactPersonName"
									placeholder="John Doe"
									value={formData.contactPersonName}
									onChange={handleInputChange}
									required
								/>
							</div>
							<div>
								<label className="label">Razorpay Payout Account ID (Optional)</label>
								<input
									className="input"
									type="text"
									value={formData.bankAccountDetails.payoutReferenceId}
									onChange={(e) => handleBankDetailChange('payoutReferenceId', e.target.value)}
									placeholder="acc_xxxxxxxx"
								/>
							</div>
						</div>

						<div style={{ marginTop: '1.25rem' }}>
							<h3 className="section-subtitle" style={{ marginBottom: '0.75rem' }}>Banking details (optional)</h3>
							<div className="form-row">
								<div>
									<label className="label">Account Holder Name</label>
									<input className="input" type="text" value={formData.bankAccountDetails.accountHolderName} onChange={(e) => handleBankDetailChange('accountHolderName', e.target.value)} placeholder="Business / personal name" />
								</div>
								<div>
									<label className="label">Account Number</label>
									<input className="input" type="text" value={formData.bankAccountDetails.accountNumber} onChange={(e) => handleBankDetailChange('accountNumber', e.target.value)} placeholder="123456789012" />
								</div>
							</div>
							<div className="form-row">
								<div>
									<label className="label">Bank Name</label>
									<input className="input" type="text" value={formData.bankAccountDetails.bankName} onChange={(e) => handleBankDetailChange('bankName', e.target.value)} placeholder="State Bank of India" />
								</div>
								<div>
									<label className="label">IFSC Code</label>
									<input className="input" type="text" value={formData.bankAccountDetails.ifscCode} onChange={(e) => handleBankDetailChange('ifscCode', e.target.value.toUpperCase())} placeholder="SBIN0001234" />
								</div>
							</div>
							<div className="form-row">
								<div>
									<label className="label">Branch Name</label>
									<input className="input" type="text" value={formData.bankAccountDetails.branchName} onChange={(e) => handleBankDetailChange('branchName', e.target.value)} placeholder="Main Branch" />
								</div>
								<div>
									<label className="label">UPI ID</label>
									<input className="input" type="text" value={formData.bankAccountDetails.upiId} onChange={(e) => handleBankDetailChange('upiId', e.target.value)} placeholder="vendor@upi" />
								</div>
							</div>
						</div>

						<div style={{
							marginTop: '1rem',
							padding: '1rem',
							backgroundColor: '#e8f4f8',
							borderRadius: '8px',
							border: '1px solid #b3d9e8'
						}}>
							<strong style={{ color: '#0f7f8a', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}><Info size={14} strokeWidth={1.75} /> What happens next?</strong>
							<p style={{ margin: '0.5rem 0 0 0', color: '#5a6b76', fontSize: '0.9rem' }}>
								Your vendor profile will be submitted for verification. Our team will review your 
								GSTIN and drug license details. You'll receive an email notification once approved 
								(usually within 24-48 hours).
							</p>
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
								{loading ? 'Submitting...' : 'Submit for Verification'}
							</button>
						</div>
					</form>
				</div>
			</div>
		</main>
	);
}

export default VendorOnboarding;