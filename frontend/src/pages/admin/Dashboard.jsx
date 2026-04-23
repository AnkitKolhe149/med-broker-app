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

    if (loading) return <div className="admin-loading"><div className="spinner"></div>Loading Analytics...</div>;
    if (!stats) return <div className="admin-error">Failed to load analytics</div>;

    const formatCents = (cents) => formatCurrency((cents || 0) / 100);
    const platformCommission = (stats?.totalRevenueCents || 0) * 0.05;
    const kycCount = stats?.pendingKycCount || 0;
    const disputeCount = stats?.activeDisputesCount || 0;
    const prescriptionCount = stats?.pendingPrescriptions || 0;
    const totalTasks = kycCount + disputeCount + prescriptionCount;

    const transactions = [
        { id: 't1', receiver: 'Emma Ryan Jr.', type: 'Salary', status: 'Pending', date: 'Feb 19th, 2023', amountCents: 389200 },
        { id: 't2', receiver: 'Adrian Daren', type: 'Bonus', status: 'Done', date: 'Feb 18th, 2023', amountCents: 107300 },
        { id: 't3', receiver: 'Roxanne Hills', type: 'Salary', status: 'Done', date: 'Apr 16th, 2023', amountCents: 279000 },
    ];

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
                <article 
                    className="admin-dash-card soft clickable-card" 
                    onClick={() => navigate('/admin/vendors')} 
                    style={{ cursor: 'pointer' }}
                >
                    <div className="admin-dash-card-head">
                        <h3>Action Center</h3>
                        <Bell size={15} />
                    </div>
                    {totalTasks === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '20px 0', gap: '10px', color: 'var(--success, #10b981)' }}>
                            <CheckCircle size={32} />
                            <p style={{ margin: 0, fontWeight: 500, textAlign: 'center' }}>No pending tasks – you're all caught up!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                            <div 
                                style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer', padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.6)' }}
                                onClick={(e) => { e.stopPropagation(); navigate('/admin/vendors'); }}
                            >
                                <span style={{ color: kycCount === 0 ? 'var(--text-muted, #6b7280)' : 'inherit', fontSize: '0.9rem' }}>🛡️ Vendors awaiting verification</span>
                                <strong style={{ color: kycCount > 0 ? 'var(--error, #ef4444)' : 'var(--text-muted, #6b7280)' }}>{kycCount}</strong>
                            </div>
                            <div 
                                style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer', padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.6)' }}
                                onClick={(e) => { e.stopPropagation(); navigate('/admin/disputes'); }}
                            >
                                <span style={{ color: disputeCount === 0 ? 'var(--text-muted, #6b7280)' : 'inherit', fontSize: '0.9rem' }}>⚖️ Unresolved customer disputes</span>
                                <strong style={{ color: disputeCount > 0 ? 'var(--error, #ef4444)' : 'var(--text-muted, #6b7280)' }}>{disputeCount}</strong>
                            </div>
                            <div 
                                style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer', padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.6)' }}
                                onClick={(e) => { e.stopPropagation(); navigate('/admin/prescriptions'); }}
                            >
                                <span style={{ color: prescriptionCount === 0 ? 'var(--text-muted, #6b7280)' : 'inherit', fontSize: '0.9rem' }}>💊 Prescriptions to be verified</span>
                                <strong style={{ color: prescriptionCount > 0 ? 'var(--error, #ef4444)' : 'var(--text-muted, #6b7280)' }}>{prescriptionCount}</strong>
                            </div>
                        </div>
                    )}
                </article>

                <article 
                    className="admin-dash-card soft clickable-card" 
                    onClick={() => navigate('/admin/payouts')} 
                    style={{ cursor: 'pointer' }}
                >
                    <div className="admin-dash-card-head">
                        <h3>Platform Revenue</h3>
                    </div>
                    <div style={{ width: '100%', height: '40px', marginTop: '10px' }}>
                        {stats?.dailyRevenue && stats.dailyRevenue.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats.dailyRevenue}>
                                    <Line type="monotone" dataKey={(d) => (d.revenueCents || 0) * 0.05} stroke="var(--primary, #157347)" strokeWidth={2} dot={false} isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
                                <small>No data for this period</small>
                            </div>
                        )}
                    </div>
                    <p className="admin-card-amount" style={{ marginTop: '10px' }}>{formatCents(platformCommission)}</p>
                    <div className="admin-inline-action">
                        {stats?.revenueGrowth && <span className="admin-loss">{stats.revenueGrowth}</span>}
                    </div>
                </article>

                <article 
                    className="admin-dash-card clickable-card" 
                    onClick={() => navigate('/admin/orders')} 
                    style={{ cursor: 'pointer' }}
                >
                    <h3>Income statistics</h3>
                    <p className="admin-card-amount" style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>
                        {formatCents(stats?.totalRevenueCents || 0)}
                    </p>
                    <p className="admin-dash-muted" style={{ marginBottom: '10px' }}>Total processed revenue</p>
                    <div style={{ width: '100%', height: '60px' }}>
                        {stats?.dailyRevenue && stats.dailyRevenue.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats.dailyRevenue}>
                                    <Line type="monotone" dataKey="revenueCents" stroke="var(--primary, #157347)" strokeWidth={2} dot={false} isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '4px', color: 'var(--text-muted)' }}>
                                <small>No data for this period</small>
                            </div>
                        )}
                    </div>
                </article>

                <article className="admin-dash-card promo">
                    <p className="admin-plan-price" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{stats?.pendingPrescriptions || 0}</p>
                    <p className="admin-plan-label">Pending Review</p>
                    <h4>Prescription Verification</h4>
                    <div className="admin-plan-actions">
                        <button className="ghost" onClick={() => navigate('/admin/prescriptions')}>Details</button>
                    </div>
                </article>
            </section>

            <section className="admin-dash-panel">
                <h2>Recently Payments</h2>
                <div className="admin-recent-grid">
                    {payouts.length > 0 ? (
                        payouts.slice(0, 3).map((payment) => (
                            <article key={payment.vendorId || payment.id} className="admin-recent-item">
                                <div className="avatar" />
                                <div>
                                    <strong>{payment.vendor?.businessName || payment.companyName || 'Vendor'}</strong>
                                    <small>{payment.contactPersonName || 'Details'}</small>
                                </div>
                                <strong>{(((payment.amountCents || payment.totalPaidCents || 0) * 0.95) / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</strong>
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
                            {transactions.map((txn) => (
                                <tr key={txn.id}>
                                    <td>{txn.receiver}</td>
                                    <td>{txn.type}</td>
                                    <td>
                                        <span className={`status ${txn.status.toLowerCase()}`}>{txn.status}</span>
                                    </td>
                                    <td>{txn.date}</td>
                                    <td>{formatCents(txn.amountCents)}</td>
                                    <td><button className="admin-detail-btn">Details</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default AdminDashboard;