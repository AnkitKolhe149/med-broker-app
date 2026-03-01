import React, { useState } from 'react';

function VendorPayments() {
	const [paymentData, setPaymentData] = useState({
		totalEarnings: 245750,
		pendingAmount: 12450,
		currentBalance: 233300,
		totalSettlements: 18,
		transactions: [
			{
				id: 1,
				type: 'order',
				description: 'Order ORD-001234 (Paracetamol 500mg x 2)',
				amount: 1250,
				status: 'settled',
				date: '2024-01-15'
			},
			{
				id: 2,
				type: 'order',
				description: 'Order ORD-001235 (Amoxicillin 250mg x 5)',
				amount: 2100,
				status: 'settled',
				date: '2024-01-14'
			},
			{
				id: 3,
				type: 'order',
				description: 'Order ORD-001236 (Cetirizine 10mg x 3)',
				amount: 890,
				status: 'pending',
				date: '2024-01-13'
			},
			{
				id: 4,
				type: 'refund',
				description: 'Refund for ORD-001230',
				amount: -450,
				status: 'settled',
				date: '2024-01-12'
			}
		],
		settlements: [
			{
				id: 1,
				settlementId: 'SET-2024-001',
				amount: 45600,
				date: '2024-01-10',
				status: 'completed',
				method: 'Bank Transfer'
			},
			{
				id: 2,
				settlementId: 'SET-2024-002',
				amount: 38900,
				date: '2024-01-05',
				status: 'completed',
				method: 'Bank Transfer'
			},
			{
				id: 3,
				settlementId: 'SET-2024-003',
				amount: 52300,
				date: '2023-12-25',
				status: 'completed',
				method: 'Bank Transfer'
			}
		]
	});

	const [showWithdrawal, setShowWithdrawal] = useState(false);
	const [withdrawAmount, setWithdrawAmount] = useState('');
	const [activeTab, setActiveTab] = useState('transactions');

	const handleWithdrawal = () => {
		alert(`Withdrawal request of ₹${withdrawAmount} initiated. You will receive funds within 1-2 business days.`);
		setShowWithdrawal(false);
		setWithdrawAmount('');
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
		metricsGrid: {
			display: 'grid',
			gridTemplateColumns: 'repeat(4, 1fr)',
			gap: '1.5rem',
			marginBottom: '2rem'
		},
		metricCard: {
			backgroundColor: 'white',
			borderRadius: 'var(--radius-lg)',
			padding: '1.5rem',
			border: '1px solid var(--border)',
			boxShadow: 'var(--shadow-sm)'
		},
		metricLabel: {
			fontSize: '0.85rem',
			color: 'var(--text-secondary)',
			fontWeight: '500',
			textTransform: 'uppercase',
			marginBottom: '0.5rem'
		},
		metricValue: {
			fontSize: '1.8rem',
			fontWeight: '700',
			color: 'var(--primary)',
			margin: '0.5rem 0'
		},
		metricChange: {
			fontSize: '0.8rem',
			color: 'var(--success)',
			fontWeight: '600'
		},
		withdrawButton: {
			padding: '0.8rem 1.5rem',
			backgroundColor: 'var(--primary)',
			color: 'white',
			border: 'none',
			borderRadius: 'var(--radius)',
			cursor: 'pointer',
			fontWeight: '600',
			marginTop: '1rem',
			transition: 'all 0.2s',
			width: '100%'
		},
		section: {
			backgroundColor: 'white',
			borderRadius: 'var(--radius-lg)',
			padding: '1.5rem',
			border: '1px solid var(--border)',
			boxShadow: 'var(--shadow-sm)',
			marginBottom: '2rem'
		},
		sectionHeader: {
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
			marginBottom: '1.5rem',
			paddingBottom: '1rem',
			borderBottom: '2px solid var(--border)'
		},
		sectionTitle: {
			fontSize: '1.2rem',
			fontWeight: '700',
			color: 'var(--text-primary)',
			margin: 0
		},
		tabs: {
			display: 'flex',
			gap: '1rem',
			borderBottom: '2px solid var(--border)',
			marginBottom: '1.5rem'
		},
		tab: {
			padding: '0.8rem 1.2rem',
			backgroundColor: 'transparent',
			border: 'none',
			cursor: 'pointer',
			fontWeight: '500',
			color: 'var(--text-secondary)',
			borderBottom: '3px solid transparent',
			transition: 'all 0.2s'
		},
		tabActive: {
			padding: '0.8rem 1.2rem',
			backgroundColor: 'transparent',
			border: 'none',
			cursor: 'pointer',
			fontWeight: '600',
			color: 'var(--primary)',
			borderBottom: '3px solid var(--primary)',
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
		statusBadge: {
			display: 'inline-block',
			padding: '0.3rem 0.8rem',
			borderRadius: '9999px',
			fontSize: '0.8rem',
			fontWeight: '600'
		},
		modalOverlay: {
			display: 'none',
			position: 'fixed',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			backgroundColor: 'rgba(0,0,0,0.5)',
			zIndex: 1000,
			alignItems: 'center',
			justifyContent: 'center'
		},
		modalActive: {
			display: 'flex'
		},
		modal: {
			backgroundColor: 'white',
			borderRadius: 'var(--radius-lg)',
			padding: '2rem',
			maxWidth: '500px',
			width: '90%',
			boxShadow: 'var(--shadow-lg)'
		},
		modalTitle: {
			fontSize: '1.5rem',
			fontWeight: '700',
			color: 'var(--text-primary)',
			marginBottom: '1.5rem'
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
			padding: '0.8rem',
			border: '1px solid var(--border)',
			borderRadius: 'var(--radius)',
			fontSize: '0.95rem',
			fontFamily: 'inherit'
		},
		buttonGroup: {
			display: 'flex',
			gap: '1rem'
		},
		button: {
			flex: 1,
			padding: '0.8rem',
			border: 'none',
			borderRadius: 'var(--radius)',
			cursor: 'pointer',
			fontWeight: '600',
			transition: 'all 0.2s'
		},
		primaryButton: {
			backgroundColor: 'var(--primary)',
			color: 'white'
		},
		secondaryButton: {
			backgroundColor: 'var(--surface)',
			border: '1px solid var(--border)',
			color: 'var(--text-primary)'
		},
		amountPositive: {
			color: 'var(--success)',
			fontWeight: '600'
		},
		amountNegative: {
			color: 'var(--error)',
			fontWeight: '600'
		}
	};

	return (
		<div style={styles.container}>
			{/* Header */}
			<div style={styles.header}>
				<h1 style={styles.title}>Payments & Settlements</h1>
				<p style={styles.subtitle}>Manage earnings and withdrawals</p>
			</div>

			{/* Metrics */}
			<div style={styles.metricsGrid}>
				<div style={styles.metricCard}>
					<div style={styles.metricLabel}>Total Earnings</div>
					<div style={styles.metricValue}>₹{paymentData.totalEarnings.toLocaleString()}</div>
					<div style={styles.metricChange}>↑ 23.5% this month</div>
				</div>
				<div style={styles.metricCard}>
					<div style={styles.metricLabel}>Current Balance</div>
					<div style={styles.metricValue}>₹{paymentData.currentBalance.toLocaleString()}</div>
					<div style={styles.metricChange}>Ready to withdraw</div>
				</div>
				<div style={styles.metricCard}>
					<div style={styles.metricLabel}>Pending Amount</div>
					<div style={styles.metricValue}>₹{paymentData.pendingAmount.toLocaleString()}</div>
					<div style={styles.metricChange}>Will settle on Jan 20</div>
				</div>
				<div style={styles.metricCard}>
					<div style={styles.metricLabel}>Total Settlements</div>
					<div style={styles.metricValue}>{paymentData.totalSettlements}</div>
					<div style={styles.metricChange}>₹{(paymentData.totalEarnings * 0.95).toLocaleString()} withdrawn</div>
					<button
						style={styles.withdrawButton}
						onClick={() => setShowWithdrawal(true)}
					>
						Request Withdrawal
					</button>
				</div>
			</div>

			{/* Transactions and Settlements */}
			<div style={styles.section}>
				<div style={styles.tabs}>
					<button
						style={activeTab === 'transactions' ? styles.tabActive : styles.tab}
						onClick={() => setActiveTab('transactions')}
					>
						Transactions
					</button>
					<button
						style={activeTab === 'settlements' ? styles.tabActive : styles.tab}
						onClick={() => setActiveTab('settlements')}
					>
						Settlement History
					</button>
				</div>

				{activeTab === 'transactions' && (
					<table style={styles.table}>
						<thead>
							<tr style={{ backgroundColor: 'var(--surface)' }}>
								<th style={styles.tableHeader}>Date</th>
								<th style={styles.tableHeader}>Description</th>
								<th style={styles.tableHeader}>Type</th>
								<th style={styles.tableHeader}>Amount</th>
								<th style={styles.tableHeader}>Status</th>
							</tr>
						</thead>
						<tbody>
							{paymentData.transactions.map((txn, idx) => (
								<tr key={idx} style={styles.tableRow}>
									<td style={styles.tableCell}>{txn.date}</td>
									<td style={styles.tableCell}>{txn.description}</td>
									<td style={styles.tableCell}>
										<span style={{
											...styles.statusBadge,
											backgroundColor: txn.type === 'order' ? 'var(--green-100)' : 'var(--red-100)',
											color: txn.type === 'order' ? 'var(--success)' : 'var(--error)'
										}}>
											{txn.type === 'order' ? '💰 Sale' : '↩️ Refund'}
										</span>
									</td>
									<td style={styles.tableCell}>
										<span style={txn.amount > 0 ? styles.amountPositive : styles.amountNegative}>
											{txn.amount > 0 ? '+' : ''}₹{Math.abs(txn.amount).toLocaleString()}
										</span>
									</td>
									<td style={styles.tableCell}>
										<span style={{
											...styles.statusBadge,
											backgroundColor: txn.status === 'settled' ? 'var(--green-100)' : 'var(--yellow-100)',
											color: txn.status === 'settled' ? 'var(--success)' : 'var(--warning)'
										}}>
											{txn.status === 'settled' ? '✓ Settled' : '⏳ Pending'}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}

				{activeTab === 'settlements' && (
					<table style={styles.table}>
						<thead>
							<tr style={{ backgroundColor: 'var(--surface)' }}>
								<th style={styles.tableHeader}>Settlement ID</th>
								<th style={styles.tableHeader}>Amount</th>
								<th style={styles.tableHeader}>Date</th>
								<th style={styles.tableHeader}>Method</th>
								<th style={styles.tableHeader}>Status</th>
							</tr>
						</thead>
						<tbody>
							{paymentData.settlements.map((settlement, idx) => (
								<tr key={idx} style={styles.tableRow}>
									<td style={styles.tableCell}>
										<strong>{settlement.settlementId}</strong>
									</td>
									<td style={styles.tableCell}>
										<strong>₹{settlement.amount.toLocaleString()}</strong>
									</td>
									<td style={styles.tableCell}>{settlement.date}</td>
									<td style={styles.tableCell}>{settlement.method}</td>
									<td style={styles.tableCell}>
										<span style={{
											...styles.statusBadge,
											backgroundColor: 'var(--green-100)',
											color: 'var(--success)'
										}}>
											✓ {settlement.status}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>

			{/* Bank Details */}
			<div style={styles.section}>
				<div style={styles.sectionHeader}>
					<h2 style={styles.sectionTitle}>Bank Details</h2>
					<button style={{
						padding: '0.6rem 1.2rem',
						border: '1px solid var(--border)',
						backgroundColor: 'white',
						borderRadius: 'var(--radius)',
						cursor: 'pointer',
						fontWeight: '500'
					}}>
						Edit
					</button>
				</div>
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
					<div>
						<div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '0.3rem' }}>
							ACCOUNT HOLDER NAME
						</div>
						<div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: '600' }}>
							ABC Pharmacy Ltd
						</div>
					</div>
					<div>
						<div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '0.3rem' }}>
							ACCOUNT NUMBER
						</div>
						<div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: '600' }}>
							567890123456
						</div>
					</div>
					<div>
						<div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '0.3rem' }}>
							BANK NAME
						</div>
						<div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: '600' }}>
							HDFC Bank
						</div>
					</div>
					<div>
						<div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '0.3rem' }}>
							IFSC CODE
						</div>
						<div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: '600' }}>
							HDFC0003456
						</div>
					</div>
				</div>
			</div>

			{/* Withdrawal Modal */}
			<div style={showWithdrawal ? { ...styles.modalOverlay, ...styles.modalActive } : styles.modalOverlay}>
				<div style={styles.modal}>
					<h2 style={styles.modalTitle}>Request Withdrawal</h2>

					<div style={styles.formGroup}>
						<label style={styles.label}>Available Balance</label>
						<div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>
							₹{paymentData.currentBalance.toLocaleString()}
						</div>
					</div>

					<div style={styles.formGroup}>
						<label style={styles.label}>Withdrawal Amount</label>
						<input
							type="number"
							style={styles.input}
							placeholder="Enter amount"
							min="0"
							max={paymentData.currentBalance}
							value={withdrawAmount}
							onChange={(e) => setWithdrawAmount(e.target.value)}
						/>
						<small style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
							Minimum withdrawal: ₹100 | Maximum: ₹{paymentData.currentBalance.toLocaleString()}
						</small>
					</div>

					<div style={{ ...styles.formGroup, backgroundColor: 'var(--primary-light)', padding: '1rem', borderRadius: 'var(--radius)' }}>
						<strong style={{ color: 'var(--text-primary)' }}>Settlement Details</strong>
						<div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: '1.6' }}>
							• Transfer will be made to your registered bank account<br/>
							• Processing time: 1-2 business days<br/>
							• No transaction fees applied
						</div>
					</div>

					<div style={styles.buttonGroup}>
						<button
							style={{ ...styles.button, ...styles.secondaryButton }}
							onClick={() => setShowWithdrawal(false)}
						>
							Cancel
						</button>
						<button
							style={{ ...styles.button, ...styles.primaryButton }}
							onClick={handleWithdrawal}
							disabled={!withdrawAmount || parseInt(withdrawAmount) <= 0}
						>
							Confirm Withdrawal
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default VendorPayments;
