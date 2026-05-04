import React, { useEffect, useMemo, useState } from 'react';
import VendorPageShell from '../../components/layout/VendorPageShell';
import { useCurrency } from '../../context/CurrencyContext';
import { useNotification } from '../../context/NotificationContext';
import orderService from '../../services/order.service';
import vendorService from '../../services/vendor.service';
import { formatCurrency } from '../../utils/currency';
import styles from './Payments.module.css';
import { Banknote, Undo2, Check, Clock } from 'lucide-react';

function VendorPayments() {
	const { currency, convert } = useCurrency();
	const { showError, showSuccess } = useNotification();
	const [paymentData, setPaymentData] = useState({
		totalEarnings: 0,
		pendingAmount: 0,
		currentBalance: 0,
		totalSettlements: 0,
		transactions: [],
		settlements: []
	});
	const [loading, setLoading] = useState(true);

	const [showWithdrawal, setShowWithdrawal] = useState(false);
	const [withdrawAmount, setWithdrawAmount] = useState('');
	const [withdrawNote, setWithdrawNote] = useState('');
	const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
	const [withdrawalHistory, setWithdrawalHistory] = useState([]);
	const [activeTab, setActiveTab] = useState('transactions');
	const formatMoney = (value) => formatCurrency(convert(value, 'INR'), currency, true);

	useEffect(() => {
		const loadVendorPayments = async () => {
			try {
				setLoading(true);
				const [result, withdrawalResult] = await Promise.all([
					orderService.getVendorOrders({ page: 1, limit: 100 }),
					vendorService.getWithdrawalHistory({ page: 1, limit: 20 })
				]);
				const transactions = (result.orders || []).map((order) => ({
					id: order.id,
					type: 'order',
					description: `${order.customer || 'Customer'} • ${order.items?.length || 0} line item(s)`,
					amount: Math.round((order.amountCents || 0) / 100),
					status: order.status === 'paid' || order.status === 'shipped' ? 'settled' : 'pending',
					date: order.createdAt ? new Date(order.createdAt).toISOString().slice(0, 10) : '-'
				}));

				const settled = transactions.filter((txn) => txn.status === 'settled');
				const pending = transactions.filter((txn) => txn.status === 'pending');
				const totalEarnings = transactions.reduce((sum, txn) => sum + Math.max(0, txn.amount), 0);
				const pendingAmount = pending.reduce((sum, txn) => sum + Math.max(0, txn.amount), 0);

				setPaymentData({
					totalEarnings,
					pendingAmount,
					currentBalance: Math.max(0, totalEarnings - pendingAmount),
					totalSettlements: settled.length,
					transactions,
					settlements: settled.slice(0, 5).map((txn, index) => ({
						id: index + 1,
						settlementId: `SET-${txn.id.slice(0, 8).toUpperCase()}`,
						amount: txn.amount,
						date: txn.date,
						status: 'completed',
						method: 'Bank Transfer'
					}))
				});

				setWithdrawalHistory(withdrawalResult.requests || []);
			} catch (error) {
				console.error('Failed to load vendor payment data:', error);
				showError(error?.response?.data?.message || 'Failed to load payments');
			} finally {
				setLoading(false);
			}
		};

		loadVendorPayments();
	}, [showError]);

	const handleWithdrawal = async () => {
		const requestedAmount = Number(withdrawAmount);
		if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
			showError('Please enter a valid withdrawal amount.');
			return;
		}

		if (requestedAmount > paymentData.currentBalance) {
			showError('Requested amount exceeds available balance.');
			return;
		}

		setSubmittingWithdrawal(true);
		try {
			await vendorService.requestWithdrawal({
				amountCents: Math.round(requestedAmount * 100),
				note: withdrawNote
			});

			const historyResult = await vendorService.getWithdrawalHistory({ page: 1, limit: 20 });
			setWithdrawalHistory(historyResult.requests || []);

			showSuccess(`Withdrawal request of ${formatMoney(requestedAmount)} submitted for admin approval.`);
			setShowWithdrawal(false);
			setWithdrawAmount('');
			setWithdrawNote('');
		} catch (error) {
			console.error('Failed to submit withdrawal request:', error);
			showError(error?.response?.data?.message || error?.message || 'Failed to submit withdrawal request');
		} finally {
			setSubmittingWithdrawal(false);
		}
	};

	const displayData = useMemo(() => paymentData, [paymentData]);

	const toReadableStatus = (status) => {
		if (!status) return 'Unknown';
		const normalized = String(status).toUpperCase();
		if (normalized === 'PENDING') return 'Pending Approval';
		if (normalized === 'COMPLETED') return 'Approved & Paid';
		if (normalized === 'FAILED') return 'Rejected / Failed';
		return normalized;
	};

	return (
		<div className={styles.container}>
			<VendorPageShell
				title="Payments & Settlements"
				subtitle="Manage earnings and withdrawals"
			>

			{/* Metrics */}
			<div className={styles.metricsGrid}>
				<div className={styles.metricCard}>
					<div className={styles.metricLabel}>Total Earnings</div>
					<div className={styles.metricValue}>{formatMoney(paymentData.totalEarnings)}</div>
					<div className={styles.metricChange}>↑ 23.5% this month</div>
				</div>
				<div className={styles.metricCard}>
					<div className={styles.metricLabel}>Current Balance</div>
					<div className={styles.metricValue}>{formatMoney(paymentData.currentBalance)}</div>
					<div className={styles.metricChange}>Ready to withdraw</div>
				</div>
				<div className={styles.metricCard}>
					<div className={styles.metricLabel}>Pending Amount</div>
					<div className={styles.metricValue}>{formatMoney(paymentData.pendingAmount)}</div>
					<div className={styles.metricChange}>Will settle on Jan 20</div>
				</div>
				<div className={styles.metricCard}>
					<div className={styles.metricLabel}>Total Settlements</div>
					<div className={styles.metricValue}>{paymentData.totalSettlements}</div>
					<div className={styles.metricChange}>{formatMoney(paymentData.totalEarnings * 0.95)} withdrawn</div>
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
					loading ? (
						<div className={styles.loadingState}>Loading payment history...</div>
					) : (
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
											{txn.type === 'order' ? <><Banknote size={12} strokeWidth={1.5} /> Sale</> : <><Undo2 size={12} strokeWidth={1.5} /> Refund</>}
										</span>
									</td>
									<td className={styles.tableCell}>
										<span className={`${txn.amount > 0 ? styles.amountPositive : styles.amountNegative}`}>
											{txn.amount > 0 ? '+' : ''}{formatMoney(Math.abs(txn.amount))}
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
											{txn.status === 'settled' ? <><Check size={12} strokeWidth={1.5} /> Settled</> : <><Clock size={12} strokeWidth={1.5} /> Pending</>}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
					)
				)}

				{activeTab === 'settlements' && (
					loading ? (
						<div className={styles.loadingState}>Loading settlements...</div>
					) : (
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
										<strong>{formatMoney(settlement.amount)}</strong>
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
											<Check size={12} strokeWidth={1.5} /> {settlement.status}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
					)
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
						<div className={styles.bankValue}>{'Connected bank account'}</div>
					</div>
					<div>
						<div className={styles.bankLabel}>
							ACCOUNT NUMBER
						</div>
						<div className={styles.bankValue}>
							•••• •••• •••• 3456
						</div>
					</div>
					<div>
						<div className={styles.bankLabel}>
							BANK NAME
						</div>
						<div className={styles.bankValue}>
							Registered payout bank
						</div>
					</div>
					<div>
						<div className={styles.bankLabel}>
							IFSC CODE
						</div>
						<div className={styles.bankValue}>
							•••••••••••
						</div>
					</div>
				</div>
			</div>

			<div className={styles.section}>
				<div className={styles.sectionHeader}>
					<h2 className={styles.sectionTitle}>Withdrawal Requests History</h2>
				</div>

				{loading ? (
					<div className={styles.loadingState}>Loading withdrawal requests...</div>
				) : withdrawalHistory.length === 0 ? (
					<div className={styles.loadingState}>No withdrawal requests yet.</div>
				) : (
					<table className={styles.table}>
						<thead>
							<tr className={styles.tableHeadRow}>
								<th className={styles.tableHeader}>Requested On</th>
								<th className={styles.tableHeader}>Amount</th>
								<th className={styles.tableHeader}>Status</th>
								<th className={styles.tableHeader}>Note</th>
								<th className={styles.tableHeader}>Reference</th>
							</tr>
						</thead>
						<tbody>
							{withdrawalHistory.map((request) => (
								<tr key={request.id} className={styles.tableRow}>
									<td className={styles.tableCell}>{request.createdAt ? new Date(request.createdAt).toLocaleString() : '-'}</td>
									<td className={styles.tableCell}><strong>{formatMoney((request.amountCents || 0) / 100)}</strong></td>
									<td className={styles.tableCell}>
										<span
											className={styles.statusBadge}
											style={{
												backgroundColor: request.status === 'COMPLETED' ? 'var(--green-100)' : request.status === 'PENDING' ? 'var(--yellow-100)' : 'var(--red-100)',
												color: request.status === 'COMPLETED' ? 'var(--success)' : request.status === 'PENDING' ? 'var(--warning)' : 'var(--error)'
											}}
										>
											{toReadableStatus(request.status)}
										</span>
									</td>
									<td className={styles.tableCell}>{request.notes || '-'}</td>
									<td className={styles.tableCell}>{request.transactionId || '-'}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>

			{/* Withdrawal Modal */}
			<div className={`${styles.modalOverlay} ${showWithdrawal ? styles.modalActive : ''}`}>
				<div className={styles.modal}>
					<h2 className={styles.modalTitle}>Request Withdrawal</h2>

					<div className={styles.formGroup}>
						<label className={styles.label}>Available Balance</label>
						<div className={styles.availableBalanceValue}>
							{formatMoney(paymentData.currentBalance)}
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
							Minimum withdrawal: {formatMoney(100)} | Maximum: {formatMoney(paymentData.currentBalance)}
						</small>
					</div>

					<div className={styles.formGroup}>
						<label className={styles.label}>Note for Admin (optional)</label>
						<textarea
							className={styles.input}
							rows={3}
							placeholder="Reason or settlement note"
							value={withdrawNote}
							onChange={(e) => setWithdrawNote(e.target.value)}
						/>
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
							disabled={submittingWithdrawal}
						>
							Cancel
						</button>
						<button
							className={`${styles.button} ${styles.primaryButton}`}
							onClick={handleWithdrawal}
							disabled={submittingWithdrawal || !withdrawAmount || Number(withdrawAmount) <= 0}
						>
							{submittingWithdrawal ? 'Submitting...' : 'Confirm Withdrawal'}
						</button>
					</div>
				</div>
			</div>
			</VendorPageShell>
		</div>
	);
}

export default VendorPayments;
