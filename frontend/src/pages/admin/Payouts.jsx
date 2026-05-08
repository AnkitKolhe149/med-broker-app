import React, { useEffect, useState } from 'react';
import adminService from '../../services/admin.service';
import { useCurrency } from '../../context/CurrencyContext';
import { DollarSign, CheckCircle, TrendingUp } from 'lucide-react';
import './Payouts.css';

const AdminPayouts = () => {
    const [payouts, setPayouts] = useState([]);
    const [totalPlatformFeeCents, setTotalPlatformFeeCents] = useState(0);
    const [globalRatePercent, setGlobalRatePercent] = useState(5);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const { formatCurrency, currency } = useCurrency();

    useEffect(() => {
        fetchPayouts();
    }, []);

    const fetchPayouts = async () => {
        try {
            const overviewData = await adminService.getPayoutOverview();
            setPayouts(overviewData.data || []);
            setTotalPlatformFeeCents(overviewData.totalPlatformFeeCents || 0);
            if (overviewData.globalRatePercent !== undefined) {
                setGlobalRatePercent(overviewData.globalRatePercent);
            }
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch payouts:', error);
            setLoading(false);
        }
    };

    const handleProcessPayout = async (vendorId, amountCents) => {
        if (!window.confirm(`Are you sure you want to process a payout of ${formatCurrency(amountCents / 100)}?`)) {
            return;
        }

        setProcessingId(vendorId);
        try {
            await adminService.processPayout(vendorId, amountCents);
            alert('Payout processed successfully!');
            fetchPayouts(); // refresh the list to show updated balance
        } catch (error) {
            console.error('Failed to process payout:', error);
            alert('Failed to process payout.');
        } finally {
            setProcessingId(null);
        }
    };

    const formatCents = (cents) => formatCurrency((cents || 0) / 100);

    const totalUnpaidBalance = payouts.reduce((sum, p) => sum + p.pendingBalanceCents, 0);

    if (loading) return <div className="admin-loading"><div className="spinner"></div>Loading Financials...</div>;

    return (
        <div className="admin-payouts fade-in">
            <header className="page-header">
                <div>
                    <h1>Payouts & Finances</h1>
                    <p>Manage vendor balances, process payouts, and track platform commissions.</p>
                </div>
            </header>

            <div className="payout-summary-cards">
                <div className="summary-card glass-card">
                    <div className="card-icon"><DollarSign /></div>
                    <div className="card-info">
                        <h3>Pending Payouts</h3>
                        <p className="card-value">{formatCents(totalUnpaidBalance)}</p>
                        <span className="card-subtitle">Total amount owed to vendors</span>
                    </div>
                </div>
                <div className="summary-card glass-card">
                    <div className="card-icon success"><TrendingUp /></div>
                    <div className="card-info">
                        <h3>Platform Fee</h3>
                        <p className="card-value success">{formatCents(totalPlatformFeeCents)}</p>
                        <span className="card-subtitle">
                            Total fees (realized + pending) · Current rate: {globalRatePercent}%
                        </span>
                    </div>
                </div>
            </div>

            <div className="table-container glass-card mt-6">
                <h2 style={{ marginBottom: '1rem' }}>Vendor Balances</h2>
                {payouts.length === 0 ? (
                    <div className="empty-state">
                        <CheckCircle size={48} color="#22c55e" />
                        <h2>No active balances</h2>
                        <p>There are no vendors with pending balances or historical revenue.</p>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Vendor</th>
                                <th>Gross Revenue</th>
                                <th>Platform Fee (Hybrid)</th>
                                <th>Already Paid</th>
                                <th>Pending Balance</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payouts.map(payout => (
                                <tr key={payout.vendorId}>
                                    <td>
                                        <div className="vendor-company">
                                            <strong>{payout.companyName}</strong>
                                            <span className="sub-text">{payout.contactPersonName}</span>
                                        </div>
                                    </td>
                                    <td>{formatCents(payout.totalEarnedCents)}</td>
                                    <td className="commission-text">
                                        {(() => {
                                            const displayAmount = payout.commissionCents || 0;
                                            const displayRate = Math.round(payout.commissionRatePercent || 0);
                                            return `${formatCents(displayAmount)} (${displayRate}% applied)`;
                                        })()}
                                    </td>
                                    <td>{formatCents(payout.totalPaidCents)}</td>
                                    <td>
                                        <strong className={payout.pendingBalanceCents > 0 ? "pending-amount" : ""}>
                                            {formatCents(payout.pendingBalanceCents)}
                                        </strong>
                                    </td>
                                    <td>
                                        <button 
                                            className="btn-action approve"
                                            disabled={payout.pendingBalanceCents <= 0 || processingId === payout.vendorId}
                                            onClick={() => handleProcessPayout(payout.vendorId, payout.pendingBalanceCents)}
                                        >
                                            {processingId === payout.vendorId ? 'Processing...' : 'Process Payout'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AdminPayouts;
