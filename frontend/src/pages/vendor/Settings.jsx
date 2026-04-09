import React, { useEffect, useState } from 'react';
import VendorPageShell from '../../components/layout/VendorPageShell';
import { useNotification } from '../../context/NotificationContext';
import authService from '../../services/auth.service';
import vendorService from '../../services/vendor.service';
import styles from './Settings.module.css';
import { Smartphone } from 'lucide-react';

const DEFAULT_PROFILE_SETTINGS = {
	businessName: '',
	email: '',
	phone: '',
	address: '',
	city: '',
	state: '',
	pincode: '',
	gstNumber: '',
	aboutBusiness: '',
	contactPersonName: ''
};

const DEFAULT_NOTIFICATION_PREFS = {
	newOrders: true,
	orderUpdates: true,
	messages: true,
	settlements: true,
	weeklyReports: false,
	marketingUpdates: false
};

const DEFAULT_SECURITY_PREFS = {
	twoFAEnabled: false
};

function VendorSettings() {
	const { showError, showSuccess } = useNotification();
	const [activeTab, setActiveTab] = useState('profile');
	const [settings, setSettings] = useState(DEFAULT_PROFILE_SETTINGS);
	const [tempSettings, setTempSettings] = useState(DEFAULT_PROFILE_SETTINGS);
	const [loadingProfile, setLoadingProfile] = useState(true);
	const [savingProfile, setSavingProfile] = useState(false);
	const [showTwoFA, setShowTwoFA] = useState(false);
	const [securityPrefs, setSecurityPrefs] = useState(DEFAULT_SECURITY_PREFS);
	const twoFAEnabled = securityPrefs.twoFAEnabled;
	const [changePassword, setChangePassword] = useState(false);
	const [notificationPrefs, setNotificationPrefs] = useState(DEFAULT_NOTIFICATION_PREFS);
	const [passwords, setPasswords] = useState({
		current: '',
		new: '',
		confirm: ''
	});

	useEffect(() => {
		const loadProfile = async () => {
			try {
				setLoadingProfile(true);
				const profile = await vendorService.getProfile();
				const normalizedProfile = {
					...DEFAULT_PROFILE_SETTINGS,
					...profile
				};

				setSettings(normalizedProfile);
				setTempSettings(normalizedProfile);
				setNotificationPrefs({
					...DEFAULT_NOTIFICATION_PREFS,
					...(profile.notificationPrefs || {})
				});
				setSecurityPrefs({
					...DEFAULT_SECURITY_PREFS,
					...(profile.securityPrefs || {})
				});
			} catch (error) {
				console.error('Failed to load vendor profile:', error);
				showError(error?.response?.data?.message || error?.message || 'Failed to load profile settings');
			} finally {
				setLoadingProfile(false);
			}
		};

		loadProfile();
	}, [showError]);

	useEffect(() => {
		const loadProfile = async () => {
			try {
				setLoadingProfile(true);
				const profile = await vendorService.getProfile();
				const normalizedProfile = {
					...DEFAULT_PROFILE_SETTINGS,
					...profile
				};

				setSettings(normalizedProfile);
				setTempSettings(normalizedProfile);
			} catch (error) {
				console.error('Failed to load vendor profile:', error);
				showError(error?.response?.data?.message || 'Failed to load profile settings');
			} finally {
				setLoadingProfile(false);
			}
		};

		loadProfile();
	}, [showError]);

	const handleSaveProfile = async () => {
		try {
			setSavingProfile(true);
			const updatedProfile = await vendorService.updateProfile({
				...tempSettings,
				notificationPrefs,
				securityPrefs
			});
			const normalizedProfile = {
				...DEFAULT_PROFILE_SETTINGS,
				...updatedProfile
			};

			setSettings(normalizedProfile);
			setTempSettings(normalizedProfile);
			setNotificationPrefs({
				...DEFAULT_NOTIFICATION_PREFS,
				...(updatedProfile.notificationPrefs || notificationPrefs)
			});
			setSecurityPrefs({
				...DEFAULT_SECURITY_PREFS,
				...(updatedProfile.securityPrefs || securityPrefs)
			});
			showSuccess('Profile updated successfully');
		} catch (error) {
			console.error('Failed to update vendor profile:', error);
			showError(error?.response?.data?.message || error?.message || 'Failed to update profile settings');
		} finally {
			setSavingProfile(false);
		}
	};

	const handlePasswordChange = async () => {
		if (passwords.new !== passwords.confirm) {
			showError('Passwords do not match');
			return;
		}

		try {
			await authService.changePassword({
				currentPassword: passwords.current,
				newPassword: passwords.new
			});
			showSuccess('Password changed successfully!');
			setChangePassword(false);
			setPasswords({ current: '', new: '', confirm: '' });
		} catch (error) {
			showError(error?.message || 'Failed to change password');
		}
	};

	const handleEnable2FA = async () => {
		try {
			const nextSecurityPrefs = {
				...securityPrefs,
				twoFAEnabled: true
			};
			const updatedProfile = await vendorService.updateProfile({
				securityPrefs: nextSecurityPrefs
			});
			setSecurityPrefs({
				...DEFAULT_SECURITY_PREFS,
				...(updatedProfile.securityPrefs || nextSecurityPrefs)
			});
			setShowTwoFA(false);
			showSuccess('2FA enabled successfully! Download your backup codes.');
		} catch (error) {
			showError(error?.response?.data?.message || error?.message || 'Failed to enable 2FA');
		}
	};

	const updateNotificationPref = async (key, value) => {
		const nextPrefs = {
			...notificationPrefs,
			[key]: value
		};

		try {
			const updatedProfile = await vendorService.updateProfile({
				notificationPrefs: nextPrefs
			});
			setNotificationPrefs({
				...DEFAULT_NOTIFICATION_PREFS,
				...(updatedProfile.notificationPrefs || nextPrefs)
			});
			showSuccess('Notification preferences updated');
		} catch (error) {
			showError(error?.response?.data?.message || error?.message || 'Failed to update notification preferences');
		}
	};

	function Toggle({ enabled, onChange }) {
		return (
			<div
				className={`${styles.toggle} ${enabled ? styles.toggleActive : ''}`}
				onClick={() => onChange(!enabled)}
			>
				<div
					className={`${styles.toggleSlider} ${enabled ? styles.toggleSliderActive : ''}`}
				/>
			</div>
		);
	}

	return (
		<div className={styles.container}>
			<VendorPageShell
				title="Settings"
				subtitle="Manage your account, security, and preferences"
			>

			{/* Tabs */}
			<div className={styles.tabs}>
				{['profile', 'security', 'notifications'].map(tab => (
					<button
						key={tab}
						className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
						onClick={() => setActiveTab(tab)}
					>
						{tab.charAt(0).toUpperCase() + tab.slice(1)}
					</button>
				))}
			</div>

			{/* Profile Tab */}
			{activeTab === 'profile' && (
				<>
					{loadingProfile && <p className={styles.loadingText}>Loading profile settings...</p>}

					<div className={styles.section}>
						<h2 className={styles.sectionTitle}>Business Information</h2>
						<div className={styles.formGrid}>
							<div className={styles.formGroup}>
								<label className={styles.label}>Business Name</label>
								<input
									type="text"
									className={styles.input}
									value={tempSettings.businessName}
									onChange={(e) => setTempSettings({ ...tempSettings, businessName: e.target.value })}
									disabled={loadingProfile || savingProfile}
								/>
							</div>
							<div className={styles.formGroup}>
								<label className={styles.label}>Email</label>
								<input
									type="email"
									className={styles.input}
									value={tempSettings.email}
									onChange={(e) => setTempSettings({ ...tempSettings, email: e.target.value })}
									disabled={loadingProfile || savingProfile}
								/>
							</div>
							<div className={styles.formGroup}>
								<label className={styles.label}>Contact Person Name</label>
								<input
									type="text"
									className={styles.input}
									value={tempSettings.contactPersonName}
									onChange={(e) => setTempSettings({ ...tempSettings, contactPersonName: e.target.value })}
									disabled={loadingProfile || savingProfile}
								/>
							</div>
							<div className={styles.formGroup}>
								<label className={styles.label}>Phone Number</label>
								<input
									type="tel"
									className={styles.input}
									value={tempSettings.phone}
									onChange={(e) => setTempSettings({ ...tempSettings, phone: e.target.value })}
									disabled={loadingProfile || savingProfile}
								/>
							</div>
							<div className={styles.formGroup}>
								<label className={styles.label}>GST Number</label>
								<input
									type="text"
									className={styles.input}
									value={tempSettings.gstNumber}
									onChange={(e) => setTempSettings({ ...tempSettings, gstNumber: e.target.value })}
									disabled={loadingProfile || savingProfile}
								/>
							</div>
						</div>
					</div>

					<div className={styles.section}>
						<h2 className={styles.sectionTitle}>Address</h2>
						<div className={styles.formGridFull}>
							<div className={styles.formGroup}>
								<label className={styles.label}>Address</label>
								<input
									type="text"
									className={styles.input}
									value={tempSettings.address}
									onChange={(e) => setTempSettings({ ...tempSettings, address: e.target.value })}
									disabled={loadingProfile || savingProfile}
								/>
							</div>
							<div className={styles.formGrid}>
								<div className={styles.formGroup}>
									<label className={styles.label}>City</label>
									<input
										type="text"
										className={styles.input}
										value={tempSettings.city}
										onChange={(e) => setTempSettings({ ...tempSettings, city: e.target.value })}
										disabled={loadingProfile || savingProfile}
									/>
								</div>
								<div className={styles.formGroup}>
									<label className={styles.label}>State</label>
									<input
										type="text"
										className={styles.input}
										value={tempSettings.state}
										onChange={(e) => setTempSettings({ ...tempSettings, state: e.target.value })}
										disabled={loadingProfile || savingProfile}
									/>
								</div>
								<div className={styles.formGroup}>
									<label className={styles.label}>Pincode</label>
									<input
										type="text"
										className={styles.input}
										value={tempSettings.pincode}
										onChange={(e) => setTempSettings({ ...tempSettings, pincode: e.target.value })}
										disabled={loadingProfile || savingProfile}
									/>
								</div>
							</div>
						</div>
					</div>

					<div className={styles.section}>
						<h2 className={styles.sectionTitle}>About Your Business</h2>
						<div className={styles.formGroup}>
							<label className={styles.label}>Business Description</label>
							<textarea
								className={styles.textarea}
								value={tempSettings.aboutBusiness}
								onChange={(e) => setTempSettings({ ...tempSettings, aboutBusiness: e.target.value })}
								placeholder="Tell customers about your business..."
								disabled={loadingProfile || savingProfile}
							/>
						</div>
					</div>

					<div className={styles.buttonGroup}>
						<button
							className={`${styles.button} ${styles.secondaryButton}`}
							onClick={() => setTempSettings(settings)}
							disabled={loadingProfile || savingProfile}
						>
							Cancel
						</button>
						<button
							className={`${styles.button} ${styles.primaryButton}`}
							onClick={handleSaveProfile}
							disabled={loadingProfile || savingProfile}
						>
							{savingProfile ? 'Saving...' : 'Save Changes'}
						</button>
					</div>
				</>
			)}

			{/* Security Tab */}
			{activeTab === 'security' && (
				<>
					<div className={styles.section}>
						<h2 className={styles.sectionTitle}>Password</h2>
						{!changePassword ? (
							<button
								className={`${styles.button} ${styles.primaryButton}`}
								onClick={() => setChangePassword(true)}
							>
								Change Password
							</button>
						) : (
							<div className={styles.formGridFull}>
								<div className={styles.formGroup}>
									<label className={styles.label}>Current Password</label>
									<input
										type="password"
										className={styles.input}
										placeholder="Enter current password"
										value={passwords.current}
										onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
									/>
								</div>
								<div className={styles.formGroup}>
									<label className={styles.label}>New Password</label>
									<input
										type="password"
										className={styles.input}
										placeholder="Enter new password"
										value={passwords.new}
										onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
									/>
								</div>
								<div className={styles.formGroup}>
									<label className={styles.label}>Confirm Password</label>
									<input
										type="password"
										className={styles.input}
										placeholder="Confirm new password"
										value={passwords.confirm}
										onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
									/>
								</div>
								<div className={styles.buttonGroup}>
									<button
										className={`${styles.button} ${styles.secondaryButton}`}
										onClick={() => setChangePassword(false)}
									>
										Cancel
									</button>
									<button
										className={`${styles.button} ${styles.primaryButton}`}
										onClick={handlePasswordChange}
									>
										Update Password
									</button>
								</div>
							</div>
						)}
					</div>

					<div className={styles.section}>
						<h2 className={styles.sectionTitle}>Two-Factor Authentication</h2>
						<div className={styles.securityItem}>
							<div>
								<div className={styles.settingTitle}>Two-Factor Authentication (2FA)</div>
								<div className={styles.settingDescription}>
									Add an extra layer of security to your account. You'll need to enter a code from your phone in addition to your password when logging in.
								</div>
							</div>
							<div>
								<Toggle
									enabled={twoFAEnabled}
									onChange={async (enabled) => {
										if (enabled) {
											setShowTwoFA(true);
										} else {
											try {
										const updatedProfile = await vendorService.updateProfile({
											securityPrefs: {
												...securityPrefs,
												twoFAEnabled: false
											}
										});
										setSecurityPrefs({
											...DEFAULT_SECURITY_PREFS,
											...(updatedProfile.securityPrefs || { ...securityPrefs, twoFAEnabled: false })
										});
									} catch (error) {
										showError(error?.response?.data?.message || error?.message || 'Failed to update 2FA setting');
									}
										}
									}}
								/>
							</div>
						</div>

						{showTwoFA && !twoFAEnabled && (
							<div style={{
								backgroundColor: 'var(--primary-light)',
								border: '1px solid var(--primary)',
								borderRadius: 'var(--radius)',
								padding: '1.5rem',
								marginTop: '1rem'
							}}>
								<h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Enable 2FA</h3>
								<p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
									Scan this QR code with Google Authenticator or similar app:
								</p>
								<div style={{
									width: '150px',
									height: '150px',
									backgroundColor: 'white',
									border: '1px solid var(--border)',
									borderRadius: 'var(--radius)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontSize: '2rem',
									marginBottom: '1rem'
								}}>
								<Smartphone size={48} strokeWidth={1} />
								</div>
								<p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
									Manual entry code: 123456789012345678
								</p>
								<button
									className={`${styles.button} ${styles.primaryButton}`}
									onClick={handleEnable2FA}
								>
									Confirm & Enable 2FA
								</button>
							</div>
						)}
					</div>

					<div className={styles.section}>
						<h2 className={styles.sectionTitle}>Active Sessions</h2>
						<div className={styles.securityItem}>
							<div>
								<div className={styles.settingTitle}>Current Device</div>
								<div className={styles.settingDescription}>
									Chrome on Windows • Last active: Just now
								</div>
							</div>
							<button className={`${styles.button} ${styles.secondaryButton}`} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
								Sign Out
							</button>
						</div>
						<div className={styles.securityItem}>
							<div>
								<div className={styles.settingTitle}>Mobile Device</div>
								<div className={styles.settingDescription}>
									Mobile Safari on iPhone • Last active: 2 hours ago
								</div>
							</div>
							<button className={`${styles.button} ${styles.secondaryButton}`} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
								Sign Out
							</button>
						</div>
					</div>
				</>
			)}

			{/* Notifications Tab */}
			{activeTab === 'notifications' && (
				<div className={styles.section}>
					<h2 className={styles.sectionTitle}>Notification Preferences</h2>

					<div className={styles.notificationItem}>
						<div>
							<div className={styles.settingTitle}>New Orders</div>
							<div className={styles.settingDescription}>Get notified when you receive a new order</div>
						</div>
						<Toggle enabled={notificationPrefs.newOrders} onChange={(value) => updateNotificationPref('newOrders', value)} />
					</div>

					<div className={styles.notificationItem}>
						<div>
							<div className={styles.settingTitle}>Order Updates</div>
							<div className={styles.settingDescription}>Updates on order status and shipping</div>
						</div>
						<Toggle enabled={notificationPrefs.orderUpdates} onChange={(value) => updateNotificationPref('orderUpdates', value)} />
					</div>

					<div className={styles.notificationItem}>
						<div>
							<div className={styles.settingTitle}>Messages</div>
							<div className={styles.settingDescription}>When customers send you messages</div>
						</div>
						<Toggle enabled={notificationPrefs.messages} onChange={(value) => updateNotificationPref('messages', value)} />
					</div>

					<div className={styles.notificationItem}>
						<div>
							<div className={styles.settingTitle}>Settlements</div>
							<div className={styles.settingDescription}>Payment and settlement reminders</div>
						</div>
						<Toggle enabled={notificationPrefs.settlements} onChange={(value) => updateNotificationPref('settlements', value)} />
					</div>

					<div className={styles.notificationItem}>
						<div>
							<div className={styles.settingTitle}>Weekly Reports</div>
							<div className={styles.settingDescription}>Weekly summary of your sales and analytics</div>
						</div>
						<Toggle enabled={notificationPrefs.weeklyReports} onChange={(value) => updateNotificationPref('weeklyReports', value)} />
					</div>

					<div className={styles.notificationItem}>
						<div>
							<div className={styles.settingTitle}>Marketing Updates</div>
							<div className={styles.settingDescription}>Updates about new features and promotional opportunities</div>
						</div>
						<Toggle enabled={notificationPrefs.marketingUpdates} onChange={(value) => updateNotificationPref('marketingUpdates', value)} />
					</div>
				</div>
			)}
			</VendorPageShell>
		</div>
	);
}

export default VendorSettings;
