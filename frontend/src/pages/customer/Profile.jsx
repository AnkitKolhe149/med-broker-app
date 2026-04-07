import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';
import Avatar from '../../components/common/Avatar';
import styles from './Profile.module.css';

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
		buyerType: 'RETAIL',
		profileImage: null
	});
	const [previewImage, setPreviewImage] = useState(null);
	const [imageFile, setImageFile] = useState(null);

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

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			// Validate file type
			const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
			if (!validTypes.includes(file.type)) {
				alert('Please upload a valid image (JPG, PNG, or WebP)');
				return;
			}
			// Validate file size (max 5MB)
			if (file.size > 5 * 1024 * 1024) {
				alert('Image size must be less than 5MB');
				return;
			}
			setImageFile(file);
			// Create preview
			const reader = new FileReader();
			reader.onloadend = () => {
				setPreviewImage(reader.result);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleRemoveImage = () => {
		setPreviewImage(null);
		setImageFile(null);
		setFormData(prev => ({
			...prev,
			profileImage: null
		}));
	};

	const handleSaveProfile = async (e) => {
		e.preventDefault();
		if (!validateForm()) return;

		setIsSaving(true);
		try {
			// In real implementation, this would call an API
			await new Promise(resolve => setTimeout(resolve, 1000));

			// Handle image upload if new image selected
			if (imageFile) {
				const imgData = previewImage; // In real app, upload to server
				formData.profileImage = imgData;
			}

			// Update local state
			setUser(prev => ({
				...prev,
				customer: { ...prev.customer, ...formData }
			}));

			setImageFile(null);
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

				<div className={styles.mainContent}>
					{/* Left: Profile Form */}
					<section className="section">
						{successMessage && (
							<div className={styles.successAlert}>
								✓ {successMessage}
							</div>
						)}

						<form onSubmit={handleSaveProfile}>
							<div className={styles.formHeader}>
								<h2 className={styles.formTitle}>Personal Information</h2>
								{!isEditing && (
									<button
										type="button"
										onClick={() => setIsEditing(true)}
										className={styles.editButton}
									>
										✏️ Edit Profile
									</button>
								)}
							</div>

{/* Profile Avatar Section */}
						<div className={styles.avatarSection}>
							<div style={{ position: 'relative' }}>
								<Avatar 
									src={previewImage}
									name={formData.fullName}
									size={80}
								/>
								{isEditing && (
									<label 
										className={styles.uploadImageButton}
										title="Upload profile picture"
									>
										📷
										<input
											type="file"
											accept="image/*"
											style={{ display: 'none' }}
											onChange={handleImageChange}
										/>
									</label>
								)}
							</div>
							<div>
								<p className={styles.userName}>{formData.fullName || 'User'}</p>
								<p className={styles.userEmail}>{user?.email}</p>
								<p className={styles.buyerTypeInfo}>
									Buyer Type: <span className={styles.buyerTypeBadge}>{formData.buyerType}</span>
								</p>
								{previewImage && isEditing && (
									<button
										type="button"
										className={styles.removeImageButton}
										onClick={handleRemoveImage}
									>
										✕ Remove Image
									</button>
								)}
								</div>
							</div>

							<hr className={styles.divider} />

							{/* Form Fields */}
							<div className={styles.formGroup}>
								<label className={styles.label}>Full Name</label>
								<input
									type="text"
									name="fullName"
									value={formData.fullName}
									onChange={handleInputChange}
									disabled={!isEditing}
									className={styles.input}
									style={{
										backgroundColor: isEditing ? 'white' : 'var(--surface)',
										cursor: isEditing ? 'text' : 'not-allowed'
									}}
								/>
							</div>

							<div className={styles.formGrid}>
								<div className={styles.formGroup}>
									<label className={styles.label}>Phone Number</label>
									<input
										type="tel"
										name="phoneNumber"
										value={formData.phoneNumber}
										onChange={handleInputChange}
										disabled={!isEditing}
										className={styles.input}
										style={{
											backgroundColor: isEditing ? 'white' : 'var(--surface)',
											cursor: isEditing ? 'text' : 'not-allowed'
										}}
									/>
								</div>

								<div className={styles.formGroup}>
									<label className={styles.label}>Email</label>
									<input
										type="email"
										name="email"
										value={formData.email}
										disabled
										className={styles.input}
										style={{
											backgroundColor: 'var(--surface)',
											cursor: 'not-allowed'
										}}
									/>
									<p className={styles.fieldNote}>Email cannot be changed</p>
								</div>
							</div>

							{/* Address Section */}
							<div className={styles.sectionDivider} />
							<h3 className={styles.sectionTitle}>Address</h3>

							<div className={styles.formGroup}>
								<label className={styles.label}>Street Address</label>
								<input
									type="text"
									name="address"
									value={formData.address}
									onChange={handleInputChange}
									disabled={!isEditing}
									className={styles.input}
									style={{
										backgroundColor: isEditing ? 'white' : 'var(--surface)',
										cursor: isEditing ? 'text' : 'not-allowed'
									}}
								/>
							</div>

							<div className={styles.formGrid}>
								<div className={styles.formGroup}>
									<label className={styles.label}>City</label>
									<input
										type="text"
										name="city"
										value={formData.city}
										onChange={handleInputChange}
										disabled={!isEditing}
										className={styles.input}
										style={{
											backgroundColor: isEditing ? 'white' : 'var(--surface)',
											cursor: isEditing ? 'text' : 'not-allowed'
										}}
									/>
								</div>

								<div className={styles.formGroup}>
									<label className={styles.label}>State</label>
									<input
										type="text"
										name="state"
										value={formData.state}
										onChange={handleInputChange}
										disabled={!isEditing}
										className={styles.input}
										style={{
											backgroundColor: isEditing ? 'white' : 'var(--surface)',
											cursor: isEditing ? 'text' : 'not-allowed'
										}}
									/>
								</div>

								<div className={styles.formGroup}>
									<label className={styles.label}>PIN Code</label>
									<input
										type="text"
										name="zipCode"
										value={formData.zipCode}
										onChange={handleInputChange}
										disabled={!isEditing}
										className={styles.input}
										style={{
											backgroundColor: isEditing ? 'white' : 'var(--surface)',
											cursor: isEditing ? 'text' : 'not-allowed'
										}}
									/>
								</div>
							</div>

							{/* Buyer Type Section */}
							<div className={styles.sectionDivider} />
							<h3 className={styles.sectionTitle}>Buyer Type</h3>

							<div className={styles.buyerTypeSection}>
								<p className={styles.buyerTypeNote}>
									Your current buyer type determines the pricing you receive. Changing this requires verification.
								</p>
								{hasOrders && (
									<p className={styles.buyerTypeWarning}>
										Buyer type cannot be changed after placing orders.
									</p>
								)}
								<div className={styles.radioGroup}>
									<label className={styles.radioLabel}>
										<input
											type="radio"
											name="buyerType"
											value="RETAIL"
											checked={formData.buyerType === 'RETAIL'}
											onChange={handleInputChange}
											disabled={!isEditing || hasOrders}
											className={styles.radioInput}
										/>
										<span>
											<strong>Retail</strong>
											<p className={styles.typeDescription}>Regular customer pricing</p>
										</span>
									</label>

									<label className={styles.radioLabel}>
										<input
											type="radio"
											name="buyerType"
											value="WHOLESALE"
											checked={formData.buyerType === 'WHOLESALE'}
											onChange={handleInputChange}
											disabled={!isEditing || hasOrders}
											className={styles.radioInput}
										/>
										<span>
											<strong>Wholesale</strong>
											<p className={styles.typeDescription}>Bulk pricing with discounts</p>
										</span>
									</label>
								</div>
							</div>

							{/* Form Actions */}
							{isEditing && (
								<div className={styles.formActions}>
									<button
										type="submit"
										disabled={isSaving}
										className={styles.saveButton}
										style={{
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
										className={styles.cancelButton}
									>
										✕ Cancel
									</button>
								</div>
							)}
						</form>
					</section>

					{/* Right: Additional Info & Actions */}
					<div className={styles.infoSection}>
						{/* Account Stats */}
						<section className="section" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
							<h2 className={styles.cardTitle}>Account Stats</h2>
							<div className={styles.stat}>
								<p className={styles.statLabel}>Member Since</p>
								<p className={styles.statValue}>
									{new Date(user?.createdAt || Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}
								</p>
							</div>
							<div className={styles.stat}>
								<p className={styles.statLabel}>Total Orders</p>
								<p className={styles.statValue}>4</p>
							</div>
							<div className={styles.stat}>
								<p className={styles.statLabel}>Account Status</p>
								<p className={styles.statValue} style={{ color: 'var(--success)' }}>✓ Active</p>
							</div>
						</section>

						{/* Quick Actions */}
						<section className="section" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
							<h2 className={styles.cardTitle}>Quick Actions</h2>
							<button className={styles.actionLink}>🛒 Continue Shopping</button>
							<button className={styles.actionLink}>📦 My Orders</button>
							<button className={styles.actionLink}>❤️ Wishlist</button>
							<button className={styles.actionLink}>🔔 Notifications</button>
						</section>

						{/* Account Security */}
						<section className="section" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
							<h2 className={styles.cardTitle}>Account Security</h2>
							<button className={styles.actionLink}>🔐 Change Password</button>
							<button className={styles.actionLink}>📱 Two-Factor Auth</button>
							<button className={styles.actionLink}>🔗 Linked Accounts</button>
						</section>

						{/* Preferences */}
						<section className="section" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
							<h2 className={styles.cardTitle}>Preferences</h2>
							<label className={styles.checkboxLabel}>
								<input type="checkbox" defaultChecked className={styles.checkbox} />
								<span>Email notifications</span>
							</label>
							<label className={styles.checkboxLabel}>
								<input type="checkbox" defaultChecked className={styles.checkbox} />
								<span>SMS updates</span>
							</label>
							<label className={styles.checkboxLabel}>
								<input type="checkbox" className={styles.checkbox} />
								<span>Marketing emails</span>
							</label>
						</section>

						{/* Danger Zone */}
						<section className="section" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
							<h2 className={styles.cardTitle} style={{ color: 'var(--error)' }}>Danger Zone</h2>
							<button className={styles.logoutButton} onClick={handleLogout}>
								🚪 Logout
							</button>
							<button className={styles.deleteButton}>
								🗑️ Delete Account
							</button>
							<p className={styles.warningText}>
								Deleting your account is permanent and cannot be undone.
							</p>
						</section>
					</div>
				</div>
			</div>
		</main>
	);
}

export default CustomerProfile;


