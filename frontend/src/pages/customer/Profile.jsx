import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';
import Avatar from '../../components/common/Avatar';
import CustomerAccountPageLayout from '../../components/common/CustomerAccountPageLayout';
import { useCurrency } from '../../context/CurrencyContext';
import { useNotification } from '../../context/NotificationContext';
import { useUser } from '../../context/UserContext';
import styles from './Profile.module.css';

const MENU_ITEMS = [
{ key: 'profile', label: 'My Profile' },
{ key: 'addresses', label: 'Address Book' },
{ key: 'preferences', label: 'Preferences' },
{ key: 'security', label: 'Security' },
{ key: 'billing', label: 'Billing' },
{ key: 'data', label: 'Data Export' }
];

const getInitialFormData = (user) => ({
fullName: user?.customer?.fullName || '',
phoneNumber: user?.customer?.contactNumber || '',
email: user?.email || '',
address: user?.customer?.deliveryAddress || '',
city: user?.customer?.city || '',
country: user?.customer?.country || '',
buyerType: user?.customer?.buyerType || 'RETAIL',
businessName: user?.customer?.businessName || '',
gstin: user?.customer?.gstin || '',
profileImage: user?.customer?.profileImage || ''
});

function CustomerProfile() {
const navigate = useNavigate();
const location = useLocation();
const { user, loading, refreshUser } = useUser();
const { currency, setCurrency, availableCurrencies } = useCurrency();
const { showError, showSuccess } = useNotification();

const [activePanel, setActivePanel] = useState('profile');
const [isEditingProfile, setIsEditingProfile] = useState(false);
const [isEditingAddress, setIsEditingAddress] = useState(false);
const [isSaving, setIsSaving] = useState(false);
const [previewImage, setPreviewImage] = useState('');
const [formData, setFormData] = useState(getInitialFormData(user));
const [preferences, setPreferences] = useState({
language: 'en',
emailNotifications: true,
smsNotifications: false,
marketingOptIn: false
});

useEffect(() => {
const panel = new URLSearchParams(location.search).get('panel');
if (panel && MENU_ITEMS.some((item) => item.key === panel)) {
setActivePanel(panel);
}
}, [location.search]);

useEffect(() => {
if (!user) return;
const next = getInitialFormData(user);
setFormData(next);
setPreviewImage(next.profileImage || '');
}, [user]);

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
const updates = {
fullName: formData.fullName,
contactNumber: formData.phoneNumber,
deliveryAddress: formData.address,
city: formData.city,
country: formData.country,
profileImage: formData.profileImage,
buyerType: formData.buyerType,
businessName: formData.businessName,
gstin: formData.gstin
};
await authService.updateProfile(updates);
await refreshUser();
setIsEditingProfile(false);
setIsEditingAddress(false);
showSuccess('Profile settings updated');
} catch (error) {
console.error('Save failed:', error);
showError(error?.message || 'Unable to save profile changes');
} finally {
setIsSaving(false);
}
};

const handleLogout = () => {
authService.logout();
navigate('/login');
};

	const handleLogoutAll = async () => {
		try {
			await authService.logoutAllSessions();
			showSuccess('Signed out from all devices');
			navigate('/login');
		} catch (error) {
			console.error('Logout all failed', error);
			showError(error?.message || 'Failed to sign out from all devices');
		}
	};

	const handleSavePreferences = async () => {
		try {
			await authService.updateProfile({
				preferredCurrency: currency
			});
			showSuccess('Preferences saved');
		} catch (error) {
			showError(error?.message || 'Failed to save preferences');
		}
	};

	const handleChangePassword = async () => {
		const currentPassword = window.prompt('Enter your current password');
		if (!currentPassword) return;

		const newPassword = window.prompt('Enter your new password');
		if (!newPassword) return;

		const confirmPassword = window.prompt('Confirm your new password');
		if (newPassword !== confirmPassword) {
			showError('New passwords do not match');
			return;
		}

		try {
			await authService.changePassword({ currentPassword, newPassword });
			showSuccess('Password updated successfully');
		} catch (error) {
			showError(error?.message || 'Failed to update password');
		}
	};

	const handleDownloadData = () => {
		try {
			const payload = {
				exportedAt: new Date().toISOString(),
				user,
				profileDraft: formData,
				preferences: {
					...preferences,
					preferredCurrency: currency
				}
			};

			const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = 'mediq-account-export.json';
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(url);
			showSuccess('Data export generated');
		} catch (error) {
			showError('Failed to generate data export');
		}
	};

const hiddenSidebarItems = useMemo(() => ['address-book', 'account-settings'], []);
const stats = useMemo(() => ({
memberSince: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
totalOrders: user?.customer?.orderCount || 0,
accountStatus: 'Active'
}), [user]);

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
<label className={styles.fieldLabel}>Buyer Type
<select className={styles.fieldInput} name="buyerType" value={formData.buyerType} onChange={handleInputChange} disabled={!isEditingProfile}>
<option value="RETAIL">Retail</option>
<option value="WHOLESALE">Wholesale</option>
</select>
</label>
{formData.buyerType === 'WHOLESALE' && (
<>
<label className={styles.fieldLabel}>Business Name
<input className={styles.fieldInput} name="businessName" value={formData.businessName} onChange={handleInputChange} disabled={!isEditingProfile} />
</label>
<label className={styles.fieldLabel}>GSTIN
<input className={styles.fieldInput} name="gstin" value={formData.gstin} onChange={handleInputChange} disabled={!isEditingProfile} />
</label>
</>
)}
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
						<button type="button" className={styles.primaryButton} onClick={handleSavePreferences}>Save Preferences</button>
</div>
</div>
)}

{activePanel === 'security' && (
<div className={styles.card}>
<div className={styles.cardHeader}><h2>Security</h2></div>
<div className={styles.actionGrid}>
							<button type="button" className={styles.ghostButton} onClick={handleChangePassword}>Change Password</button>
							<button type="button" className={styles.ghostButton} onClick={() => showSuccess('Two-factor setup will be available in the next release')}>Set Up Two-Factor Auth</button>
							<button type="button" className={styles.ghostButton} onClick={() => showSuccess('Session management will be available in the next release')}>View Active Sessions</button>
							<button type="button" className={styles.ghostButton} onClick={handleLogout}>Logout from This Device</button>
							<button type="button" className={styles.ghostButton} onClick={handleLogoutAll}>Sign Out From All Devices</button>
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
							<button type="button" className={styles.ghostButton} onClick={handleDownloadData}>Download My Data</button>
							<button type="button" className={styles.ghostButton} onClick={() => showError('Deactivate account endpoint is not available yet')}>Deactivate Account</button>
							<button type="button" className={styles.dangerButton} onClick={() => showError('Delete account endpoint is not available yet')}>Delete Account Permanently</button>
</div>
<p className={styles.helpText}>Member since {stats.memberSince} | Total orders {stats.totalOrders} | Status {stats.accountStatus}</p>
</div>
)}
</section>
</CustomerAccountPageLayout>
);
}

export default CustomerProfile;
