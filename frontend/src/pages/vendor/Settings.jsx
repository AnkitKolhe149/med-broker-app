import React, { useState } from 'react';

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

	const styles = {
		container: {
			padding: '2rem',
			backgroundColor: 'var(--surface)',
			minHeight: '100vh'
		},
		header: {
			marginBottom: '2rem'
		},
		title: {
			fontSize: '2rem',
			fontWeight: '700',
			color: 'var(--text-primary)',
			margin: 0,
			marginBottom: '0.5rem'
		},
		subtitle: {
			fontSize: '0.95rem',
			color: 'var(--text-secondary)',
			margin: 0
		},
		tabs: {
			display: 'flex',
			gap: '1rem',
			borderBottom: '2px solid var(--border)',
			marginBottom: '2rem',
			backgroundColor: 'white',
			padding: '0 1.5rem',
			borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0'
		},
		tab: {
			padding: '1rem 0.8rem',
			backgroundColor: 'transparent',
			border: 'none',
			cursor: 'pointer',
			fontWeight: '500',
			color: 'var(--text-secondary)',
			borderBottom: '3px solid transparent',
			transition: 'all 0.2s'
		},
		tabActive: {
			padding: '1rem 0.8rem',
			backgroundColor: 'transparent',
			border: 'none',
			cursor: 'pointer',
			fontWeight: '600',
			color: 'var(--primary)',
			borderBottom: '3px solid var(--primary)',
			transition: 'all 0.2s'
		},
		section: {
			backgroundColor: 'white',
			borderRadius: 'var(--radius-lg)',
			padding: '1.5rem',
			border: '1px solid var(--border)',
			boxShadow: 'var(--shadow-sm)',
			marginBottom: '2rem'
		},
		sectionTitle: {
			fontSize: '1.1rem',
			fontWeight: '700',
			color: 'var(--text-primary)',
			marginBottom: '1.5rem',
			paddingBottom: '1rem',
			borderBottom: '1px solid var(--border)'
		},
		formGrid: {
			display: 'grid',
			gridTemplateColumns: '1fr 1fr',
			gap: '1.5rem'
		},
		formGridFull: {
			display: 'grid',
			gridTemplateColumns: '1fr',
			gap: '1.5rem'
		},
		formGroup: {
			display: 'flex',
			flexDirection: 'column'
		},
		label: {
			fontSize: '0.85rem',
			fontWeight: '600',
			color: 'var(--text-primary)',
			marginBottom: '0.5rem',
			textTransform: 'uppercase'
		},
		input: {
			padding: '0.8rem',
			border: '1px solid var(--border)',
			borderRadius: 'var(--radius)',
			fontSize: '0.95rem',
			fontFamily: 'inherit',
			backgroundColor: 'var(--surface)',
			color: 'var(--text-primary)'
		},
		textarea: {
			padding: '0.8rem',
			border: '1px solid var(--border)',
			borderRadius: 'var(--radius)',
			fontSize: '0.95rem',
			fontFamily: 'inherit',
			backgroundColor: 'var(--surface)',
			color: 'var(--text-primary)',
			minHeight: '100px',
			resize: 'vertical'
		},
		select: {
			padding: '0.8rem',
			border: '1px solid var(--border)',
			borderRadius: 'var(--radius)',
			fontSize: '0.95rem',
			fontFamily: 'inherit',
			backgroundColor: 'white',
			color: 'var(--text-primary)',
			cursor: 'pointer'
		},
		buttonGroup: {
			display: 'flex',
			gap: '1rem',
			marginTop: '2rem'
		},
		button: {
			padding: '0.8rem 1.5rem',
			border: 'none',
			borderRadius: 'var(--radius)',
			cursor: 'pointer',
			fontWeight: '600',
			transition: 'all 0.2s',
			fontSize: '0.95rem'
		},
		primaryButton: {
			backgroundColor: 'var(--primary)',
			color: 'white'
		},
		secondaryButton: {
			backgroundColor: 'white',
			border: '1px solid var(--border)',
			color: 'var(--text-primary)'
		},
		settingItem: {
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
			padding: '1.5rem',
			borderBottom: '1px solid var(--border)',
			backgroundColor: 'var(--surface)',
			borderRadius: 'var(--radius)',
			marginBottom: '1rem'
		},
		settingTitle: {
			fontWeight: '600',
			color: 'var(--text-primary)',
			marginBottom: '0.3rem'
		},
		settingDescription: {
			fontSize: '0.85rem',
			color: 'var(--text-secondary)'
		},
		toggle: {
			width: '50px',
			height: '26px',
			backgroundColor: 'var(--surface)',
			border: '2px solid var(--border)',
			borderRadius: '13px',
			cursor: 'pointer',
			position: 'relative',
			transition: 'all 0.3s'
		},
		toggleActive: {
			backgroundColor: 'var(--primary)',
			border: 'none'
		},
		toggleSlider: {
			position: 'absolute',
			top: '2px',
			left: '2px',
			width: '20px',
			height: '20px',
			backgroundColor: 'white',
			borderRadius: '50%',
			transition: 'all 0.3s'
		},
		toggleSliderActive: {
			left: '26px'
		},
		notificationItem: {
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
			padding: '1.5rem',
			backgroundColor: 'var(--surface)',
			borderRadius: 'var(--radius)',
			marginBottom: '1rem'
		},
		securityItem: {
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'space-between',
			padding: '1.5rem',
			backgroundColor: 'var(--surface)',
			borderRadius: 'var(--radius)',
			marginBottom: '1rem'
		},
		securityStatus: {
			display: 'flex',
			alignItems: 'center',
			gap: '0.5rem',
			fontSize: '0.85rem'
		}
	};

	function Toggle({ enabled, onChange }) {
		return (
			<div
				style={{
					...styles.toggle,
					...(enabled && styles.toggleActive)
				}}
				onClick={() => onChange(!enabled)}
			>
				<div
					style={{
						...styles.toggleSlider,
						...(enabled && styles.toggleSliderActive)
					}}
				/>
			</div>
		);
	}

	return (
		<div style={styles.container}>
			{/* Header */}
			<div style={styles.header}>
				<h1 style={styles.title}>Settings</h1>
				<p style={styles.subtitle}>Manage your account, security, and preferences</p>
			</div>

			{/* Tabs */}
			<div style={styles.tabs}>
				{['profile', 'security', 'notifications'].map(tab => (
					<button
						key={tab}
						style={activeTab === tab ? styles.tabActive : styles.tab}
						onClick={() => setActiveTab(tab)}
					>
						{tab.charAt(0).toUpperCase() + tab.slice(1)}
					</button>
				))}
			</div>

			{/* Profile Tab */}
			{activeTab === 'profile' && (
				<>
					<div style={styles.section}>
						<h2 style={styles.sectionTitle}>Business Information</h2>
						<div style={styles.formGrid}>
							<div style={styles.formGroup}>
								<label style={styles.label}>Business Name</label>
								<input
									type="text"
									style={styles.input}
									value={tempSettings.businessName}
									onChange={(e) => setTempSettings({ ...tempSettings, businessName: e.target.value })}
								/>
							</div>
							<div style={styles.formGroup}>
								<label style={styles.label}>Email</label>
								<input
									type="email"
									style={styles.input}
									value={tempSettings.email}
									onChange={(e) => setTempSettings({ ...tempSettings, email: e.target.value })}
								/>
							</div>
							<div style={styles.formGroup}>
								<label style={styles.label}>Phone Number</label>
								<input
									type="tel"
									style={styles.input}
									value={tempSettings.phone}
									onChange={(e) => setTempSettings({ ...tempSettings, phone: e.target.value })}
								/>
							</div>
							<div style={styles.formGroup}>
								<label style={styles.label}>GST Number</label>
								<input
									type="text"
									style={styles.input}
									value={tempSettings.gstNumber}
									onChange={(e) => setTempSettings({ ...tempSettings, gstNumber: e.target.value })}
								/>
							</div>
						</div>
					</div>

					<div style={styles.section}>
						<h2 style={styles.sectionTitle}>Address</h2>
						<div style={styles.formGridFull}>
							<div style={styles.formGroup}>
								<label style={styles.label}>Address</label>
								<input
									type="text"
									style={styles.input}
									value={tempSettings.address}
									onChange={(e) => setTempSettings({ ...tempSettings, address: e.target.value })}
								/>
							</div>
							<div style={styles.formGrid}>
								<div style={styles.formGroup}>
									<label style={styles.label}>City</label>
									<input
										type="text"
										style={styles.input}
										value={tempSettings.city}
										onChange={(e) => setTempSettings({ ...tempSettings, city: e.target.value })}
									/>
								</div>
								<div style={styles.formGroup}>
									<label style={styles.label}>State</label>
									<input
										type="text"
										style={styles.input}
										value={tempSettings.state}
										onChange={(e) => setTempSettings({ ...tempSettings, state: e.target.value })}
									/>
								</div>
								<div style={styles.formGroup}>
									<label style={styles.label}>Pincode</label>
									<input
										type="text"
										style={styles.input}
										value={tempSettings.pincode}
										onChange={(e) => setTempSettings({ ...tempSettings, pincode: e.target.value })}
									/>
								</div>
							</div>
						</div>
					</div>

					<div style={styles.section}>
						<h2 style={styles.sectionTitle}>About Your Business</h2>
						<div style={styles.formGroup}>
							<label style={styles.label}>Business Description</label>
							<textarea
								style={styles.textarea}
								value={tempSettings.aboutBusiness}
								onChange={(e) => setTempSettings({ ...tempSettings, aboutBusiness: e.target.value })}
								placeholder="Tell customers about your business..."
							/>
						</div>
					</div>

					<div style={styles.buttonGroup}>
						<button style={{ ...styles.button, ...styles.secondaryButton }}>
							Cancel
						</button>
						<button style={{ ...styles.button, ...styles.primaryButton }} onClick={handleSaveProfile}>
							Save Changes
						</button>
					</div>
				</>
			)}

			{/* Security Tab */}
			{activeTab === 'security' && (
				<>
					<div style={styles.section}>
						<h2 style={styles.sectionTitle}>Password</h2>
						{!changePassword ? (
							<button
								style={{ ...styles.button, ...styles.primaryButton }}
								onClick={() => setChangePassword(true)}
							>
								Change Password
							</button>
						) : (
							<div style={styles.formGridFull}>
								<div style={styles.formGroup}>
									<label style={styles.label}>Current Password</label>
									<input
										type="password"
										style={styles.input}
										placeholder="Enter current password"
										value={passwords.current}
										onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
									/>
								</div>
								<div style={styles.formGroup}>
									<label style={styles.label}>New Password</label>
									<input
										type="password"
										style={styles.input}
										placeholder="Enter new password"
										value={passwords.new}
										onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
									/>
								</div>
								<div style={styles.formGroup}>
									<label style={styles.label}>Confirm Password</label>
									<input
										type="password"
										style={styles.input}
										placeholder="Confirm new password"
										value={passwords.confirm}
										onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
									/>
								</div>
								<div style={styles.buttonGroup}>
									<button
										style={{ ...styles.button, ...styles.secondaryButton }}
										onClick={() => setChangePassword(false)}
									>
										Cancel
									</button>
									<button
										style={{ ...styles.button, ...styles.primaryButton }}
										onClick={handlePasswordChange}
									>
										Update Password
									</button>
								</div>
							</div>
						)}
					</div>

					<div style={styles.section}>
						<h2 style={styles.sectionTitle}>Two-Factor Authentication</h2>
						<div style={styles.securityItem}>
							<div>
								<div style={styles.settingTitle}>Two-Factor Authentication (2FA)</div>
								<div style={styles.settingDescription}>
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
									style={{ ...styles.button, ...styles.primaryButton }}
									onClick={handleEnable2FA}
								>
									Confirm & Enable 2FA
								</button>
							</div>
						)}
					</div>

					<div style={styles.section}>
						<h2 style={styles.sectionTitle}>Active Sessions</h2>
						<div style={styles.securityItem}>
							<div>
								<div style={styles.settingTitle}>Current Device</div>
								<div style={styles.settingDescription}>
									Chrome on Windows • Last active: Just now
								</div>
							</div>
							<button style={{ ...styles.button, ...styles.secondaryButton, padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
								Sign Out
							</button>
						</div>
						<div style={styles.securityItem}>
							<div>
								<div style={styles.settingTitle}>Mobile Device</div>
								<div style={styles.settingDescription}>
									Mobile Safari on iPhone • Last active: 2 hours ago
								</div>
							</div>
							<button style={{ ...styles.button, ...styles.secondaryButton, padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
								Sign Out
							</button>
						</div>
					</div>
				</>
			)}

			{/* Notifications Tab */}
			{activeTab === 'notifications' && (
				<div style={styles.section}>
					<h2 style={styles.sectionTitle}>Notification Preferences</h2>

					<div style={styles.notificationItem}>
						<div>
							<div style={styles.settingTitle}>New Orders</div>
							<div style={styles.settingDescription}>Get notified when you receive a new order</div>
						</div>
						<Toggle enabled={true} onChange={() => {}} />
					</div>

					<div style={styles.notificationItem}>
						<div>
							<div style={styles.settingTitle}>Order Updates</div>
							<div style={styles.settingDescription}>Updates on order status and shipping</div>
						</div>
						<Toggle enabled={true} onChange={() => {}} />
					</div>

					<div style={styles.notificationItem}>
						<div>
							<div style={styles.settingTitle}>Messages</div>
							<div style={styles.settingDescription}>When customers send you messages</div>
						</div>
						<Toggle enabled={true} onChange={() => {}} />
					</div>

					<div style={styles.notificationItem}>
						<div>
							<div style={styles.settingTitle}>Settlements</div>
							<div style={styles.settingDescription}>Payment and settlement reminders</div>
						</div>
						<Toggle enabled={true} onChange={() => {}} />
					</div>

					<div style={styles.notificationItem}>
						<div>
							<div style={styles.settingTitle}>Weekly Reports</div>
							<div style={styles.settingDescription}>Weekly summary of your sales and analytics</div>
						</div>
						<Toggle enabled={false} onChange={() => {}} />
					</div>

					<div style={styles.notificationItem}>
						<div>
							<div style={styles.settingTitle}>Marketing Updates</div>
							<div style={styles.settingDescription}>Updates about new features and promotional opportunities</div>
						</div>
						<Toggle enabled={false} onChange={() => {}} />
					</div>
				</div>
			)}
		</div>
	);
}

export default VendorSettings;
