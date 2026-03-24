import React, { useState } from 'react';
import VendorPageShell from '../../components/layout/VendorPageShell';
import styles from './Compliance.module.css';

function VendorCompliance() {
	const [documents, setDocuments] = useState([
		{
			id: 1,
			name: 'Business License',
			status: 'verified',
			expiryDate: '2025-12-31',
			uploadedDate: '2023-01-15',
			certificate: 'https://example.com/file.pdf'
		},
		{
			id: 2,
			name: 'GST Certificate',
			status: 'verified',
			expiryDate: '2026-06-30',
			uploadedDate: '2023-01-20',
			certificate: 'https://example.com/file.pdf'
		},
		{
			id: 3,
			name: 'Pharmacy License',
			status: 'expiring-soon',
			expiryDate: '2024-03-15',
			uploadedDate: '2023-02-10',
			certificate: 'https://example.com/file.pdf'
		},
		{
			id: 4,
			name: 'Drug License',
			status: 'pending',
			expiryDate: null,
			uploadedDate: null,
			certificate: null
		}
	]);

	const [auditLogs, setAuditLogs] = useState([
		{ id: 1, action: 'Login', timestamp: '2024-01-15 10:30 AM', ip: '192.168.1.1', status: 'success' },
		{ id: 2, action: 'Profile Updated', timestamp: '2024-01-14 03:45 PM', ip: '192.168.1.1', status: 'success' },
		{ id: 3, action: 'Password Changed', timestamp: '2024-01-13 08:20 AM', ip: '192.168.1.2', status: 'success' },
		{ id: 4, action: 'Bulk Upload', timestamp: '2024-01-12 02:15 PM', ip: '192.168.1.1', status: 'success' },
		{ id: 5, action: 'Failed Login', timestamp: '2024-01-11 11:00 AM', ip: '203.0.113.45', status: 'failed' }
	]);

	const getStatusColor = (status) => {
		switch(status) {
			case 'verified': return 'var(--success)';
			case 'expiring-soon': return 'var(--warning)';
			case 'pending': return 'var(--warning)';
			case 'rejected': return 'var(--error)';
			default: return 'var(--text-secondary)';
		}
	};

	const getStatusLabel = (status) => {
		switch(status) {
			case 'verified': return '✓ Verified';
			case 'expiring-soon': return '⚠ Expiring Soon';
			case 'pending': return '⏳ Pending Review';
			case 'rejected': return '✗ Rejected';
			default: return 'Unknown';
		}
	};

	return (
		<div className={styles.container}>
			<VendorPageShell
				title="Compliance & Documents"
				subtitle="Manage your business licenses, certifications, and regulatory documents"
			>

			{/* Compliance Alert */}
			<div className={styles.complianceAlert}>
				<div>⚠️</div>
				<div className={styles.alertContent}>
					<div className={styles.alertTitle}>Action Required</div>
					<div className={styles.alertMessage}>
						Your Pharmacy License expires on March 15, 2024. Please renew it to maintain uninterrupted service.
					</div>
				</div>
			</div>

			{/* Compliance Score */}
			<div className={styles.complianceScore}>
				<div className={styles.scoreCircle}>92%</div>
				<div className={styles.scoreText}>
					<div className={styles.scoreLabel}>Compliance Score</div>
					<div className={styles.scoreDesc}>Excellent - Keep It Up!</div>
					<div className={styles.scoreStatus}>✓ All major requirements met. 1 document renewal pending.</div>
				</div>
			</div>

			{/* Documents Section */}
			<div className={styles.section}>
				<div className={styles.sectionTitle}>Business Documents</div>
				<div className={styles.documentGrid}>
					{documents.map(doc => (
						<div key={doc.id} className={styles.documentCard}>
							<div className={styles.documentInfo}>
								<div className={styles.documentName}>📄 {doc.name}</div>
								{doc.uploadedDate && (
									<>
										<div className={styles.documentMeta}>Uploaded: {doc.uploadedDate}</div>
										<div className={styles.documentMeta}>Expires: {doc.expiryDate}</div>
									</>
								)}
								{!doc.uploadedDate && (
									<div className={styles.documentMeta}>Not yet uploaded</div>
								)}
							</div>
							<div className={styles.documentActionsWrap}>
								<div
									className={styles.statusBadge}
									style={{ backgroundColor: getStatusColor(doc.status) }}
								>
									{getStatusLabel(doc.status)}
								</div>
								<div className={styles.actionButtons}>
									{doc.certificate && (
										<button className={styles.button}>View</button>
									)}
									<button
										className={`${doc.status === 'pending' || doc.status === 'expiring-soon' ? styles.primaryButton : styles.button}`}
									>
										{doc.status === 'pending' || doc.status === 'expiring-soon' ? 'Upload' : 'Replace'}
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Audit Logs */}
			<div className={styles.section}>
				<div className={styles.sectionTitle}>Audit Logs</div>
				<p className={styles.auditDescription}>
					Complete activity log of all account actions and access attempts
				</p>
				<table className={styles.table}>
					<thead>
						<tr className={styles.auditHeaderRow}>
							<th className={styles.tableHeader}>Action</th>
							<th className={styles.tableHeader}>Timestamp</th>
							<th className={styles.tableHeader}>IP Address</th>
							<th className={styles.tableHeader}>Status</th>
						</tr>
					</thead>
					<tbody>
						{auditLogs.map((log, idx) => (
							<tr key={idx} className={styles.tableRow}>
								<td className={styles.tableCell}>{log.action}</td>
								<td className={styles.tableCell}>{log.timestamp}</td>
								<td className={styles.tableCell}>{log.ip}</td>
								<td className={styles.tableCell}>
									<span style={{
										padding: '0.3rem 0.8rem',
										borderRadius: '9999px',
										fontSize: '0.8rem',
										fontWeight: '600',
										backgroundColor: log.status === 'success' ? 'var(--green-100)' : 'var(--red-100)',
										color: log.status === 'success' ? 'var(--success)' : 'var(--error)'
									}}>
										{log.status === 'success' ? '✓ Success' : '✗ Failed'}
									</span>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Compliance Tips */}
			<div className={styles.section}>
				<div className={styles.sectionTitle}>Compliance Guidelines</div>
				<div className={styles.tipsGrid}>
					<div className={styles.tipCard}>
						<h4 className={styles.tipTitle}>📋 Document Requirements</h4>
						<ul className={styles.tipList}>
							<li>Current Business License</li>
							<li>Valid GST Certificate</li>
							<li>Pharmacy License (if applicable)</li>
							<li>Drug Manufacturing License</li>
						</ul>
					</div>
					<div className={styles.tipCard}>
						<h4 className={styles.tipTitle}>✓ Best Practices</h4>
						<ul className={styles.tipList}>
							<li>Renew documents 30 days before expiry</li>
							<li>Keep copies in secure location</li>
							<li>Review audit logs monthly</li>
							<li>Enable 2FA for account security</li>
						</ul>
					</div>
				</div>
			</div>
			</VendorPageShell>
		</div>
	);
}

export default VendorCompliance;
