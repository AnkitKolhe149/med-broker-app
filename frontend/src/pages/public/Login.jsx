import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';

function Login() {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		email: '',
		password: '',
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
				navigate('/customer/catalog');
			} else if (result.user.role === 'ADMIN') {
				navigate('/admin/dashboard');
			} else {
				navigate('/');
			}
		} catch (err) {
			setError(err.response?.data?.message || err.message || 'Invalid credentials. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="page">
			<div className="container grid grid-2">
				<div className="card reveal">
					<h2 className="section-title">Sign in to MedBroker</h2>
					<p className="section-subtitle">Access your dashboard, orders, and pricing controls.</p>
					
					<form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }} className="grid">
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
							<label className="label">Email address</label>
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
							<label className="label">Password</label>
							<input
								className="input"
								type="password"
								name="password"
								placeholder="••••••••"
								value={formData.password}
								onChange={handleInputChange}
								required
							/>
						</div>

						<div>
							<label className="label">Sign in as (Required)</label>
							<div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
								<button
									type="button"
									className={formData.role === 'CUSTOMER' ? 'button' : 'button-outline'}
									onClick={() => handleRoleSelect('CUSTOMER')}
								>
									Customer
								</button>
								<button
									type="button"
									className={formData.role === 'VENDOR' ? 'button' : 'button-outline'}
									onClick={() => handleRoleSelect('VENDOR')}
								>
									Vendor
								</button>
							</div>
							<p className="section-subtitle" style={{ marginTop: '0.5rem' }}>
								Admin access is restricted to internal operations.
							</p>
						</div>

						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
							<span className="badge">🔒 Secure JWT Auth</span>
							<div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
							<button
								type="button"
								onClick={() => navigate('/register')}
								style={{ background: 'none', border: 'none', color: '#1E88E5', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
							>
								Don't have an account?
							</button>
								<button type="submit" className="button" disabled={loading}>
									{loading ? 'Signing in...' : 'Sign in'}
								</button>
							</div>
						</div>
					</form>
				</div>

				<div className="card-soft reveal">
					<h3>What you can do</h3>
					<ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#5a6b76', lineHeight: 1.8 }}>
						<li>Manage medicine catalogs and regulatory metadata.</li>
						<li>Track orders with live status updates.</li>
						<li>Monitor pricing margins and vendor share.</li>
						<li>Download invoices, receipts, and reports.</li>
					</ul>
				</div>
			</div>
		</main>
	);
}

export default Login;
