import React, { useState } from 'react';

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
		section: {
			backgroundColor: 'white',
			borderRadius: 'var(--radius-lg)',
			padding: '1.5rem',
			border: '1px solid var(--border)',
			boxShadow: 'var(--shadow-sm)',
			marginBottom: '2rem'
		},
		sectionTitle: {
			fontSize: '1.2rem',
			fontWeight: '700',
			color: 'var(--text-primary)',
			marginBottom: '1.5rem',
			paddingBottom: '1rem',
			borderBottom: '2px solid var(--border)'
		},
		documentGrid: {
			display: 'grid',
			gridTemplateColumns: 'repeat(2, 1fr)',
			gap: '1.5rem'
		},
		documentCard: {
			border: '1px solid var(--border)',
			borderRadius: 'var(--radius)',
			padding: '1rem',
			backgroundColor: 'var(--surface)',
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center'
		},
		documentInfo: {
			flex: 1
		},
		documentName: {
			fontWeight: '600',
			color: 'var(--text-primary)',
			marginBottom: '0.5rem'
		},
		documentMeta: {
			fontSize: '0.85rem',
			color: 'var(--text-secondary)',
			marginBottom: '0.3rem'
		},
		statusBadge: {
			display: 'inline-block',
			padding: '0.3rem 0.8rem',
			borderRadius: '9999px',
			fontSize: '0.8rem',
			fontWeight: '600',
			color: 'white',
			marginRight: '1rem'
		},
		actionButtons: {
			display: 'flex',
			gap: '0.5rem'
		},
		button: {
			padding: '0.4rem 0.8rem',
			border: '1px solid var(--primary)',
			backgroundColor: 'white',
			color: 'var(--primary)',
			borderRadius: 'var(--radius)',
			cursor: 'pointer',
			fontSize: '0.85rem',
			fontWeight: '500',
			transition: 'all 0.2s'
		},
		primaryButton: {
			padding: '0.6rem 1.2rem',
			backgroundColor: 'var(--primary)',
			color: 'white',
			border: 'none',
			borderRadius: 'var(--radius)',
			cursor: 'pointer',
			fontSize: '0.9rem',
			fontWeight: '600',
			transition: 'all 0.2s'
		},
		table: {
			width: '100%',
			borderCollapse: 'collapse'
		},
		tableHeader: {
			backgroundColor: 'var(--surface)',
			fontWeight: '600',
			color: 'var(--text-primary)',
			padding: '1rem',
			textAlign: 'left',
			borderBottom: '2px solid var(--border)',
			fontSize: '0.9rem'
		},
		tableRow: {
			borderBottom: '1px solid var(--border)',
			padding: '1rem'
		},
		tableCell: {
			padding: '1rem',
			textAlign: 'left',
			fontSize: '0.9rem'
		},
		complianceAlert: {
			backgroundColor: 'var(--warning-light)',
			border: `2px solid var(--warning)`,
			borderRadius: 'var(--radius)',
			padding: '1rem',
			marginBottom: '1.5rem',
			display: 'flex',
			gap: '1rem'
		},
		alertContent: {
			flex: 1
		},
		alertTitle: {
			fontWeight: '600',
			color: 'var(--warning-dark)',
			marginBottom: '0.3rem'
		},
		alertMessage: {
			color: 'var(--warning-dark)',
			fontSize: '0.9rem',
			lineHeight: '1.5'
		},
		complianceScore: {
			display: 'flex',
			alignItems: 'center',
			gap: '1rem',
			padding: '1.5rem',
			backgroundColor: 'var(--primary-light)',
			borderRadius: 'var(--radius-lg)',
			border: '1px solid var(--primary)',
			marginBottom: '1.5rem'
		},
		scoreCircle: {
			width: '80px',
			height: '80px',
			borderRadius: '50%',
			backgroundColor: 'var(--primary)',
			color: 'white',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			fontSize: '2rem',
			fontWeight: '700',
			flexShrink: 0
		},
		scoreText: {
			flex: 1
		},
		scoreLabel: {
			fontSize: '0.9rem',
			color: 'var(--text-secondary)',
			marginBottom: '0.3rem'
		},
		scoreDesc: {
			fontSize: '1rem',
			fontWeight: '600',
			color: 'var(--text-primary)',
			marginBottom: '0.5rem'
		},
		scoreStatus: {
			fontSize: '0.85rem',
			color: 'var(--success)',
			fontWeight: '500'
		}
	};

	return (
		<div style={styles.container}>
			{/* Header */}
			<div style={styles.header}>
				<h1 style={styles.title}>Compliance & Documents</h1>
				<p style={styles.subtitle}>Manage your business licenses, certifications, and regulatory documents</p>
			</div>

			{/* Compliance Alert */}
			<div style={styles.complianceAlert}>
				<div>⚠️</div>
				<div style={styles.alertContent}>
					<div style={styles.alertTitle}>Action Required</div>
					<div style={styles.alertMessage}>
						Your Pharmacy License expires on March 15, 2024. Please renew it to maintain uninterrupted service.
					</div>
				</div>
			</div>

			{/* Compliance Score */}
			<div style={styles.complianceScore}>
				<div style={styles.scoreCircle}>92%</div>
				<div style={styles.scoreText}>
					<div style={styles.scoreLabel}>Compliance Score</div>
					<div style={styles.scoreDesc}>Excellent - Keep It Up!</div>
					<div style={styles.scoreStatus}>✓ All major requirements met. 1 document renewal pending.</div>
				</div>
			</div>

			{/* Documents Section */}
			<div style={styles.section}>
				<div style={styles.sectionTitle}>Business Documents</div>
				<div style={styles.documentGrid}>
					{documents.map(doc => (
						<div key={doc.id} style={styles.documentCard}>
							<div style={styles.documentInfo}>
								<div style={styles.documentName}>📄 {doc.name}</div>
								{doc.uploadedDate && (
									<>
										<div style={styles.documentMeta}>Uploaded: {doc.uploadedDate}</div>
										<div style={styles.documentMeta}>Expires: {doc.expiryDate}</div>
									</>
								)}
								{!doc.uploadedDate && (
									<div style={styles.documentMeta}>Not yet uploaded</div>
								)}
							</div>
							<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
								<div
									style={{
										...styles.statusBadge,
										backgroundColor: getStatusColor(doc.status)
									}}
								>
									{getStatusLabel(doc.status)}
								</div>
								<div style={styles.actionButtons}>
									{doc.certificate && (
										<button style={styles.button}>View</button>
									)}
									{doc.status === 'pending' || doc.status === 'expiring-soon' ? (
										<button style={styles.primaryButton}>Upload</button>
									) : (
										<button style={styles.button}>Replace</button>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Audit Logs */}
			<div style={styles.section}>
				<div style={styles.sectionTitle}>Audit Logs</div>
				<p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
					Complete activity log of all account actions and access attempts
				</p>
				<table style={styles.table}>
					<thead>
						<tr style={{ backgroundColor: 'var(--surface)' }}>
							<th style={styles.tableHeader}>Action</th>
							<th style={styles.tableHeader}>Timestamp</th>
							<th style={styles.tableHeader}>IP Address</th>
							<th style={styles.tableHeader}>Status</th>
						</tr>
					</thead>
					<tbody>
						{auditLogs.map((log, idx) => (
							<tr key={idx} style={styles.tableRow}>
								<td style={styles.tableCell}>{log.action}</td>
								<td style={styles.tableCell}>{log.timestamp}</td>
								<td style={styles.tableCell}>{log.ip}</td>
								<td style={styles.tableCell}>
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
			<div style={styles.section}>
				<div style={styles.sectionTitle}>Compliance Guidelines</div>
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
					<div style={{ padding: '1rem', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius)' }}>
						<h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)' }}>📋 Document Requirements</h4>
						<ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
							<li>Current Business License</li>
							<li>Valid GST Certificate</li>
							<li>Pharmacy License (if applicable)</li>
							<li>Drug Manufacturing License</li>
						</ul>
					</div>
					<div style={{ padding: '1rem', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius)' }}>
						<h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)' }}>✓ Best Practices</h4>
						<ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
							<li>Renew documents 30 days before expiry</li>
							<li>Keep copies in secure location</li>
							<li>Review audit logs monthly</li>
							<li>Enable 2FA for account security</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
}

export default VendorCompliance;
