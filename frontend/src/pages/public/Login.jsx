import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';
import './AuthCare.css';

function Login() {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		email: '',
		password: '',
		role: 'CUSTOMER'
	});
	const [error, setError] = useState('');
	const [suspended, setSuspended] = useState(false);
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	const handleInputChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value
		});
		setError('');
		setSuspended(false);
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
		setLoading(true);

		try {
			const result = await authService.login(
				formData.email,
				formData.password,
				formData.role
			);

			// Redirect to role-specific main page after login
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
			const status = err.response?.status;
			const code = err.response?.data?.code;
			if (status === 403 && code === 'ACCOUNT_SUSPENDED') {
				setSuspended(true);
				setError('');
			} else {
				setSuspended(false);
				setError(err.response?.data?.message || err.message || 'Invalid credentials. Please try again.');
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="auth-care-page page">
			<div className="container auth-care-container">
				<section className="auth-care-hero reveal">
					<p className="auth-care-kicker">Trusted Healthcare Commerce</p>
					<h1 className="auth-care-title">Sign in to your MedIQ workspace</h1>
					<p className="auth-care-subtitle">
						Built for hospitals, clinics, and verified suppliers with secure access and role-based control.
					</p>
				</section>

				<section className="auth-care-card auth-care-card-login card reveal">
					<form onSubmit={handleSubmit} className="auth-care-form">
						<div className="auth-care-form-header">
							<h2 className="auth-care-form-title">Welcome back</h2>
							<p className="auth-care-form-subtitle">Sign in to continue your healthcare procurement workflow.</p>
						</div>

						{suspended && (
							<div className="auth-care-error auth-care-suspended">
								⚠️ Your account has been suspended. Please contact support.
							</div>
						)}
						{error && <div className="auth-care-error">{error}</div>}

						<div>
							<label className="label">Continue as</label>
							<div className="auth-care-role-switch" role="group" aria-label="Select user role">
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
								<button
									type="button"
									className={formData.role === 'ADMIN' ? 'auth-care-role-btn active' : 'auth-care-role-btn'}
									onClick={() => handleRoleSelect('ADMIN')}
								>
									Admin
								</button>
							</div>
						</div>

						<div className="auth-care-field-group">
							<label className="label">Email address</label>
							<input
								className="input"
								type="email"
								name="email"
								placeholder="name@hospital.com"
								value={formData.email}
								onChange={handleInputChange}
								required
							/>
						</div>

						<div className="auth-care-field-group">
							<label className="label">Password</label>
							<div className="auth-care-password-wrap">
								<input
									className="input"
									type={showPassword ? 'text' : 'password'}
									name="password"
									placeholder="Enter your password"
									value={formData.password}
									onChange={handleInputChange}
									required
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

						<button type="submit" className="button auth-care-submit" disabled={loading}>
							{loading ? 'Signing in...' : 'Sign in securely'}
						</button>

						<div className="auth-care-foot-row">
							<button
								type="button"
								className="auth-care-link-btn"
								onClick={() => navigate('/register')}
							>
								Create a new account
							</button>
							<span className="auth-care-foot-note">Admin access is restricted to internal operations.</span>
						</div>
					</form>
				</section>
			</div>
		</main>
	);
}

export default Login;
