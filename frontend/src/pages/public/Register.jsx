import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';

function Register() {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		email: '',
		mobile: '',
		password: '',
		confirmPassword: '',
		role: 'CUSTOMER'
	});
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleInputChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value
		});
		setError('');
	};

	const handleRoleSelect = (role) => {
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
		if (formData.password.length < 6) {
			setError('Password must be at least 6 characters long');
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
				navigate('/customer/dashboard');
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
									required
								/>
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
								/>
							</div>
						</div>

						<div className="form-row">
							<div>
								<label className="label">Password *</label>
								<input
									className="input"
									type="password"
									name="password"
									placeholder="••••••••"
									value={formData.password}
									onChange={handleInputChange}
									required
									minLength={6}
								/>
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
									required
									minLength={6}
								/>
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
