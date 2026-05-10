import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';
import authService from '../../services/auth.service';
import './AuthCare.css';

const VENDOR_TYPES = ['MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY'];
const BUYER_TYPES = ['RETAIL', 'WHOLESALE'];
const COUNTRY_OPTIONS = [
	{
		name: 'India',
		code: 'IN',
		dialCode: '+91',
		states: [
			'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
			'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
			'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
			'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
			'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
			'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
		]
	},
	{ name: 'United States', code: 'US', dialCode: '+1', states: [] },
	{ name: 'United Kingdom', code: 'GB', dialCode: '+44', states: [] },
	{ name: 'Canada', code: 'CA', dialCode: '+1', states: [] },
	{ name: 'Australia', code: 'AU', dialCode: '+61', states: [] },
	{ name: 'UAE', code: 'AE', dialCode: '+971', states: [] },
	{ name: 'Singapore', code: 'SG', dialCode: '+65', states: [] },
	{ name: 'Kenya', code: 'KE', dialCode: '+254', states: ['Nairobi', 'Mombasa', 'Kisumu'] },
	{ name: 'South Africa', code: 'ZA', dialCode: '+27', states: [] },
	{ name: 'Germany', code: 'DE', dialCode: '+49', states: [] }
];

function Register() {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		email: '',
		mobile: '',
		password: '',
		confirmPassword: '',
		role: 'CUSTOMER',  // ✅ Default to CUSTOMER only (ADMIN can only be added by existing admins)

		// Shared Onboarding Fields
		country: 'India',
		countryCode: 'IN',
		phoneDial: '+91',
		state: '',
		city: '',

		// CUSTOMER specific
		fullName: '',
		buyerType: 'RETAIL',
		deliveryAddress: '',
		customerBusinessName: '',
		customerGstin: '',

		// VENDOR specific
		companyName: '',
		vendorType: 'MANUFACTURER',
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
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		if (name === 'country') {
			const selectedCountry = COUNTRY_OPTIONS.find((country) => country.name === value) || COUNTRY_OPTIONS[0];
			setFormData({
				...formData,
				country: selectedCountry.name,
				countryCode: selectedCountry.code,
				phoneDial: selectedCountry.dialCode,
				state: ''
			});
			setError('');
			return;
		}

		setFormData({
			...formData,
			[name]: value
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

	const handleRoleSelect = (role) => {
		// ✅ PREVENT ADMIN registration - only allow CUSTOMER and VENDOR
		if (role === 'ADMIN') {
			setError('Admin accounts can only be created by existing administrators');
			return;
		}
		setFormData({
			...formData,
			role
		});
		setError('');
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');

		// Validate password match
		if (formData.password !== formData.confirmPassword) {
			setError('Passwords do not match');
			return;
		}

		// Validate password length
		if (formData.password.length < 8) {
			setError('Password must be at least 8 characters long');
			return;
		}

		// Vendor validation
		if (formData.role === 'VENDOR') {
			if (formData.gstinNumber.length !== 15) {
				setError('GSTIN must be exactly 15 characters (e.g., 22AAAAA0000A1Z5)');
				return;
			}
		}

		// Customer Wholesale validation
		if (formData.role === 'CUSTOMER' && formData.buyerType === 'WHOLESALE') {
			if (formData.customerGstin && formData.customerGstin.length !== 15) {
				setError('GSTIN must be exactly 15 characters for Wholesale Buyers');
				return;
			}
		}

		setLoading(true);

		try {
			// Step 1: Register User
			const result = await authService.register({
				email: formData.email,
				mobile: formData.mobile,
				password: formData.password,
				role: formData.role,
				countryCode: formData.countryCode,
				phoneDial: formData.phoneDial,
				phoneE164: formData.mobile ? `${formData.phoneDial}${formData.mobile}` : undefined
			});

			// Step 2: Complete Profile Setup (Onboarding)
			try {
				if (result.user.role === 'VENDOR') {
					await authService.completeVendorOnboarding({
						companyName: formData.companyName,
						vendorType: formData.vendorType,
						country: formData.country,
						state: formData.state,
						gstinNumber: formData.gstinNumber,
						drugLicenseNumber: formData.drugLicenseNumber,
						businessAddress: formData.businessAddress,
						contactPersonName: formData.contactPersonName,
						contactNumber: formData.mobile, // Reuse mobile
						bankAccountDetails: formData.bankAccountDetails
					});
					
					// Refresh user data to get updated roles and currency
					await authService.getCurrentUser();
					
					navigate('/vendor/dashboard');
				} else if (result.user.role === 'CUSTOMER') {
					await authService.completeCustomerOnboarding({
						fullName: formData.fullName,
						buyerType: formData.buyerType,
						businessName: formData.customerBusinessName || null,
						gstin: formData.customerGstin || null,
						country: formData.country,
						city: formData.city,
						deliveryAddress: formData.deliveryAddress,
						contactNumber: formData.mobile // Reuse mobile
					});
					navigate('/customer/dashboard');
				} else {
					navigate('/');
				}
			} catch (onboardingErr) {
				console.error('Onboarding failed after registration:', onboardingErr);
				// If onboarding fails, the AuthGuard will catch them on the dashboard and prompt them to finish it later.
				// Still, we navigate them to their respective onboarding page to fix errors manually.
				if (result.user.role === 'VENDOR') navigate('/onboarding/vendor');
				else if (result.user.role === 'CUSTOMER') navigate('/onboarding/customer');
				else navigate('/');
			}
			
		} catch (err) {
			setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="auth-care-page page">
			<div className="container auth-care-container" style={{ maxWidth: '900px' }}>
				<section className="auth-care-hero reveal" style={{ paddingBottom: '1rem' }}>
					<p className="auth-care-kicker">Healthcare Onboarding</p>
					<h1 className="auth-care-title">Create your MedIQ account</h1>
					<p className="auth-care-subtitle">
						Provide your details below to get started. Your account type will determine your profile settings.
					</p>
				</section>

				<section className="auth-care-card card reveal">
					<form onSubmit={handleSubmit} className="auth-care-form">
						{error && <div className="auth-care-error" style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '8px', color: '#c33' }}>{error}</div>}

						<div>
							<label className="label">Register as</label>
							<div className="auth-care-role-switch auth-care-role-switch-register" role="group" aria-label="Select registration role">
								<button
									type="button"
									className={formData.role === 'CUSTOMER' ? 'auth-care-role-btn active' : 'auth-care-role-btn'}
									onClick={() => handleRoleSelect('CUSTOMER')}
								>
									Customer
								</button>
								<button
									type="button"
									className={formData.role === 'VENDOR' ? 'auth-care-role-btn active' : 'auth-care-role-btn'}
									onClick={() => handleRoleSelect('VENDOR')}
								>
									Vendor
								</button>
							</div>
						</div>

						<h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Account Details</h3>

						<div className="form-row auth-care-row">
							<div className="auth-care-field-group">
								<label className="label">Email address *</label>
								<input
									className="input"
									type="email"
									name="email"
									placeholder="name@clinic.com"
									value={formData.email}
									onChange={handleInputChange}
									required
								/>
							</div>
							<div className="auth-care-field-group">
								<label className="label">Phone *</label>
								<div className="form-row auth-care-row" style={{ margin: 0 }}>
									<input
										className="input"
										type="text"
										name="phoneDial"
										value={formData.phoneDial}
										readOnly
										style={{ maxWidth: '110px' }}
									/>
									<input
										className="input"
										type="tel"
										name="mobile"
										placeholder="Phone number"
										value={formData.mobile}
										onChange={handleInputChange}
										required
									/>
								</div>
							</div>
						</div>

						<div className="form-row auth-care-row">
							<div className="auth-care-field-group">
								<label className="label">Password *</label>
								<div className="auth-care-password-wrap">
									<input
										className="input"
										type={showPassword ? 'text' : 'password'}
										name="password"
										placeholder="Minimum 8 characters"
										value={formData.password}
										onChange={handleInputChange}
										required
										minLength={8}
									/>
									<button
										type="button"
										className="auth-care-toggle"
										onClick={() => setShowPassword((prev) => !prev)}
									>
										{showPassword ? 'Hide' : 'Show'}
									</button>
								</div>
							</div>
							<div className="auth-care-field-group">
								<label className="label">Confirm password *</label>
								<div className="auth-care-password-wrap">
									<input
										className="input"
										type={showConfirmPassword ? 'text' : 'password'}
										name="confirmPassword"
										placeholder="Re-enter password"
										value={formData.confirmPassword}
										onChange={handleInputChange}
										required
										minLength={8}
									/>
									<button
										type="button"
										className="auth-care-toggle"
										onClick={() => setShowConfirmPassword((prev) => !prev)}
									>
										{showConfirmPassword ? 'Hide' : 'Show'}
									</button>
								</div>
							</div>
						</div>

						<h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
							{formData.role === 'CUSTOMER' ? 'Profile Details' : 'Business Details'}
						</h3>

						{/* --- CUSTOMER FIELDS --- */}
						{formData.role === 'CUSTOMER' && (
							<>
								<div className="form-row auth-care-row">
									<div className="auth-care-field-group">
										<label className="label">Full Name *</label>
										<input
											className="input"
											type="text"
											name="fullName"
											placeholder="John Doe"
											value={formData.fullName}
											onChange={handleInputChange}
											required={formData.role === 'CUSTOMER'}
										/>
									</div>
									<div className="auth-care-field-group">
										<label className="label">Buyer Type *</label>
										<select
											className="select input"
											name="buyerType"
											value={formData.buyerType}
											onChange={handleInputChange}
											required={formData.role === 'CUSTOMER'}
										>
											{BUYER_TYPES.map(type => (
												<option key={type} value={type}>{type.charAt(0) + type.slice(1).toLowerCase()}</option>
											))}
										</select>
									</div>
								</div>

								{formData.buyerType === 'WHOLESALE' && (
									<div className="form-row auth-care-row">
										<div className="auth-care-field-group">
											<label className="label">Business Name *</label>
											<input
												className="input"
												type="text"
												name="customerBusinessName"
												placeholder="Pharmacy / Clinic Name"
												value={formData.customerBusinessName}
												onChange={handleInputChange}
												required={formData.buyerType === 'WHOLESALE'}
											/>
										</div>
										<div className="auth-care-field-group">
											<label className="label">GSTIN Number *</label>
											<input
												className="input"
												type="text"
												name="customerGstin"
												placeholder="22AAAAA0000A1Z5"
												value={formData.customerGstin}
												onChange={handleInputChange}
												maxLength={15}
												required={formData.buyerType === 'WHOLESALE'}
											/>
										</div>
									</div>
								)}

								<div className="form-row auth-care-row">
									<div className="auth-care-field-group">
										<label className="label">Country *</label>
										<select
											className="select input"
											name="country"
											value={formData.country}
											onChange={handleInputChange}
											required={formData.role === 'CUSTOMER'}
										>
											{COUNTRY_OPTIONS.map((country) => (
												<option key={country.code} value={country.name}>{country.name}</option>
											))}
										</select>
									</div>
									<div className="auth-care-field-group">
										<label className="label">State / Region *</label>
										{(COUNTRY_OPTIONS.find((country) => country.name === formData.country)?.states || []).length > 0 ? (
											<select
												className="select input"
												name="state"
												value={formData.state}
												onChange={handleInputChange}
												required={formData.role === 'CUSTOMER'}
											>
												<option value="">Select state</option>
												{COUNTRY_OPTIONS.find((country) => country.name === formData.country).states.map((state) => (
													<option key={state} value={state}>{state}</option>
												))}
											</select>
										) : (
											<input
												className="input"
												type="text"
												name="state"
												placeholder="State/Region"
												value={formData.state}
												onChange={handleInputChange}
												required={formData.role === 'CUSTOMER'}
											/>
										)}
									</div>
									<div className="auth-care-field-group">
										<label className="label">City *</label>
										<input
											className="input"
											type="text"
											name="city"
											placeholder="Mumbai"
											value={formData.city}
											onChange={handleInputChange}
											required={formData.role === 'CUSTOMER'}
										/>
									</div>
								</div>

								<div className="auth-care-field-group" style={{ marginTop: '1rem' }}>
									<label className="label">Delivery Address *</label>
									<textarea
										className="input"
										name="deliveryAddress"
										placeholder="Complete delivery address"
										value={formData.deliveryAddress}
										onChange={handleInputChange}
										rows={2}
										required={formData.role === 'CUSTOMER'}
										style={{ resize: 'vertical' }}
									/>
								</div>
							</>
						)}

						{/* --- VENDOR FIELDS --- */}
						{formData.role === 'VENDOR' && (
							<>
								<div className="form-row auth-care-row">
									<div className="auth-care-field-group">
										<label className="label">Company Name *</label>
										<input
											className="input"
											type="text"
											name="companyName"
											placeholder="CareMeds Pvt Ltd"
											value={formData.companyName}
											onChange={handleInputChange}
											required={formData.role === 'VENDOR'}
										/>
									</div>
									<div className="auth-care-field-group">
										<label className="label">Vendor Type *</label>
										<select
											className="select input"
											name="vendorType"
											value={formData.vendorType}
											onChange={handleInputChange}
											required={formData.role === 'VENDOR'}
										>
											{VENDOR_TYPES.map(type => (
												<option key={type} value={type}>{type.charAt(0) + type.slice(1).toLowerCase()}</option>
											))}
										</select>
									</div>
								</div>

								<div className="form-row auth-care-row">
									<div className="auth-care-field-group">
										<label className="label">Contact Person *</label>
										<input
											className="input"
											type="text"
											name="contactPersonName"
											placeholder="John Doe"
											value={formData.contactPersonName}
											onChange={handleInputChange}
											required={formData.role === 'VENDOR'}
										/>
									</div>
									<div className="auth-care-field-group">
										<label className="label">Drug License Number *</label>
										<input
											className="input"
											type="text"
											name="drugLicenseNumber"
											placeholder="DL-MH-12345"
											value={formData.drugLicenseNumber}
											onChange={handleInputChange}
											required={formData.role === 'VENDOR'}
										/>
									</div>
								</div>

								<div className="form-row auth-care-row">
									<div className="auth-care-field-group">
										<label className="label">GSTIN Number *</label>
										<input
											className="input"
											type="text"
											name="gstinNumber"
											placeholder="22AAAAA0000A1Z5"
											value={formData.gstinNumber}
											onChange={handleInputChange}
											maxLength={15}
											required={formData.role === 'VENDOR'}
										/>
										<small style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Must be exactly 15 chars</small>
									</div>
									<div className="auth-care-field-group">
										<label className="label">Country *</label>
										<select
											className="select input"
											name="country"
											value={formData.country}
											onChange={handleInputChange}
											required={formData.role === 'VENDOR'}
										>
											{COUNTRY_OPTIONS.map((country) => (
												<option key={country.code} value={country.name}>{country.name}</option>
											))}
										</select>
									</div>
								</div>

								<div className="form-row auth-care-row">
									<div className="auth-care-field-group">
										<label className="label">State / Region *</label>
										{(COUNTRY_OPTIONS.find((country) => country.name === formData.country)?.states || []).length > 0 ? (
											<select
												className="select input"
												name="state"
												value={formData.state}
												onChange={handleInputChange}
												required={formData.role === 'VENDOR'}
											>
												<option value="">Select state</option>
												{COUNTRY_OPTIONS.find((country) => country.name === formData.country).states.map((state) => (
													<option key={state} value={state}>{state}</option>
												))}
											</select>
										) : (
											<input
												className="input"
												type="text"
												name="state"
												placeholder="State/Region"
												value={formData.state}
												onChange={handleInputChange}
												required={formData.role === 'VENDOR'}
											/>
										)}
									</div>
								</div>

								<div className="auth-care-field-group" style={{ marginTop: '1rem' }}>
									<label className="label">Business Address *</label>
									<textarea
										className="input"
										name="businessAddress"
										placeholder="Complete business address with pincode"
										value={formData.businessAddress}
										onChange={handleInputChange}
										rows={2}
										required={formData.role === 'VENDOR'}
										style={{ resize: 'vertical' }}
									/>
								</div>

								{/* VENDOR BANKING DETAILS */}
								<h3 style={{ marginTop: '2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Banking Details <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>(Optional)</span></h3>
								
								<div className="form-row auth-care-row">
									<div className="auth-care-field-group">
										<label className="label">Account Holder Name</label>
										<input className="input" type="text" value={formData.bankAccountDetails.accountHolderName} onChange={(e) => handleBankDetailChange('accountHolderName', e.target.value)} placeholder="Business / personal name" />
									</div>
									<div className="auth-care-field-group">
										<label className="label">Account Number</label>
										<input className="input" type="text" value={formData.bankAccountDetails.accountNumber} onChange={(e) => handleBankDetailChange('accountNumber', e.target.value)} placeholder="123456789012" />
									</div>
								</div>
								<div className="form-row auth-care-row">
									<div className="auth-care-field-group">
										<label className="label">Bank Name</label>
										<input className="input" type="text" value={formData.bankAccountDetails.bankName} onChange={(e) => handleBankDetailChange('bankName', e.target.value)} placeholder="State Bank of India" />
									</div>
									<div className="auth-care-field-group">
										<label className="label">IFSC Code</label>
										<input className="input" type="text" value={formData.bankAccountDetails.ifscCode} onChange={(e) => handleBankDetailChange('ifscCode', e.target.value.toUpperCase())} placeholder="SBIN0001234" />
									</div>
								</div>
								<div className="form-row auth-care-row">
									<div className="auth-care-field-group">
										<label className="label">Branch Name</label>
										<input className="input" type="text" value={formData.bankAccountDetails.branchName} onChange={(e) => handleBankDetailChange('branchName', e.target.value)} placeholder="Main Branch" />
									</div>
									<div className="auth-care-field-group">
										<label className="label">UPI ID</label>
										<input className="input" type="text" value={formData.bankAccountDetails.upiId} onChange={(e) => handleBankDetailChange('upiId', e.target.value)} placeholder="vendor@upi" />
									</div>
								</div>
								
								<div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#e8f4f8', borderRadius: '8px', border: '1px solid #b3d9e8' }}>
									<strong style={{ color: '#0f7f8a', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}><Info size={14} strokeWidth={1.75} /> Account Verification</strong>
									<p style={{ margin: '0.5rem 0 0 0', color: '#5a6b76', fontSize: '0.9rem' }}>
										Your vendor profile will be submitted for verification. Our team will review your GSTIN and drug license details before you can start selling.
									</p>
								</div>
							</>
						)}

						<button type="submit" className="button auth-care-submit" style={{ marginTop: '2rem' }} disabled={loading}>
							{loading ? 'Creating account...' : 'Create Account & Continue'}
						</button>

						<div className="auth-care-foot-row">
							<button
								type="button"
								className="auth-care-link-btn"
								onClick={() => navigate('/login')}
							>
								Already have an account? Sign in
							</button>
						</div>
					</form>
				</section>
			</div>
		</main>
	);
}

export default Register;

