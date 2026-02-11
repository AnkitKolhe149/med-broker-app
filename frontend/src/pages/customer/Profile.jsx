import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';

function CustomerProfile() {
	const navigate = useNavigate();
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [successMessage, setSuccessMessage] = useState('');

	const [formData, setFormData] = useState({
		fullName: '',
		phoneNumber: '',
		email: '',
		address: '',
		city: '',
		state: '',
		zipCode: '',
		buyerType: 'RETAIL'
	});

	useEffect(() => {
		loadUserData();
	}, []);

	const loadUserData = async () => {
		try {
			const userData = await authService.getCurrentUser();
			setUser(userData);
			if (userData?.customer) {
				setFormData({
					fullName: userData.customer.fullName || '',
					phoneNumber: userData.customer.phoneNumber || '',
					email: userData.email || '',
					address: userData.customer.address || '',
					city: userData.customer.city || '',
					state: userData.customer.state || '',
					zipCode: userData.customer.zipCode || '',
					buyerType: userData.customer.buyerType || 'RETAIL'
				});
			}
		} catch (error) {
			console.error('Failed to load user data:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));
	};

	const handleSaveProfile = async (e) => {
		e.preventDefault();
		if (!validateForm()) return;

		setIsSaving(true);
		try {
			// In real implementation, this would call an API
			await new Promise(resolve => setTimeout(resolve, 1000));

			// Update local state
			setUser(prev => ({
				...prev,
				customer: { ...prev.customer, ...formData }
			}));

			setIsEditing(false);
			setSuccessMessage('Profile updated successfully!');
			setTimeout(() => setSuccessMessage(''), 3000);
		} catch (error) {
			console.error('Failed to update profile:', error);
			alert('Failed to update profile. Please try again.');
		} finally {
			setIsSaving(false);
		}
	};

	const validateForm = () => {
		if (!formData.fullName.trim()) {
			alert('Please enter your full name');
			return false;
		}
		if (!formData.phoneNumber.trim() || formData.phoneNumber.length < 10) {
			alert('Please enter a valid phone number');
			return false;
		}
		if (!formData.address.trim()) {
			alert('Please enter your address');
			return false;
		}
		if (!formData.city.trim()) {
			alert('Please enter your city');
			return false;
		}
		if (!formData.zipCode.trim()) {
			alert('Please enter your ZIP code');
			return false;
		}
		return true;
	};

	const handleLogout = () => {
		if (window.confirm('Are you sure you want to logout?')) {
			authService.logout();
			navigate('/login');
		}
	};

	const hasOrders = (user?.customer?.totalOrders || 0) > 0;

	if (loading) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
				<p>Loading profile...</p>
			</div>
		);
	}

	return (
		<main className="page">
			<div className="container">
				<div className="page-header">
					<div className="title-group">
						<h1 className="section-title">My Profile</h1>
						<p className="section-subtitle">Manage your personal information and account settings</p>
					</div>
				</div>

				<div style={styles.mainContent}>
					{/* Left: Profile Form */}
					<section className="section">
						{successMessage && (
							<div style={styles.successAlert}>
								✓ {successMessage}
							</div>
						)}

						<form onSubmit={handleSaveProfile}>
							<div style={styles.formHeader}>
								<h2 style={styles.formTitle}>Personal Information</h2>
								{!isEditing && (
									<button
										type="button"
										onClick={() => setIsEditing(true)}
										style={styles.editButton}
									>
										✏️ Edit Profile
									</button>
								)}
							</div>

							{/* Profile Avatar */}
							<div style={styles.avatarSection}>
								<div style={styles.avatar}>
									{formData.fullName.charAt(0).toUpperCase()}
								</div>
								<div>
									<p style={styles.userName}>{formData.fullName || 'User'}</p>
									<p style={styles.userEmail}>{user?.email}</p>
									<p style={styles.buyerTypeInfo}>
										Buyer Type: <span style={styles.buyerTypeBadge}>{formData.buyerType}</span>
									</p>
								</div>
							</div>

							<hr style={styles.divider} />

							{/* Form Fields */}
							<div style={styles.formGroup}>
								<label style={styles.label}>Full Name</label>
								<input
									type="text"
									name="fullName"
									value={formData.fullName}
									onChange={handleInputChange}
									disabled={!isEditing}
									style={{
										...styles.input,
										backgroundColor: isEditing ? 'white' : 'var(--surface)',
										cursor: isEditing ? 'text' : 'not-allowed'
									}}
								/>
							</div>

							<div style={styles.formGrid}>
								<div style={styles.formGroup}>
									<label style={styles.label}>Phone Number</label>
									<input
										type="tel"
										name="phoneNumber"
										value={formData.phoneNumber}
										onChange={handleInputChange}
										disabled={!isEditing}
										style={{
											...styles.input,
											backgroundColor: isEditing ? 'white' : 'var(--surface)',
											cursor: isEditing ? 'text' : 'not-allowed'
										}}
									/>
								</div>

								<div style={styles.formGroup}>
									<label style={styles.label}>Email</label>
									<input
										type="email"
										name="email"
										value={formData.email}
										disabled
										style={{
											...styles.input,
											backgroundColor: 'var(--surface)',
											cursor: 'not-allowed'
										}}
									/>
									<p style={styles.fieldNote}>Email cannot be changed</p>
								</div>
							</div>

							{/* Address Section */}
							<div style={styles.sectionDivider} />
							<h3 style={styles.sectionTitle}>Address</h3>

							<div style={styles.formGroup}>
								<label style={styles.label}>Street Address</label>
								<input
									type="text"
									name="address"
									value={formData.address}
									onChange={handleInputChange}
									disabled={!isEditing}
									style={{
										...styles.input,
										backgroundColor: isEditing ? 'white' : 'var(--surface)',
										cursor: isEditing ? 'text' : 'not-allowed'
									}}
								/>
							</div>

							<div style={styles.formGrid}>
								<div style={styles.formGroup}>
									<label style={styles.label}>City</label>
									<input
										type="text"
										name="city"
										value={formData.city}
										onChange={handleInputChange}
										disabled={!isEditing}
										style={{
											...styles.input,
											backgroundColor: isEditing ? 'white' : 'var(--surface)',
											cursor: isEditing ? 'text' : 'not-allowed'
										}}
									/>
								</div>

								<div style={styles.formGroup}>
									<label style={styles.label}>State</label>
									<input
										type="text"
										name="state"
										value={formData.state}
										onChange={handleInputChange}
										disabled={!isEditing}
										style={{
											...styles.input,
											backgroundColor: isEditing ? 'white' : 'var(--surface)',
											cursor: isEditing ? 'text' : 'not-allowed'
										}}
									/>
								</div>

								<div style={styles.formGroup}>
									<label style={styles.label}>PIN Code</label>
									<input
										type="text"
										name="zipCode"
										value={formData.zipCode}
										onChange={handleInputChange}
										disabled={!isEditing}
										style={{
											...styles.input,
											backgroundColor: isEditing ? 'white' : 'var(--surface)',
											cursor: isEditing ? 'text' : 'not-allowed'
										}}
									/>
								</div>
							</div>

							{/* Buyer Type Section */}
							<div style={styles.sectionDivider} />
							<h3 style={styles.sectionTitle}>Buyer Type</h3>

							<div style={styles.buyerTypeSection}>
								<p style={styles.buyerTypeNote}>
									Your current buyer type determines the pricing you receive. Changing this requires verification.
								</p>
								{hasOrders && (
									<p style={styles.buyerTypeWarning}>
										Buyer type cannot be changed after placing orders.
									</p>
								)}
								<div style={styles.radioGroup}>
									<label style={styles.radioLabel}>
										<input
											type="radio"
											name="buyerType"
											value="RETAIL"
											checked={formData.buyerType === 'RETAIL'}
											onChange={handleInputChange}
											disabled={!isEditing || hasOrders}
											style={styles.radioInput}
										/>
										<span>
											<strong>Retail</strong>
											<p style={styles.typeDescription}>Regular customer pricing</p>
										</span>
									</label>

									<label style={styles.radioLabel}>
										<input
											type="radio"
											name="buyerType"
											value="WHOLESALE"
											checked={formData.buyerType === 'WHOLESALE'}
											onChange={handleInputChange}
											disabled={!isEditing || hasOrders}
											style={styles.radioInput}
										/>
										<span>
											<strong>Wholesale</strong>
											<p style={styles.typeDescription}>Bulk pricing with discounts</p>
										</span>
									</label>
								</div>
							</div>

							{/* Form Actions */}
							{isEditing && (
								<div style={styles.formActions}>
									<button
										type="submit"
										disabled={isSaving}
										style={{
											...styles.saveButton,
											opacity: isSaving ? 0.6 : 1
										}}
									>
										{isSaving ? 'Saving...' : '💾 Save Changes'}
									</button>
									<button
										type="button"
										onClick={() => {
											setIsEditing(false);
											loadUserData();
										}}
										style={styles.cancelButton}
									>
										✕ Cancel
									</button>
								</div>
							)}
						</form>
					</section>

					{/* Right: Additional Info & Actions */}
					<div style={styles.infoSection}>
						{/* Account Stats */}
						<section className="section" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
							<h2 style={styles.cardTitle}>Account Stats</h2>
							<div style={styles.stat}>
								<p style={styles.statLabel}>Member Since</p>
								<p style={styles.statValue}>
									{new Date(user?.createdAt || Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}
								</p>
							</div>
							<div style={styles.stat}>
								<p style={styles.statLabel}>Total Orders</p>
								<p style={styles.statValue}>4</p>
							</div>
							<div style={styles.stat}>
								<p style={styles.statLabel}>Account Status</p>
								<p style={{ ...styles.statValue, color: 'var(--success)' }}>✓ Active</p>
							</div>
						</section>

						{/* Quick Actions */}
						<section className="section" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
							<h2 style={styles.cardTitle}>Quick Actions</h2>
							<button style={styles.actionLink}>🛒 Continue Shopping</button>
							<button style={styles.actionLink}>📦 My Orders</button>
							<button style={styles.actionLink}>❤️ Wishlist</button>
							<button style={styles.actionLink}>🔔 Notifications</button>
						</section>

						{/* Account Security */}
						<section className="section" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
							<h2 style={styles.cardTitle}>Account Security</h2>
							<button style={styles.actionLink}>🔐 Change Password</button>
							<button style={styles.actionLink}>📱 Two-Factor Auth</button>
							<button style={styles.actionLink}>🔗 Linked Accounts</button>
						</section>

						{/* Preferences */}
						<section className="section" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
							<h2 style={styles.cardTitle}>Preferences</h2>
							<label style={styles.checkboxLabel}>
								<input type="checkbox" defaultChecked style={styles.checkbox} />
								<span>Email notifications</span>
							</label>
							<label style={styles.checkboxLabel}>
								<input type="checkbox" defaultChecked style={styles.checkbox} />
								<span>SMS updates</span>
							</label>
							<label style={styles.checkboxLabel}>
								<input type="checkbox" style={styles.checkbox} />
								<span>Marketing emails</span>
							</label>
						</section>

						{/* Danger Zone */}
						<section className="section" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
							<h2 style={{ ...styles.cardTitle, color: 'var(--error)' }}>Danger Zone</h2>
							<button style={styles.logoutButton} onClick={handleLogout}>
								🚪 Logout
							</button>
							<button style={styles.deleteButton}>
								🗑️ Delete Account
							</button>
							<p style={styles.warningText}>
								Deleting your account is permanent and cannot be undone.
							</p>
						</section>
					</div>
				</div>
			</div>
		</main>
	);
}

const styles = {
	mainContent: {
		display: 'grid',
		gridTemplateColumns: '2fr 1fr',
		gap: '2rem',
		marginTop: '2rem'
	},
	successAlert: {
		backgroundColor: '#DCFCE7',
		color: 'var(--success)',
		padding: '1rem',
		borderRadius: 'var(--radius)',
		marginBottom: '1rem',
		fontWeight: '600',
		border: '1px solid var(--green-200)'
	},
	editButtonContainer: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: '1.5rem'
	},
	formTitle: {
		fontSize: '1.1rem',
		fontWeight: '700',
		color: 'var(--text-primary)',
		margin: 0
	},
	editButton: {
		background: 'none',
		border: '1px solid var(--primary)',
		color: 'var(--primary)',
		padding: '0.5rem 1rem',
		borderRadius: 'var(--radius)',
		cursor: 'pointer',
		fontWeight: '500'
	},
	avatarSection: {
		display: 'flex',
		gap: '1.5rem',
		alignItems: 'center',
		marginBottom: '1.5rem',
		padding: '1.5rem',
		backgroundColor: 'var(--primary-light)',
		borderRadius: 'var(--radius)',
		border: '1px solid var(--green-200)'
	},
	avatar: {
		width: '60px',
		height: '60px',
		borderRadius: 'var(--radius-full)',
		backgroundColor: 'var(--primary)',
		color: 'white',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: '1.75rem',
		fontWeight: '700',
		flexShrink: 0
	},
	userName: {
		fontSize: '1rem',
		fontWeight: '600',
		color: 'var(--text-primary)',
		margin: 0
	},
	userEmail: {
		fontSize: '0.85rem',
		color: 'var(--text-secondary)',
		margin: '0.25rem 0'
	},
	buyerTypeInfo: {
		fontSize: '0.9rem',
		color: 'var(--text-secondary)',
		margin: '0.5rem 0 0 0'
	},
	buyerTypeBadge: {
		backgroundColor: 'var(--primary)',
		color: 'white',
		padding: '0.2rem 0.6rem',
		borderRadius: 'var(--radius)',
		fontSize: '0.8rem',
		fontWeight: '600'
	},
	divider: {
		border: 'none',
		borderTop: '1px solid var(--border)',
		margin: '1.5rem 0'
	},
	formGroup: {
		marginBottom: '1.5rem'
	},
	label: {
		display: 'block',
		fontSize: '0.9rem',
		fontWeight: '600',
		color: 'var(--text-primary)',
		marginBottom: '0.5rem'
	},
	input: {
		width: '100%',
		padding: '0.75rem',
		border: '1px solid var(--border)',
		borderRadius: 'var(--radius)',
		fontSize: '0.9rem',
		fontFamily: 'inherit',
		outline: 'none',
		transition: 'border-color 0.2s'
	},
	fieldNote: {
		fontSize: '0.75rem',
		color: 'var(--text-secondary)',
		margin: '0.25rem 0 0 0'
	},
	formGrid: {
		display: 'grid',
		gridTemplateColumns: '1fr 1fr',
		gap: '1.5rem'
	},
	sectionDivider: {
		borderTop: '2px solid var(--border)',
		margin: '2rem 0'
	},
	sectionTitle: {
		fontSize: '1rem',
		fontWeight: '700',
		color: 'var(--text-primary)',
		margin: '0 0 1.5rem 0'
	},
	buyerTypeSection: {
		marginBottom: '1.5rem'
	},
	buyerTypeNote: {
		fontSize: '0.85rem',
		color: 'var(--text-secondary)',
		marginBottom: '1rem'
	},
	buyerTypeWarning: {
		fontSize: '0.8rem',
		color: 'var(--error)',
		marginBottom: '1rem'
	},
	radioGroup: {
		display: 'flex',
		flexDirection: 'column',
		gap: '1rem'
	},
	radioLabel: {
		display: 'flex',
		gap: '1rem',
		padding: '1rem',
		border: '1px solid var(--border)',
		borderRadius: 'var(--radius)',
		cursor: 'pointer',
		alignItems: 'flex-start'
	},
	radioInput: {
		width: '18px',
		height: '18px',
		marginTop: '2px',
		cursor: 'pointer',
		accentColor: 'var(--primary)',
		flexShrink: 0
	},
	typeDescription: {
		fontSize: '0.8rem',
		color: 'var(--text-secondary)',
		margin: '0.25rem 0 0 0'
	},
	formActions: {
		display: 'flex',
		gap: '0.75rem',
		marginTop: '2rem'
	},
	saveButton: {
		flex: 1,
		padding: '0.75rem',
		backgroundColor: 'var(--primary)',
		color: 'white',
		border: 'none',
		borderRadius: 'var(--radius)',
		fontWeight: '600',
		cursor: 'pointer'
	},
	cancelButton: {
		flex: 1,
		padding: '0.75rem',
		backgroundColor: 'var(--surface)',
		color: 'var(--text-primary)',
		border: '1px solid var(--border)',
		borderRadius: 'var(--radius)',
		fontWeight: '600',
		cursor: 'pointer'
	},
	infoSection: {
		display: 'flex',
		flexDirection: 'column',
		gap: '1rem'
	},
	cardTitle: {
		fontSize: '1rem',
		fontWeight: '700',
		color: 'var(--text-primary)',
		margin: '0 0 1rem 0',
		paddingBottom: '0.75rem',
		borderBottom: '2px solid var(--primary)'
	},
	stat: {
		marginBottom: '1rem',
		paddingBottom: '1rem',
		borderBottom: '1px solid var(--border-light)'
	},
	statLabel: {
		fontSize: '0.85rem',
		color: 'var(--text-secondary)',
		margin: '0 0 0.25rem 0'
	},
	statValue: {
		fontSize: '1.1rem',
		fontWeight: '700',
		color: 'var(--primary)',
		margin: 0
	},
	actionLink: {
		width: '100%',
		padding: '0.75rem',
		backgroundColor: 'var(--surface)',
		color: 'var(--text-primary)',
		border: '1px solid var(--border)',
		borderRadius: 'var(--radius)',
		cursor: 'pointer',
		fontSize: '0.9rem',
		fontWeight: '500',
		marginBottom: '0.5rem',
		transition: 'all 0.2s'
	},
	checkboxLabel: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
		cursor: 'pointer',
		fontSize: '0.9rem',
		marginBottom: '0.75rem'
	},
	checkbox: {
		width: '18px',
		height: '18px',
		cursor: 'pointer',
		accentColor: 'var(--primary)'
	},
	logoutButton: {
		width: '100%',
		padding: '0.75rem',
		backgroundColor: '#FEE2E2',
		color: 'var(--error)',
		border: '1px solid var(--error)',
		borderRadius: 'var(--radius)',
		cursor: 'pointer',
		fontWeight: '600',
		marginBottom: '0.5rem'
	},
	deleteButton: {
		width: '100%',
		padding: '0.75rem',
		backgroundColor: 'var(--error)',
		color: 'white',
		border: 'none',
		borderRadius: 'var(--radius)',
		cursor: 'pointer',
		fontWeight: '600',
		marginBottom: '0.75rem'
	},
	warningText: {
		fontSize: '0.8rem',
		color: 'var(--error)',
		margin: 0
	}
};

export default CustomerProfile;
