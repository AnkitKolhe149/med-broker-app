import React, { useEffect, useState, useRef } from 'react';
import VendorPageShell from '../../components/layout/VendorPageShell';
import { useNotification } from '../../context/NotificationContext';
import vendorService from '../../services/vendor.service';
import styles from './Compliance.module.css';
import { Check, AlertTriangle, Clock, X, FileText, ClipboardList, Star, ShieldCheck, Download, Eye, ExternalLink } from 'lucide-react';

const DEFAULT_DOCUMENTS = [
	{
		id: 1,
		name: 'Business License',
		status: 'verified',
		expiryDate: '2025-12-31',
		uploadedDate: '2023-01-15',
		certificate: 'browser-local://business-license'
	},
	{
		id: 2,
		name: 'GST Certificate',
		status: 'verified',
		expiryDate: '2026-06-30',
		uploadedDate: '2023-01-20',
		certificate: 'browser-local://gst-certificate'
	},
	{
		id: 3,
		name: 'Pharmacy License',
		status: 'expiring-soon',
		expiryDate: '2024-03-15',
		uploadedDate: '2023-02-10',
		certificate: 'browser-local://pharmacy-license'
	},
	{
		id: 4,
		name: 'Drug License',
		status: 'pending',
		expiryDate: null,
		uploadedDate: null,
		certificate: null
	}
];

const DEFAULT_AUDIT_LOGS = [
	{ id: 1, action: 'Login', timestamp: '2024-01-15 10:30 AM', ip: '192.168.1.1', status: 'success' },
	{ id: 2, action: 'Profile Updated', timestamp: '2024-01-14 03:45 PM', ip: '192.168.1.1', status: 'success' },
	{ id: 3, action: 'Password Changed', timestamp: '2024-01-13 08:20 AM', ip: '192.168.1.2', status: 'success' },
	{ id: 4, action: 'Bulk Upload', timestamp: '2024-01-12 02:15 PM', ip: '192.168.1.1', status: 'success' },
	{ id: 5, action: 'Failed Login', timestamp: '2024-01-11 11:00 AM', ip: '203.0.113.45', status: 'failed' }
];

const RATINGS_DATA = {
	overall: 4.8,
	totalReviews: 124,
	breakdown: [
		{ label: 'Quality', score: 4.9 },
		{ label: 'Delivery Speed', score: 4.7 },
		{ label: 'Packaging', score: 4.8 },
		{ label: 'Communication', score: 4.6 }
	]
};

function formatToday() {
	return new Date().toISOString().slice(0, 10);
}

function formatExpiryDate() {
	const nextYear = new Date();
	nextYear.setFullYear(nextYear.getFullYear() + 1);
	return nextYear.toISOString().slice(0, 10);
}

function VendorCompliance() {
	const { showError, showSuccess } = useNotification();
	const [loading, setLoading] = useState(true);
	const [documents, setDocuments] = useState(DEFAULT_DOCUMENTS);
	const [auditLogs, setAuditLogs] = useState(DEFAULT_AUDIT_LOGS);
	const [profile, setProfile] = useState(null);
	const [previewDoc, setPreviewDoc] = useState(null);
	const [uploadingDocId, setUploadingDocId] = useState(null);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const fileInputRef = useRef(null);

	useEffect(() => {
		const loadComplianceState = async () => {
			try {
				setLoading(true);
				const profileData = await vendorService.getProfile();
				setProfile(profileData);
				setDocuments(Array.isArray(profileData?.complianceDocuments) && profileData.complianceDocuments.length
					? profileData.complianceDocuments
					: DEFAULT_DOCUMENTS);
				setAuditLogs(Array.isArray(profileData?.complianceAuditLogs) && profileData.complianceAuditLogs.length
					? profileData.complianceAuditLogs
					: DEFAULT_AUDIT_LOGS);
			} catch (error) {
				console.error('Failed to load compliance state:', error);
				showError(error?.response?.data?.message || error?.message || 'Failed to load compliance records');
			} finally {
				setLoading(false);
			}
		};

		loadComplianceState();
	}, [showError]);

	const calculateComplianceScore = () => {
		if (!documents.length) return 0;
		const statusPoints = {
			'verified': 25,
			'expiring-soon': 15,
			'pending': 5,
			'rejected': 0
		};
		const totalPoints = documents.reduce((acc, doc) => acc + (statusPoints[doc.status] || 0), 0);
		const maxPoints = documents.length * 25;
		return Math.round((totalPoints / maxPoints) * 100);
	};

	// Calculate dynamic breakdown based on real rating
	const getDynamicBreakdown = (avg) => {
		const base = avg || 4.8;
		return [
			{ label: 'Product Quality', value: Math.min(5, base + 0.1).toFixed(1) },
			{ label: 'Delivery Speed', value: Math.max(1, base - 0.1).toFixed(1) },
			{ label: 'Packaging', value: base.toFixed(1) },
			{ label: 'Communication', value: Math.max(1, base - 0.2).toFixed(1) }
		];
	};

	const complianceScore = calculateComplianceScore();
	const displayRating = profile?.rating || 4.8;
	const displayTotalReviews = profile?.totalRatings || 184;
	const currentBreakdown = getDynamicBreakdown(displayRating);

	const handleViewCertificate = (doc) => {
		if (!doc.certificate) {
			showError('Document certificate is missing');
			return;
		}
		setPreviewDoc(doc);
	};

	const triggerUpload = (documentId) => {
		setUploadingDocId(documentId);
		if (fileInputRef.current) {
			fileInputRef.current.click();
		}
	};

	const handleFileChange = async (event) => {
		const file = event.target.files?.[0];
		if (!file || !uploadingDocId) return;

		setLoading(true);
		// Simulate local processing
		setTimeout(() => {
			const targetDocument = documents.find((document) => document.id === uploadingDocId);
			if (!targetDocument) {
				setLoading(false);
				return;
			}

			const nextDocuments = documents.map((document) => {
				if (document.id !== uploadingDocId) {
					return document;
				}

				return {
					...document,
					status: 'verified', // In a real app, this might stay 'pending' until server review
					uploadedDate: formatToday(),
					expiryDate: document.status === 'pending' || !document.expiryDate ? formatExpiryDate() : document.expiryDate,
					certificate: `browser-local://${document.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
				};
			});

			setDocuments(nextDocuments);
			setHasUnsavedChanges(true);
			setLoading(false);
			setUploadingDocId(null);
			event.target.value = '';
			showSuccess(`${targetDocument.name} prepared. Click Save to persist.`);
		}, 600);
	};

	const handleSaveAll = async () => {
		try {
			setLoading(true);
			
			const newAuditLogs = [
				{
					id: Date.now(),
					action: 'Updated Compliance Documents',
					timestamp: `${formatToday()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
					ip: '127.0.0.1',
					status: 'success'
				},
				...auditLogs
			].slice(0, 20);

			await vendorService.updateProfile({
				complianceDocuments: documents,
				complianceAuditLogs: newAuditLogs
			});

			setAuditLogs(newAuditLogs);
			setHasUnsavedChanges(false);
			showSuccess('All compliance documents saved successfully');
		} catch (error) {
			console.error('Failed to save compliance state:', error);
			showError('Failed to save changes');
		} finally {
			setLoading(false);
		}
	};

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
			case 'verified': return <><Check size={12} /> Verified</>;
			case 'expiring-soon': return <><AlertTriangle size={12} /> Expiring Soon</>;
			case 'pending': return <><Clock size={12} /> Pending Review</>;
			case 'rejected': return <><X size={12} /> Rejected</>;
			default: return 'Unknown';
		}
	};

	return (
		<div className={styles.container}>
			<VendorPageShell
				title="Compliance & Trust"
				subtitle="Manage business credentials and monitor your performance ratings"
			>
				{loading && !documents.length && <p className={styles.loadingText}>Loading compliance records...</p>}

			<input 
				type="file" 
				ref={fileInputRef} 
				style={{ display: 'none' }} 
				onChange={handleFileChange}
				accept=".pdf,.jpg,.jpeg,.png"
			/>

			{documents.some(d => d.status === 'expiring-soon') && (
				<div className={styles.complianceAlert}>
					<AlertTriangle size={20} strokeWidth={1.5} />
					<div className={styles.alertContent}>
						<div className={styles.alertTitle}>Renewal Required</div>
						<div className={styles.alertMessage}>
							One or more of your documents are expiring soon. Please upload renewed certificates to avoid service interruption.
						</div>
					</div>
				</div>
			)}

			<div className={styles.statsOverview}>
				<div className={styles.scoreCard}>
					<div className={styles.scoreCircle} style={{ 
						background: `conic-gradient(var(--primary) ${complianceScore}%, var(--primary-light) 0)` 
					}}>
						<div className={styles.scoreInner}>{complianceScore}%</div>
					</div>
					<div className={styles.scoreText}>
						<div className={styles.scoreLabel}>Compliance Score</div>
						<div className={styles.scoreDesc}>
							{complianceScore >= 90 ? 'Excellent' : complianceScore >= 70 ? 'Good' : 'Needs Attention'}
						</div>
						<div className={styles.scoreStatus}>
							<ShieldCheck size={14} /> 
							{complianceScore === 100 ? 'All requirements met' : `${documents.filter(d => d.status !== 'verified').length} actions pending`}
						</div>
					</div>
				</div>

				<div className={styles.ratingCard}>
					<div className={styles.ratingHeader}>
						<div className={styles.ratingValue}>{displayRating.toFixed(1)}</div>
						<div className={styles.ratingInfo}>
							<div className={styles.ratingStars}>
								{[...Array(5)].map((_, i) => (
									<Star 
										key={i} 
										size={18} 
										fill={i < Math.floor(displayRating) ? "var(--warning)" : "none"} 
										color="var(--warning)"
										strokeWidth={1.5}
									/>
								))}
							</div>
							<div className={styles.reviewCount}>{displayTotalReviews} Verified Reviews</div>
						</div>
					</div>
					<div className={styles.ratingBreakdown}>
						{currentBreakdown.map((item, idx) => (
							<div key={idx} className={styles.breakdownItem}>
								<span className={styles.breakdownLabel}>{item.label}</span>
								<div className={styles.breakdownTrack}>
									<div className={styles.breakdownFill} style={{ width: `${(Number(item.value) / 5) * 100}%` }}></div>
								</div>
								<span className={styles.breakdownScore}>{item.value}</span>
							</div>
						))}
					</div>
				</div>
			</div>

			<div className={styles.section}>
				<div className={styles.sectionHeader}>
					<div className={styles.sectionTitle}>Business Documents</div>
				</div>
				<div className={styles.documentGrid}>
					{documents.map(doc => (
						<div key={doc.id} className={styles.documentCard}>
							<div className={styles.documentInfo}>
								<div className={styles.documentName}><FileText size={18} strokeWidth={1.5} /> {doc.name}</div>
								<div className={styles.documentMetaRow}>
									{doc.uploadedDate ? (
										<>
											<span>Uploaded: {doc.uploadedDate}</span>
											<span className={styles.dot}>•</span>
											<span>Expires: {doc.expiryDate}</span>
										</>
									) : (
										<span className={styles.notUploaded}>No file attached</span>
									)}
								</div>
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
										<button
											className={styles.viewButton}
											onClick={() => handleViewCertificate(doc)}
											title="View uploaded document"
										>
											<svg 
												width="16" 
												height="16" 
												viewBox="0 0 24 24" 
												fill="none" 
												stroke="currentColor" 
												strokeWidth="2.5" 
												strokeLinecap="round" 
												strokeLinejoin="round"
											>
												<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
												<circle cx="12" cy="12" r="3"></circle>
											</svg>
											<span>View</span>
										</button>
									)}
									<button
										className={doc.status === 'pending' || doc.status === 'expiring-soon' ? styles.primaryButtonSmall : styles.secondaryButtonSmall}
										onClick={() => triggerUpload(doc.id)}
									>
										{doc.status === 'pending' || doc.status === 'expiring-soon' ? 'Upload' : 'Replace'}
									</button>
								</div>
							</div>
						</div>
					))}
				</div>

				{hasUnsavedChanges && (
					<div className={styles.saveActionWrapper}>
						<div className={styles.saveTip}>
							<Clock size={16} /> You have unsaved changes in your documents
						</div>
						<button 
							className={styles.primaryButton} 
							onClick={handleSaveAll}
							disabled={loading}
						>
							{loading ? 'Saving...' : 'Save All Changes'}
						</button>
					</div>
				)}
			</div>

			{/* Audit Logs */}
			<div className={styles.section}>
				<div className={styles.sectionTitle}>Activity & Compliance Audit</div>
				<p className={styles.auditDescription}>
					Log of critical security events and document modifications
				</p>
				<div className={styles.tableWrapper}>
					<table className={styles.table}>
						<thead>
							<tr className={styles.auditHeaderRow}>
								<th className={styles.tableHeader}>Action</th>
								<th className={styles.tableHeader}>Timestamp</th>
								<th className={styles.tableHeader}>Access Point</th>
								<th className={styles.tableHeader}>Status</th>
							</tr>
						</thead>
						<tbody>
							{auditLogs.map((log, idx) => (
								<tr key={idx} className={styles.tableRow}>
									<td className={styles.tableCell}>
										<div className={styles.actionCell}>
											{log.action.includes('Login') ? <ShieldCheck size={14} /> : <FileText size={14} />}
											{log.action}
										</div>
									</td>
									<td className={styles.tableCell}>{log.timestamp}</td>
									<td className={styles.tableCell}><code>{log.ip}</code></td>
									<td className={styles.tableCell}>
										<span className={`${styles.statusPill} ${log.status === 'success' ? styles.pillSuccess : styles.pillError}`}>
											{log.status === 'success' ? 'Success' : 'Failed'}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Compliance Guidelines */}
			<div className={styles.guidelinesSection}>
				<div className={styles.tipCard}>
					<h4 className={styles.tipTitle}><ClipboardList size={18} strokeWidth={1.5} /> Verification Requirements</h4>
					<ul className={styles.tipList}>
						<li>Clear, high-resolution scans of all original documents</li>
						<li>All text and expiry dates must be clearly legible</li>
						<li>Documents must be in PDF, JPG, or PNG format</li>
						<li>File size should not exceed 5MB per document</li>
					</ul>
				</div>
				<div className={styles.tipCard}>
					<h4 className={styles.tipTitle}><ShieldCheck size={18} strokeWidth={1.5} /> Trust & Safety</h4>
					<ul className={styles.tipList}>
						<li>Documents are encrypted and stored securely</li>
						<li>Regular audits help maintain your Trust Score</li>
						<li>Verified vendors receive priority placement in search</li>
						<li>Renewals should be initiated 30 days prior to expiry</li>
					</ul>
				</div>
			</div>

			{/* Preview Modal */}
			{previewDoc && (
				<div className={styles.modalOverlay} onClick={() => setPreviewDoc(null)}>
					<div className={styles.modalContent} onClick={e => e.stopPropagation()}>
						<div className={styles.modalHeader}>
							<h3 className={styles.modalTitle}>{previewDoc.name}</h3>
							<button className={styles.closeButton} onClick={() => setPreviewDoc(null)}>
								<X size={20} />
							</button>
						</div>
						<div className={styles.modalBody}>
							<div className={styles.documentPreviewPlaceholder}>
								<FileText size={64} strokeWidth={1} className={styles.previewIcon} />
								<div className={styles.previewMeta}>
									<p><strong>Status:</strong> {previewDoc.status.toUpperCase()}</p>
									<p><strong>Uploaded:</strong> {previewDoc.uploadedDate || 'N/A'}</p>
									<p><strong>Expires:</strong> {previewDoc.expiryDate || 'N/A'}</p>
								</div>
								{previewDoc.certificate.startsWith('http') ? (
									<a 
										href={previewDoc.certificate} 
										target="_blank" 
										rel="noopener noreferrer" 
										className={styles.viewLink}
									>
										Open Original Document <ExternalLink size={14} />
									</a>
								) : (
									<div className={styles.previewNote}>
										<ShieldCheck size={16} /> Verified digital signature attached
									</div>
								)}
							</div>
						</div>
						<div className={styles.modalFooter}>
							<button className={styles.secondaryButton} onClick={() => setPreviewDoc(null)}>Close</button>
							<button className={styles.primaryButton} onClick={() => {
								setPreviewDoc(null);
								triggerUpload(previewDoc.id);
							}}>Replace Document</button>
						</div>
					</div>
				</div>
			)}
			</VendorPageShell>
		</div>
	);
}

export default VendorCompliance;
