import React, { useState } from 'react';
import VendorPageShell from '../../components/layout/VendorPageShell';
import styles from './Settings.module.css';

function VendorSettings() {
	const [activeTab, setActiveTab] = useState('profile');
	const [settings, setSettings] = useState({
		businessName: 'ABC Pharmacy Ltd',
		email: 'contact@abcpharmacy.com',
		phone: '+91-9876543210',
		address: '123 Medical Street, Health City, State 560001',
		city: 'Bangalore',
		state: 'Karnataka',
		pincode: '560001',
		gstNumber: '18AABCU1234A1Z0',
		aboutBusiness: 'Leading pharmacy chain providing quality medicines and healthcare products'
	});

	const [tempSettings, setTempSettings] = useState(settings);
	const [showTwoFA, setShowTwoFA] = useState(false);
	const [twoFAEnabled, setTwoFAEnabled] = useState(false);
	const [changePassword, setChangePassword] = useState(false);
	const [passwords, setPasswords] = useState({
		current: '',
		new: '',
		confirm: ''
	});

	const handleSaveProfile = () => {
		setSettings(tempSettings);
		alert('Profile updated successfully!');
	};

	const handlePasswordChange = () => {
		if (passwords.new !== passwords.confirm) {
			alert('Passwords do not match!');
			return;
		}
		alert('Password changed successfully!');
		setChangePassword(false);
		setPasswords({ current: '', new: '', confirm: '' });
	};

	const handleEnable2FA = () => {
		setTwoFAEnabled(true);
		alert('2FA enabled successfully! Download your backup codes.');
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
								/>
							</div>
							<div className={styles.formGroup}>
								<label className={styles.label}>Email</label>
								<input
									type="email"
									className={styles.input}
									value={tempSettings.email}
									onChange={(e) => setTempSettings({ ...tempSettings, email: e.target.value })}
								/>
							</div>
							<div className={styles.formGroup}>
								<label className={styles.label}>Phone Number</label>
								<input
									type="tel"
									className={styles.input}
									value={tempSettings.phone}
									onChange={(e) => setTempSettings({ ...tempSettings, phone: e.target.value })}
								/>
							</div>
							<div className={styles.formGroup}>
								<label className={styles.label}>GST Number</label>
								<input
									type="text"
									className={styles.input}
									value={tempSettings.gstNumber}
									onChange={(e) => setTempSettings({ ...tempSettings, gstNumber: e.target.value })}
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
									/>
								</div>
								<div className={styles.formGroup}>
									<label className={styles.label}>State</label>
									<input
										type="text"
										className={styles.input}
										value={tempSettings.state}
										onChange={(e) => setTempSettings({ ...tempSettings, state: e.target.value })}
									/>
								</div>
								<div className={styles.formGroup}>
									<label className={styles.label}>Pincode</label>
									<input
										type="text"
										className={styles.input}
										value={tempSettings.pincode}
										onChange={(e) => setTempSettings({ ...tempSettings, pincode: e.target.value })}
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
							/>
						</div>
					</div>

					<div className={styles.buttonGroup}>
						<button className={`${styles.button} ${styles.secondaryButton}`}>
							Cancel
						</button>
						<button className={`${styles.button} ${styles.primaryButton}`} onClick={handleSaveProfile}>
							Save Changes
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
									onChange={(enabled) => {
										if (enabled) {
											setShowTwoFA(true);
										} else {
											setTwoFAEnabled(false);
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
									📱
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
						<Toggle enabled={true} onChange={() => {}} />
					</div>

					<div className={styles.notificationItem}>
						<div>
							<div className={styles.settingTitle}>Order Updates</div>
							<div className={styles.settingDescription}>Updates on order status and shipping</div>
						</div>
						<Toggle enabled={true} onChange={() => {}} />
					</div>

					<div className={styles.notificationItem}>
						<div>
							<div className={styles.settingTitle}>Messages</div>
							<div className={styles.settingDescription}>When customers send you messages</div>
						</div>
						<Toggle enabled={true} onChange={() => {}} />
					</div>

					<div className={styles.notificationItem}>
						<div>
							<div className={styles.settingTitle}>Settlements</div>
							<div className={styles.settingDescription}>Payment and settlement reminders</div>
						</div>
						<Toggle enabled={true} onChange={() => {}} />
					</div>

					<div className={styles.notificationItem}>
						<div>
							<div className={styles.settingTitle}>Weekly Reports</div>
							<div className={styles.settingDescription}>Weekly summary of your sales and analytics</div>
						</div>
						<Toggle enabled={false} onChange={() => {}} />
					</div>

					<div className={styles.notificationItem}>
						<div>
							<div className={styles.settingTitle}>Marketing Updates</div>
							<div className={styles.settingDescription}>Updates about new features and promotional opportunities</div>
						</div>
						<Toggle enabled={false} onChange={() => {}} />
					</div>
				</div>
			)}
			</VendorPageShell>
		</div>
	);
}

export default VendorSettings;
