import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import adminService from '../../services/admin.service';
import { useCurrency } from '../../context/CurrencyContext';
import { Bell, TrendingUp, ArrowRight, Search, CheckCircle, Calendar, X } from 'lucide-react';
import { format, subDays, startOfMonth, parseISO } from 'date-fns';
import './Dashboard.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [payouts, setPayouts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [pendingPayouts, setPendingPayouts] = useState({ count: 0, latestDate: 'No pending requests' });
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const { formatCurrency } = useCurrency();
    const navigate = useNavigate();

    const handlePreset = (preset) => {
        const today = new Date();
        if (preset === 'today') {
            setStartDate(format(today, 'yyyy-MM-dd'));
            setEndDate(format(today, 'yyyy-MM-dd'));
        } else if (preset === '7days') {
            setStartDate(format(subDays(today, 7), 'yyyy-MM-dd'));
            setEndDate(format(today, 'yyyy-MM-dd'));
        } else if (preset === 'month') {
            setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
            setEndDate(format(today, 'yyyy-MM-dd'));
        } else if (preset === 'all') {
            setStartDate('');
            setEndDate('');
        }
    };

    const handleStartDateChange = (e) => {
        const newStart = e.target.value;
        if (endDate && newStart > endDate) {
            setEndDate(newStart);
        }
        setStartDate(newStart);
    };

    const handleEndDateChange = (e) => {
        const newEnd = e.target.value;
        if (startDate && newEnd < startDate) {
            setStartDate(newEnd);
        }
        setEndDate(newEnd);
    };

    const formatDateDisplay = (dateString) => {
        if (!dateString) return 'Select Date';
        try {
            return format(parseISO(dateString), 'MMM dd, yyyy');
        } catch (e) {
            return dateString;
        }
    };

    useEffect(() => {
        fetchStats();
        fetchPayouts();
        fetchTransactions();

        const handleSettingsUpdate = () => {
            fetchStats();
            fetchPayouts();
            fetchTransactions();
        };

        const handleCurrencyChanged = () => {
            fetchPayouts();
        };

        window.addEventListener('settingsUpdated', handleSettingsUpdate);
        window.addEventListener('currencyChanged', handleCurrencyChanged);

        return () => {
            window.removeEventListener('settingsUpdated', handleSettingsUpdate);
            window.removeEventListener('currencyChanged', handleCurrencyChanged);
        };
    }, [startDate, endDate]);

    const fetchStats = async () => {
        try {
            const params = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const data = await adminService.getStats(params);
            setStats(data.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch admin stats:', error);
            setLoading(false);
        }
    };

    const fetchPayouts = async () => {
        try {
            const data = await adminService.getPayoutOverview();
            // payouts state is used for some summaries, keep it for now but we'll use transactions for the grid
            setPayouts(data.data || []);

            const requestsData = await adminService.getPayoutRequests({ limit: 1 });
            const count = requestsData.pagination?.total || 0;
            const latest = requestsData.data?.[0]?.createdAt;

            let dateStr = 'No pending requests';
            if (latest) {
                const d = new Date(latest);
                dateStr = d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) + ' request';
            }
            setPendingPayouts({ count, latestDate: dateStr });
        } catch (error) {
            console.error('Failed to fetch payouts:', error);
        }
    };

    const fetchTransactions = async () => {
        try {
            const data = await adminService.getRecentTransactions({ limit: 10 });
            setTransactions(data.data || []);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        }
    };

    if (loading) return <div className="admin-loading"><div className="spinner"></div>Loading Analytics...</div>;
    if (!stats) return <div className="admin-error">Failed to load analytics</div>;

    const formatCents = (cents) => formatCurrency((cents || 0) / 100);
    const commissionPercent = stats?.platformCommissionPercent || 5;
    const kycCount = stats?.pendingKycCount || 0;
    const disputeCount = stats?.activeDisputesCount || 0;
    const prescriptionCount = stats?.pendingPrescriptions || 0;
    const totalTasks = kycCount + disputeCount + prescriptionCount;

    return (
        <div className="admin-dashboard">
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1>Analytics</h1>
                    <p>Operations and financial overview across your marketplace.</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                    <div className="admin-date-filters" style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: '10px', padding: '6px', boxShadow: '0 2px 8px rgba(16,33,23,0.03)' }}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }} className="admin-date-hover">
                            <Calendar size={15} color="#6b7280" style={{ marginRight: '8px' }} />
                            <span style={{ fontSize: '0.88rem', color: startDate ? '#1c3124' : '#9ca3af', fontWeight: 600 }}>
                                {formatDateDisplay(startDate)}
                            </span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={handleStartDateChange}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                            />
                        </div>
                        <span style={{ color: '#d1d5db', fontSize: '0.9rem', fontWeight: 600 }}>→</span>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }} className="admin-date-hover">
                            <Calendar size={15} color="#6b7280" style={{ marginRight: '8px' }} />
                            <span style={{ fontSize: '0.88rem', color: endDate ? '#1c3124' : '#9ca3af', fontWeight: 600 }}>
                                {formatDateDisplay(endDate)}
                            </span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={handleEndDateChange}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                            />
                        </div>
                        {(startDate || endDate) && (
                            <button
                                onClick={() => handlePreset('month')}
                                style={{ border: 'none', background: '#f3f4f6', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginLeft: '6px' }}
                                title="Clear to default"
                            >
                                <X size={13} color="#4b5563" />
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handlePreset('today')} className="admin-quick-chip">Today</button>
                        <button onClick={() => handlePreset('7days')} className="admin-quick-chip">Last 7 Days</button>
                        <button onClick={() => handlePreset('month')} className="admin-quick-chip">This Month</button>
                        <button onClick={() => handlePreset('all')} className="admin-quick-chip">All Time</button>
                    </div>
                </div>
            </header>

            <section className="admin-dash-cards">
                {/* ── Card 1: Action Center (Teal accent) ── */}
                <article
                    className="admin-dash-card accent-teal soft clickable-card"
                    onClick={() => navigate('/admin/vendors')}
                >
                    <div className="admin-dash-card-head">
                        <div>
                            <p className="card-label">Action Center</p>
                        </div>
                        <Bell size={16} className="card-icon" />
                    </div>

                    {totalTasks === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '8px', color: '#00A86B' }}>
                            <CheckCircle size={28} />
                            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 500, textAlign: 'center', color: '#6b7280' }}>All caught up — no pending tasks!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                            <div
                                style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer', padding: '7px 8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.02)' }}
                                onClick={(e) => { e.stopPropagation(); navigate('/admin/vendors'); }}
                            >
                                <span style={{ color: kycCount === 0 ? '#9ca3af' : '#374151', fontSize: '0.85rem' }}>🛡️ Vendors awaiting KYC</span>
                                <strong style={{ color: kycCount > 0 ? '#ef4444' : '#9ca3af', fontSize: '0.85rem' }}>{kycCount > 0 ? kycCount : '—'}</strong>
                            </div>
                            <div
                                style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer', padding: '7px 8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.02)' }}
                                onClick={(e) => { e.stopPropagation(); navigate('/admin/disputes'); }}
                            >
                                <span style={{ color: disputeCount === 0 ? '#9ca3af' : '#374151', fontSize: '0.85rem' }}>⚖️ Active disputes</span>
                                <strong style={{ color: disputeCount > 0 ? '#ef4444' : '#9ca3af', fontSize: '0.85rem' }}>{disputeCount > 0 ? disputeCount : '—'}</strong>
                            </div>
                            <div
                                style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer', padding: '7px 8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.02)' }}
                                onClick={(e) => { e.stopPropagation(); navigate('/admin/prescriptions'); }}
                            >
                                <span style={{ color: prescriptionCount === 0 ? '#9ca3af' : '#374151', fontSize: '0.85rem' }}>💊 Prescriptions pending</span>
                                <strong style={{ color: prescriptionCount > 0 ? '#ef4444' : '#9ca3af', fontSize: '0.85rem' }}>{prescriptionCount > 0 ? prescriptionCount : '—'}</strong>
                            </div>
                        </div>
                    )}
                </article>

                {/* ── Card 2: Platform Revenue (Green accent) ── */}
                <article
                    className="admin-dash-card accent-green clickable-card"
                    onClick={() => navigate('/admin/payouts')}
                >
                    <div className="admin-dash-card-head">
                        <div>
                            <p className="card-label">Platform Revenue</p>
                            <p className="card-sub">Realized profit from processed payouts</p>
                        </div>
                        <TrendingUp size={16} className="card-icon" />
                    </div>

                    <p className={`card-value ${(stats?.totalPlatformFeeCents || 0) === 0 ? 'empty' : ''}`}>
                        {formatCents(stats?.totalPlatformFeeCents || 0)}
                    </p>

                    <div style={{ width: '100%', height: '44px', marginTop: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                            <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>Fees from completed vendor payouts only</small>
                        </div>
                    </div>
                </article>

                {/* ── Card 3: Income Statistics (Blue accent) ── */}
                <article
                    className="admin-dash-card accent-blue clickable-card"
                    onClick={() => navigate('/admin/orders')}
                >
                    <div className="admin-dash-card-head">
                        <div>
                            <p className="card-label">30-Day Sales Volume</p>
                            <p className="card-sub">Rolling 30-day period</p>
                        </div>
                        <ArrowRight size={16} className="card-icon" />
                    </div>

                    <p className={`card-value ${(stats?.rolling30DayRevenueCents || 0) === 0 ? 'empty' : ''}`}>
                        {formatCents(stats?.rolling30DayRevenueCents || 0)}
                    </p>

                    <div style={{ width: '100%', height: '52px', marginTop: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'rgba(59,130,246,0.04)', borderRadius: '6px' }}>
                            <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>{stats?.rolling30DayOrderCount || 0} orders in last 30 days</small>
                        </div>
                    </div>
                </article>

                {/* ── Card 4: Prescription Verification (Promo/Violet) ── */}
                <article className="admin-dash-card promo">
                    <div className="admin-dash-card-head">
                        <p className="card-label">Prescription Verification</p>
                    </div>
                    <p className="card-value">{stats?.pendingPrescriptions || 0}</p>
                    <h4>Pending Review</h4>
                    <div className="admin-plan-actions">
                        <button className="btn-outline-teal" onClick={() => navigate('/admin/prescriptions')}>
                            View Queue →
                        </button>
                    </div>
                </article>
            </section>

            <section className="admin-dash-panel">
                <h2>Recently Payments</h2>
                <div className="admin-recent-grid">
                    {transactions.filter(t => t.type === 'PAYOUT').length > 0 ? (
                        transactions.filter(t => t.type === 'PAYOUT').slice(0, 3).map((payment) => (
                            <article key={payment.id} className="admin-recent-item">
                                <div className="avatar" />
                                <div>
                                    <strong>{payment.receiver}</strong>
                                    <small>{new Date(payment.date).toLocaleDateString()}</small>
                                </div>
                                <strong>{formatCurrency(payment.amountCents / 100)}</strong>
                                <span className={`status done`}>Paid</span>
                            </article>
                        ))
                    ) : (
                        <p className="admin-dash-muted">No recent payments found.</p>
                    )}
                </div>
            </section>

            <section className="admin-dash-panel">
                <div className="admin-panel-header">
                    <h2>Transactions</h2>
                    <div className="admin-search-inline">
                        <Search size={14} />
                        <input placeholder="Search" />
                    </div>
                </div>

                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Receiver</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Amount</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length > 0 ? (
                                transactions.map((tx) => (
                                    <tr key={tx.id}>
                                        <td>{tx.type === 'PAYOUT' ? tx.receiver : tx.sender}</td>
                                        <td>{tx.type === 'PAYOUT' ? 'Payout' : 'Customer Payment'}</td>
                                        <td>
                                            <span className={`status ${tx.status === 'COMPLETED' || tx.status === 'SUCCEEDED' ? 'done' : 'pending'}`}>
                                                {tx.status === 'COMPLETED' || tx.status === 'SUCCEEDED' ? 'Done' : tx.status}
                                            </span>
                                        </td>
                                        <td>{new Date(tx.date).toLocaleDateString()}</td>
                                        <td style={{ color: tx.type === 'PAYOUT' ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                                            {tx.type === 'PAYOUT' ? '-' : '+'}{formatCurrency(tx.amountCents / 100)}
                                        </td>
                                        <td><button className="admin-detail-btn" onClick={() => navigate(tx.type === 'PAYOUT' ? '/admin/payouts' : '/admin/orders')}>Details</button></td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>No transactions found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default AdminDashboard;