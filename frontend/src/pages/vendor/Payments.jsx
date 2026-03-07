import React, { useState } from 'react';
import styles from './Payments.module.css';

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

	return (
		<div className={styles.container}>
			{/* Header */}
			<div className={styles.header}>
				<h1 className={styles.title}>Payments & Settlements</h1>
				<p className={styles.subtitle}>Manage earnings and withdrawals</p>
			</div>

			{/* Metrics */}
			<div className={styles.metricsGrid}>
				<div className={styles.metricCard}>
					<div className={styles.metricLabel}>Total Earnings</div>
					<div className={styles.metricValue}>₹{paymentData.totalEarnings.toLocaleString()}</div>
					<div className={styles.metricChange}>↑ 23.5% this month</div>
				</div>
				<div className={styles.metricCard}>
					<div className={styles.metricLabel}>Current Balance</div>
					<div className={styles.metricValue}>₹{paymentData.currentBalance.toLocaleString()}</div>
					<div className={styles.metricChange}>Ready to withdraw</div>
				</div>
				<div className={styles.metricCard}>
					<div className={styles.metricLabel}>Pending Amount</div>
					<div className={styles.metricValue}>₹{paymentData.pendingAmount.toLocaleString()}</div>
					<div className={styles.metricChange}>Will settle on Jan 20</div>
				</div>
				<div className={styles.metricCard}>
					<div className={styles.metricLabel}>Total Settlements</div>
					<div className={styles.metricValue}>{paymentData.totalSettlements}</div>
					<div className={styles.metricChange}>₹{(paymentData.totalEarnings * 0.95).toLocaleString()} withdrawn</div>
					<button
						className={styles.withdrawButton}
						onClick={() => setShowWithdrawal(true)}
					>
						Request Withdrawal
					</button>
				</div>
			</div>

			{/* Transactions and Settlements */}
			<div className={styles.section}>
				<div className={styles.tabs}>
					<button
						className={`${styles.tab} ${activeTab === 'transactions' ? styles.tabActive : ''}`}
						onClick={() => setActiveTab('transactions')}
					>
						Transactions
					</button>
					<button
						className={`${styles.tab} ${activeTab === 'settlements' ? styles.tabActive : ''}`}
						onClick={() => setActiveTab('settlements')}
					>
						Settlement History
					</button>
				</div>

				{activeTab === 'transactions' && (
					<table className={styles.table}>
						<thead>
							<tr className={styles.tableHeadRow}>
								<th className={styles.tableHeader}>Date</th>
								<th className={styles.tableHeader}>Description</th>
								<th className={styles.tableHeader}>Type</th>
								<th className={styles.tableHeader}>Amount</th>
								<th className={styles.tableHeader}>Status</th>
							</tr>
						</thead>
						<tbody>
							{paymentData.transactions.map((txn, idx) => (
								<tr key={idx} className={styles.tableRow}>
									<td className={styles.tableCell}>{txn.date}</td>
									<td className={styles.tableCell}>{txn.description}</td>
									<td className={styles.tableCell}>
										<span
											className={styles.statusBadge}
											style={{
											backgroundColor: txn.type === 'order' ? 'var(--green-100)' : 'var(--red-100)',
											color: txn.type === 'order' ? 'var(--success)' : 'var(--error)'
											}}
										>
											{txn.type === 'order' ? '💰 Sale' : '↩️ Refund'}
										</span>
									</td>
									<td className={styles.tableCell}>
										<span className={`${txn.amount > 0 ? styles.amountPositive : styles.amountNegative}`}>
											{txn.amount > 0 ? '+' : ''}₹{Math.abs(txn.amount).toLocaleString()}
										</span>
									</td>
									<td className={styles.tableCell}>
										<span
											className={styles.statusBadge}
											style={{
											backgroundColor: txn.status === 'settled' ? 'var(--green-100)' : 'var(--yellow-100)',
											color: txn.status === 'settled' ? 'var(--success)' : 'var(--warning)'
											}}
										>
											{txn.status === 'settled' ? '✓ Settled' : '⏳ Pending'}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}

				{activeTab === 'settlements' && (
					<table className={styles.table}>
						<thead>
							<tr className={styles.tableHeadRow}>
								<th className={styles.tableHeader}>Settlement ID</th>
								<th className={styles.tableHeader}>Amount</th>
								<th className={styles.tableHeader}>Date</th>
								<th className={styles.tableHeader}>Method</th>
								<th className={styles.tableHeader}>Status</th>
							</tr>
						</thead>
						<tbody>
							{paymentData.settlements.map((settlement, idx) => (
								<tr key={idx} className={styles.tableRow}>
									<td className={styles.tableCell}>
										<strong>{settlement.settlementId}</strong>
									</td>
									<td className={styles.tableCell}>
										<strong>₹{settlement.amount.toLocaleString()}</strong>
									</td>
									<td className={styles.tableCell}>{settlement.date}</td>
									<td className={styles.tableCell}>{settlement.method}</td>
									<td className={styles.tableCell}>
										<span
											className={styles.statusBadge}
											style={{
											backgroundColor: 'var(--green-100)',
											color: 'var(--success)'
											}}
										>
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
			<div className={styles.section}>
				<div className={styles.sectionHeader}>
					<h2 className={styles.sectionTitle}>Bank Details</h2>
					<button className={styles.editButton}>
						Edit
					</button>
				</div>
				<div className={styles.bankGrid}>
					<div>
						<div className={styles.bankLabel}>
							ACCOUNT HOLDER NAME
						</div>
						<div className={styles.bankValue}>
							ABC Pharmacy Ltd
						</div>
					</div>
					<div>
						<div className={styles.bankLabel}>
							ACCOUNT NUMBER
						</div>
						<div className={styles.bankValue}>
							567890123456
						</div>
					</div>
					<div>
						<div className={styles.bankLabel}>
							BANK NAME
						</div>
						<div className={styles.bankValue}>
							HDFC Bank
						</div>
					</div>
					<div>
						<div className={styles.bankLabel}>
							IFSC CODE
						</div>
						<div className={styles.bankValue}>
							HDFC0003456
						</div>
					</div>
				</div>
			</div>

			{/* Withdrawal Modal */}
			<div className={`${styles.modalOverlay} ${showWithdrawal ? styles.modalActive : ''}`}>
				<div className={styles.modal}>
					<h2 className={styles.modalTitle}>Request Withdrawal</h2>

					<div className={styles.formGroup}>
						<label className={styles.label}>Available Balance</label>
						<div className={styles.availableBalanceValue}>
							₹{paymentData.currentBalance.toLocaleString()}
						</div>
					</div>

					<div className={styles.formGroup}>
						<label className={styles.label}>Withdrawal Amount</label>
						<input
							type="number"
							className={styles.input}
							placeholder="Enter amount"
							min="0"
							max={paymentData.currentBalance}
							value={withdrawAmount}
							onChange={(e) => setWithdrawAmount(e.target.value)}
						/>
						<small className={styles.withdrawalHint}>
							Minimum withdrawal: ₹100 | Maximum: ₹{paymentData.currentBalance.toLocaleString()}
						</small>
					</div>

					<div style={{ backgroundColor: 'var(--primary-light)', padding: '1rem', borderRadius: 'var(--radius)' }} className={styles.formGroup}>
						<strong className={styles.settlementDetailsTitle}>Settlement Details</strong>
						<div className={styles.settlementDetailsText}>
							• Transfer will be made to your registered bank account<br/>
							• Processing time: 1-2 business days<br/>
							• No transaction fees applied
						</div>
					</div>

					<div className={styles.buttonGroup}>
						<button
							className={`${styles.button} ${styles.secondaryButton}`}
							onClick={() => setShowWithdrawal(false)}
						>
							Cancel
						</button>
						<button
							className={`${styles.button} ${styles.primaryButton}`}
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
