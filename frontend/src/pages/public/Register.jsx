import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';
import { validateEmail, validatePassword, validatePhone, validatePasswordMatch } from '../../utils/validation';

function Register() {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		email: '',
		mobile: '',
		password: '',
		confirmPassword: '',
		role: 'CUSTOMER'
	});
	const [errors, setErrors] = useState({});
	const [passwordStrength, setPasswordStrength] = useState('weak');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData({
			...formData,
			[name]: value
		});

		// Clear error for this field as user types
		if (errors[name]) {
			setErrors({
				...errors,
				[name]: ''
			});
		}

		// Update password strength indicator in real-time
		if (name === 'password') {
			const validation = validatePassword(value);
			setPasswordStrength(validation.strength);
		}

		setError('');
	};

	const handleRoleSelect = (role) => {
		setFormData({
			...formData,
			role
		});
		setError('');
	};

	const validateForm = () => {
		const newErrors = {};

		// Validate email
		const emailValidation = validateEmail(formData.email);
		if (!emailValidation.isValid) {
			newErrors.email = emailValidation.error;
		}

		// Validate mobile (optional but if provided, must be valid)
		if (formData.mobile.trim()) {
			const phoneValidation = validatePhone(formData.mobile);
			if (!phoneValidation.isValid) {
				newErrors.mobile = phoneValidation.error;
			}
		}

		// Validate password
		const passwordValidation = validatePassword(formData.password);
		if (!passwordValidation.isValid) {
			newErrors.password = passwordValidation.error;
		}

		// Validate password match
		const passwordMatchValidation = validatePasswordMatch(formData.password, formData.confirmPassword);
		if (!passwordMatchValidation.isValid) {
			newErrors.confirmPassword = passwordMatchValidation.error;
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');

		// Validate before submitting
		if (!validateForm()) {
			return;
		}

		setLoading(true);

		try {
			const result = await authService.register({
				email: formData.email,
				mobile: formData.mobile,
				password: formData.password,
				role: formData.role
			});

			// Redirect to role-specific main page after registration
			if (result.user.role === 'VENDOR') {
				navigate('/vendor/dashboard');
			} else if (result.user.role === 'CUSTOMER') {
				navigate('/customer/catalog');
			} else if (result.user.role === 'ADMIN') {
				navigate('/admin/dashboard');
			} else {
				navigate('/');
			}
		} catch (err) {
			setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="page">
			<div className="container grid grid-2">
				<div className="card reveal">
					<h2 className="section-title">Create your account</h2>
					<p className="section-subtitle">Join MedBroker to access global medicine marketplace.</p>
					
					<form onSubmit={handleSubmit} className="grid" style={{ marginTop: '1.5rem' }}>
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
							<label className="label">I want to register as</label>
							<div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
								<button
									type="button"
									className={formData.role === 'CUSTOMER' ? 'button' : 'button-outline'}
									onClick={() => handleRoleSelect('CUSTOMER')}
								>
									Customer / Buyer
								</button>
								<button
									type="button"
									className={formData.role === 'VENDOR' ? 'button' : 'button-outline'}
									onClick={() => handleRoleSelect('VENDOR')}
								>
									Vendor / Supplier
								</button>
							</div>
						</div>

						<div className="form-row">
							<div>
								<label className="label">Email address *</label>
								<input
									className="input"
									type="email"
									name="email"
									placeholder="name@company.com"
									value={formData.email}
									onChange={handleInputChange}
									style={errors.email ? { borderColor: '#dc2626' } : {}}
								/>
								{errors.email && (
									<span style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
										{errors.email}
									</span>
								)}
							</div>
							<div>
								<label className="label">Mobile number</label>
								<input
									className="input"
									type="tel"
									name="mobile"
									placeholder="+91 98765 43210"
									value={formData.mobile}
									onChange={handleInputChange}
									style={errors.mobile ? { borderColor: '#dc2626' } : {}}
								/>
								{errors.mobile && (
									<span style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
										{errors.mobile}
									</span>
								)}
							</div>
						</div>

						<div className="form-row">
							<div>
								<label className="label">
									Password *
									{formData.password && (
										<span style={{
											marginLeft: '0.5rem',
											fontSize: '0.8rem',
											fontWeight: 'normal',
											color: passwordStrength === 'strong' ? '#16a34a' : passwordStrength === 'medium' ? '#ca8a04' : '#dc2626'
										}}>
											({passwordStrength})
										</span>
									)}
								</label>
								<input
									className="input"
									type="password"
									name="password"
									placeholder="••••••••"
									value={formData.password}
									onChange={handleInputChange}
									style={errors.password ? { borderColor: '#dc2626' } : {}}
								/>
								{errors.password && (
									<span style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
										{errors.password}
									</span>
								)}
							</div>
							<div>
								<label className="label">Confirm password *</label>
								<input
									className="input"
									type="password"
									name="confirmPassword"
									placeholder="••••••••"
									value={formData.confirmPassword}
									onChange={handleInputChange}
									style={errors.confirmPassword ? { borderColor: '#dc2626' } : {}}
								/>
								{errors.confirmPassword && (
									<span style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
										{errors.confirmPassword}
									</span>
								)}
							</div>
						</div>

						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
						<button
							type="button"
							onClick={() => navigate('/login')}
							style={{ background: 'none', border: 'none', color: '#1E88E5', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
						>
							Already have an account? Sign in
						</button>
							<button type="submit" className="button" disabled={loading}>
								{loading ? 'Creating account...' : 'Continue to onboarding'}
							</button>
						</div>
					</form>
				</div>

				<div className="card-soft reveal">
					<h3>What happens next?</h3>
					<div className="grid" style={{ marginTop: '1rem', gap: '1rem' }}>
						<div className="card">
							<strong>Step 1: Account creation</strong>
							<p className="section-subtitle">Create your account with email and password.</p>
						</div>
						<div className="card">
							<strong>Step 2: Profile setup</strong>
							<p className="section-subtitle">Provide business details and regulatory information.</p>
						</div>
						<div className="card">
							<strong>Step 3: Verification</strong>
							<p className="section-subtitle">Our team will verify your credentials (vendors only).</p>
						</div>
						<div className="card">
							<strong>Step 4: Start trading</strong>
							<p className="section-subtitle">Access marketplace, browse medicines, place orders.</p>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}

export default Register;
