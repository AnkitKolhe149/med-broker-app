import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';
import './AuthCare.css';

function Register() {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		email: '',
		mobile: '',
		password: '',
		confirmPassword: '',
		role: 'CUSTOMER'  // ✅ Default to CUSTOMER only (ADMIN can only be added by existing admins)
	});
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const handleInputChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value
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

		setLoading(true);

		try {
			const result = await authService.register({
				email: formData.email,
				mobile: formData.mobile,
				password: formData.password,
				role: formData.role
			});

			// ✅ Redirect to role-specific main page after registration (ADMIN cannot register publicly)
			if (result.user.role === 'VENDOR') {
				navigate('/vendor/dashboard');
			} else if (result.user.role === 'CUSTOMER') {
				navigate('/customer/dashboard');
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
		<main className="auth-care-page page">
			<div className="container auth-care-container">
				<section className="auth-care-hero reveal">
					<p className="auth-care-kicker">Healthcare Onboarding</p>
					<h1 className="auth-care-title">Create your MedIQ account</h1>
					<p className="auth-care-subtitle">
						Start in minutes and connect with a verified medicine marketplace tailored for clinics, hospitals, and suppliers.
					</p>
				</section>

				<section className="auth-care-card card reveal">
					<form onSubmit={handleSubmit} className="auth-care-form">
						{error && <div className="auth-care-error">{error}</div>}

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
								{/* ✅ ADMIN role disabled from public registration - only existing admins can add new admins */}
							</div>
						</div>

						<div className="form-row auth-care-row">
							<div className="auth-care-field-group">
								<label className="label">Email address</label>
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

						<div className="form-row auth-care-row">
							<div className="auth-care-field-group">
								<label className="label">Password</label>
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
								<label className="label">Confirm password</label>
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

						<button type="submit" className="button auth-care-submit" disabled={loading}>
							{loading ? 'Creating account...' : 'Continue to onboarding'}
						</button>

						<div className="auth-care-foot-row">
							<button
								type="button"
								className="auth-care-link-btn"
								onClick={() => navigate('/login')}
							>
								Already have an account? Sign in
							</button>
							<span className="auth-care-foot-note">After signup, your profile setup and verification flow starts automatically.</span>
						</div>
					</form>
				</section>
			</div>
		</main>
	);
}

export default Register;
