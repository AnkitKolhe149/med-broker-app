import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';
import Avatar from '../../components/common/Avatar';
import CustomerAccountPageLayout from '../../components/common/CustomerAccountPageLayout';
import { useCurrency } from '../../context/CurrencyContext';
import { useNotification } from '../../context/NotificationContext';
import styles from './Profile.module.css';

const MENU_ITEMS = [
	{ key: 'profile', label: 'My Profile' },
	{ key: 'addresses', label: 'Address Book' },
	{ key: 'preferences', label: 'Preferences' },
	{ key: 'security', label: 'Security' },
	{ key: 'billing', label: 'Billing' },
	{ key: 'data', label: 'Data Export' }
];

function CustomerProfile() {
	const navigate = useNavigate();
	const location = useLocation();
	const { currency, setCurrency, availableCurrencies } = useCurrency();
	const { showSuccess, showError } = useNotification();
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [activePanel, setActivePanel] = useState('profile');
	const [isEditingProfile, setIsEditingProfile] = useState(false);
	const [isEditingAddress, setIsEditingAddress] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [previewImage, setPreviewImage] = useState(null);

	const [formData, setFormData] = useState({
		fullName: '',
		phoneNumber: '',
		email: '',
		bio: '',
		address: '',
		city: '',
		state: '',
		zipCode: '',
		country: 'India',
		buyerType: 'RETAIL',
		profileImage: null
	});

	const [preferences, setPreferences] = useState({
		language: 'en',
		emailNotifications: true,
		smsNotifications: true,
		marketingOptIn: false
	});

	useEffect(() => {
		loadUserData();
	}, []);

	useEffect(() => {
		const section = new URLSearchParams(location.search).get('section');
		if (['profile', 'addresses', 'preferences', 'security', 'billing', 'data'].includes(section)) {
			setActivePanel(section);
		}
	}, [location.search]);

	const stats = useMemo(() => ({
		memberSince: new Date(user?.createdAt || Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }),
		totalOrders: Number(user?.customer?.totalOrders || 0),
		accountStatus: 'Active'
	}), [user]);

	const loadUserData = async () => {
		try {
			const userData = await authService.getCurrentUser();
			setUser(userData);
			if (userData?.customer) {
				setFormData({
					fullName: userData.customer.fullName || '',
					phoneNumber: userData.customer.phoneNumber || '',
					email: userData.email || '',
					bio: userData.customer.bio || userData.customer.buyerType || 'Customer',
					address: userData.customer.address || '',
					city: userData.customer.city || '',
					state: userData.customer.state || '',
					zipCode: userData.customer.zipCode || '',
					country: userData.customer.country || 'India',
					buyerType: userData.customer.buyerType || 'RETAIL',
					profileImage: userData.customer.profileImage || null
				});
				setPreviewImage(userData.customer.profileImage || null);
			}
		} catch (error) {
			console.error('Failed to load user data:', error);
			showError('Failed to load profile data');
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (event) => {
		const { name, value } = event.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handlePreferenceChange = (event) => {
		const { name, type, checked, value } = event.target;
		setPreferences((prev) => ({
			...prev,
			[name]: type === 'checkbox' ? checked : value
		}));
	};

	const handleImageChange = (event) => {
		const file = event.target.files?.[0];
		if (!file) return;

		if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
			showError('Please upload JPG, PNG, or WebP image');
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			showError('Image size must be below 5MB');
			return;
		}

		const reader = new FileReader();
		reader.onloadend = () => {
			setPreviewImage(reader.result);
			setFormData((prev) => ({ ...prev, profileImage: reader.result }));
		};
		reader.readAsDataURL(file);
	};

	const handleSave = async () => {
		if (!formData.fullName.trim()) {
			showError('Full name is required');
			return;
		}

		if (!formData.phoneNumber.trim() || formData.phoneNumber.length < 10) {
			showError('Enter a valid phone number');
			return;
		}

		setIsSaving(true);
		try {
			await new Promise((resolve) => setTimeout(resolve, 800));
			setUser((prev) => ({
				...prev,
				customer: {
					...prev.customer,
					...formData
				}
			}));
			setIsEditingProfile(false);
			setIsEditingAddress(false);
			showSuccess('Profile settings updated');
		} catch (error) {
			console.error('Save failed:', error);
			showError('Unable to save profile changes');
		} finally {
			setIsSaving(false);
		}
	};

	const handleLogout = () => {
		authService.logout();
		navigate('/login');
	};

	const hiddenSidebarItems = useMemo(() => ['address-book', 'account-settings'], []);

	if (loading) {
		return (
			<div className={styles.loaderWrap}>
				<p>Loading account settings...</p>
			</div>
		);
	}

	return (
		<CustomerAccountPageLayout
			user={user}
			hiddenItemKeys={hiddenSidebarItems}
			title="Account Settings"
			subtitle="Manage profile, security, addresses, and account preferences."
		>
			<section className={styles.panelArea}>
				<div className={styles.panelTabs}>
					{MENU_ITEMS.map((item) => (
						<button
							key={item.key}
							type="button"
							onClick={() => setActivePanel(item.key)}
							className={`${styles.panelTab} ${activePanel === item.key ? styles.panelTabActive : ''}`}
						>
							{item.label}
						</button>
					))}
				</div>

				{activePanel === 'profile' && (
					<>
						<div className={styles.card}>
							<div className={styles.cardHeader}>
								<h2>My Profile</h2>
								<button type="button" className={styles.cardEditButton} onClick={() => setIsEditingProfile((prev) => !prev)}>
									{isEditingProfile ? 'Done' : 'Edit'}
								</button>
							</div>
							<div className={styles.profileTopRow}>
								<div className={styles.avatarWrap}>
									<Avatar src={previewImage} name={formData.fullName || 'Customer'} size={72} />
									{isEditingProfile && (
										<label className={styles.uploadImageButton}>
											Upload
											<input type="file" accept="image/*" onChange={handleImageChange} />
										</label>
									)}
								</div>
								<div>
									<p className={styles.personName}>{formData.fullName || 'Customer'}</p>
									<p className={styles.personRole}>{formData.buyerType === 'WHOLESALE' ? 'Wholesale Buyer' : 'Retail Buyer'}</p>
									<p className={styles.personLocation}>{formData.city || 'City not set'}, {formData.country || 'Country not set'}</p>
								</div>
							</div>

										<div className={styles.gridTwo}>
											<label className={styles.fieldLabel}>Full Name
												<input className={styles.fieldInput} name="fullName" value={formData.fullName} onChange={handleInputChange} disabled={!isEditingProfile} />
											</label>
											<label className={styles.fieldLabel}>Phone
												<input className={styles.fieldInput} name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} disabled={!isEditingProfile} />
											</label>
											<label className={styles.fieldLabel}>Email
												<input className={styles.fieldInput} name="email" value={formData.email} disabled />
											</label>
											<label className={styles.fieldLabel}>Bio
												<input className={styles.fieldInput} name="bio" value={formData.bio} onChange={handleInputChange} disabled={!isEditingProfile} />
											</label>
										</div>
									</div>

									<div className={styles.card}>
										<div className={styles.cardHeader}>
											<h3>Identity & Compliance</h3>
										</div>
										<div className={styles.gridTwo}>
											<div className={styles.metaItem}><span>Buyer Type</span><strong>{formData.buyerType}</strong></div>
											<div className={styles.metaItem}><span>KYC Status</span><strong>Verified</strong></div>
											<div className={styles.metaItem}><span>Prescription Consent</span><strong>Enabled</strong></div>
											<div className={styles.metaItem}><span>Account Status</span><strong>Active</strong></div>
										</div>
									</div>

									<div className={styles.cardActionsRow}>
										<button type="button" className={styles.ghostButton} onClick={() => navigate('/customer/dashboard')}>Go to Dashboard</button>
										<button type="button" className={styles.ghostButton} onClick={() => navigate('/customer/orders')}>View Orders</button>
										<button type="button" className={styles.primaryButton} onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</button>
									</div>
								</>
							)}

							{activePanel === 'addresses' && (
								<div className={styles.card}>
									<div className={styles.cardHeader}>
										<h2>Address Book</h2>
										<button type="button" className={styles.cardEditButton} onClick={() => setIsEditingAddress((prev) => !prev)}>
											{isEditingAddress ? 'Done' : 'Edit'}
										</button>
									</div>
									<div className={styles.gridTwo}>
										<label className={styles.fieldLabel}>Street Address
											<input className={styles.fieldInput} name="address" value={formData.address} onChange={handleInputChange} disabled={!isEditingAddress} />
										</label>
										<label className={styles.fieldLabel}>City
											<input className={styles.fieldInput} name="city" value={formData.city} onChange={handleInputChange} disabled={!isEditingAddress} />
										</label>
										<label className={styles.fieldLabel}>State
											<input className={styles.fieldInput} name="state" value={formData.state} onChange={handleInputChange} disabled={!isEditingAddress} />
										</label>
										<label className={styles.fieldLabel}>ZIP Code
											<input className={styles.fieldInput} name="zipCode" value={formData.zipCode} onChange={handleInputChange} disabled={!isEditingAddress} />
										</label>
										<label className={styles.fieldLabel}>Country
											<input className={styles.fieldInput} name="country" value={formData.country} onChange={handleInputChange} disabled={!isEditingAddress} />
										</label>
									</div>
									<div className={styles.cardActionsRow}>
										<button type="button" className={styles.primaryButton} onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Address'}</button>
									</div>
								</div>
							)}

							{activePanel === 'preferences' && (
								<div className={styles.card}>
									<div className={styles.cardHeader}><h2>Preferences</h2></div>
									<div className={styles.gridTwo}>
										<label className={styles.fieldLabel}>Language
											<select className={styles.fieldInput} name="language" value={preferences.language} onChange={handlePreferenceChange}>
												<option value="en">English</option>
												<option value="hi">Hindi</option>
											</select>
										</label>
										<label className={styles.fieldLabel}>Currency
											<select className={styles.fieldInput} value={currency} onChange={(e) => setCurrency(e.target.value)}>
												{Object.keys(availableCurrencies || {}).map((code) => (
													<option key={code} value={code}>{code}</option>
												))}
											</select>
										</label>
									</div>
									<div className={styles.checkboxList}>
										<label><input type="checkbox" name="emailNotifications" checked={preferences.emailNotifications} onChange={handlePreferenceChange} /> Email notifications</label>
										<label><input type="checkbox" name="smsNotifications" checked={preferences.smsNotifications} onChange={handlePreferenceChange} /> SMS updates</label>
										<label><input type="checkbox" name="marketingOptIn" checked={preferences.marketingOptIn} onChange={handlePreferenceChange} /> Marketing and offers</label>
									</div>
									<div className={styles.cardActionsRow}>
										<button type="button" className={styles.primaryButton} onClick={() => showSuccess('Preferences saved')}>Save Preferences</button>
									</div>
								</div>
							)}

							{activePanel === 'security' && (
								<div className={styles.card}>
									<div className={styles.cardHeader}><h2>Security</h2></div>
									<div className={styles.actionGrid}>
										<button type="button" className={styles.ghostButton}>Change Password</button>
										<button type="button" className={styles.ghostButton}>Set Up Two-Factor Auth</button>
										<button type="button" className={styles.ghostButton}>View Active Sessions</button>
										<button type="button" className={styles.ghostButton} onClick={handleLogout}>Logout from This Device</button>
									</div>
								</div>
							)}

							{activePanel === 'billing' && (
								<div className={styles.card}>
									<div className={styles.cardHeader}><h2>Billing</h2></div>
									<div className={styles.metaItem}><span>Saved Payment Methods</span><strong>0 methods</strong></div>
									<div className={styles.metaItem}><span>Billing Email</span><strong>{formData.email || '-'}</strong></div>
									<div className={styles.metaItem}><span>Default Method</span><strong>Not set</strong></div>
									<p className={styles.helpText}>Add payment method during checkout. Card data is tokenized and never stored raw.</p>
								</div>
							)}

							{activePanel === 'data' && (
								<div className={styles.card}>
									<div className={styles.cardHeader}><h2>Data & Account Actions</h2></div>
									<div className={styles.actionGrid}>
										<button type="button" className={styles.ghostButton}>Download My Data</button>
										<button type="button" className={styles.ghostButton}>Deactivate Account</button>
										<button type="button" className={styles.dangerButton}>Delete Account Permanently</button>
									</div>
									<p className={styles.helpText}>Member since {stats.memberSince} • Total orders {stats.totalOrders} • Status {stats.accountStatus}</p>
								</div>
							)}
			</section>
		</CustomerAccountPageLayout>
	);
}

export default CustomerProfile;


