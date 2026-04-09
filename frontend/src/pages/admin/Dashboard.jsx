import React, { useEffect, useState } from 'react';
import adminService from '../../services/admin.service';
import { useCurrency } from '../../context/CurrencyContext';
import { Bell, TrendingUp, WalletCards, ArrowRight, Search } from 'lucide-react';
import './Dashboard.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const { formatCurrency } = useCurrency();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const data = await adminService.getStats();
            setStats(data.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch admin stats:', error);
            setLoading(false);
        }
    };

    if (loading) return <div className="admin-loading"><div className="spinner"></div>Loading Analytics...</div>;
    if (!stats) return <div className="admin-error">Failed to load analytics</div>;

    const formatCents = (cents) => formatCurrency((cents || 0) / 100);

    const miniTrend = [22, 30, 28, 34, 31, 42, 38, 46];

    const recentPayments = [
        { id: 'p1', name: 'Emma Ryan Jr.', date: 'Mar 9, 2023', amountCents: 482300, status: 'Done' },
        { id: 'p2', name: 'Justin Weber', date: 'Mar 2, 2023', amountCents: 393700, status: 'Pending' },
    ];

    const transactions = [
        { id: 't1', receiver: 'Emma Ryan Jr.', type: 'Salary', status: 'Pending', date: 'Feb 19th, 2023', amountCents: 389200 },
        { id: 't2', receiver: 'Adrian Daren', type: 'Bonus', status: 'Done', date: 'Feb 18th, 2023', amountCents: 107300 },
        { id: 't3', receiver: 'Roxanne Hills', type: 'Salary', status: 'Done', date: 'Apr 16th, 2023', amountCents: 279000 },
    ];

    return (
        <div className="admin-dashboard">
            <header className="page-header">
                <div>
                    <h1>Analytics</h1>
                    <p>Operations and financial overview across your marketplace.</p>
                </div>
            </header>

            <section className="admin-dash-cards">
                <article className="admin-dash-card soft">
                    <div className="admin-dash-card-head">
                        <h3>Team Payments</h3>
                        <Bell size={15} />
                    </div>
                    <p className="admin-dash-muted">07 Dec approval</p>
                    <div className="admin-member-row">
                        <div className="admin-member-dots">
                            <span />
                            <span />
                            <span />
                        </div>
                        <strong>25+</strong>
                    </div>
                </article>

                <article className="admin-dash-card soft">
                    <div className="admin-dash-card-head">
                        <h3>Savings</h3>
                        <WalletCards size={15} />
                    </div>
                    <div className="admin-mini-chart">
                        {miniTrend.map((point, index) => (
                            <span key={index} style={{ height: `${point}%` }} />
                        ))}
                    </div>
                    <p className="admin-card-amount">{formatCents(stats?.currentMonthRevenueCents || 0)}</p>
                    <div className="admin-inline-action">
                        <span className="admin-loss">-11% last week</span>
                        <button className="admin-circle-btn"><ArrowRight size={14} /></button>
                    </div>
                </article>

                <article className="admin-dash-card">
                    <h3>Income statistics</h3>
                    <div className="admin-income-bars">
                        <div><span style={{ height: '24%' }} /><label>15%</label></div>
                        <div><span style={{ height: '42%' }} /><label>21%</label></div>
                        <div><span style={{ height: '64%' }} /><label>32%</label></div>
                    </div>
                </article>

                <article className="admin-dash-card promo">
                    <p className="admin-plan-price">{formatCents((stats?.lastMonthRevenueCents || 0) / 220)}</p>
                    <p className="admin-plan-label">Per Month</p>
                    <h4>Choose Best Plan For You!</h4>
                    <div className="admin-plan-actions">
                        <button className="ghost">Details</button>
                        <button className="solid">Upgrade</button>
                    </div>
                </article>
            </section>

            <section className="admin-dash-panel">
                <h2>Recently Payments</h2>
                <div className="admin-recent-grid">
                    {recentPayments.map((payment) => (
                        <article key={payment.id} className="admin-recent-item">
                            <div className="avatar" />
                            <div>
                                <strong>{payment.name}</strong>
                                <small>{payment.date}</small>
                            </div>
                            <strong>{formatCents(payment.amountCents)}</strong>
                            <span className={`status ${payment.status.toLowerCase()}`}>{payment.status}</span>
                        </article>
                    ))}
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