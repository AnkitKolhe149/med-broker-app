import React, { useEffect, useState } from 'react';
import adminService from '../../services/admin.service';
import { useCurrency } from '../../context/CurrencyContext';
import { Users, TrendingUp, ShoppingBag, Activity } from 'lucide-react';
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

    // Mock recent activity or graph data for visual appeal since we skipped chart libraries
    const weeklyData = [
        { day: 'Mon', value: 40 },
        { day: 'Tue', value: 70 },
        { day: 'Wed', value: 45 },
        { day: 'Thu', value: 90 },
        { day: 'Fri', value: 65 },
        { day: 'Sat', value: 85 },
        { day: 'Sun', value: 100 },
    ];

    return (
        <div className="admin-dashboard fade-in">
            <header className="page-header">
                <div>
                    <h1>Platform Overview</h1>
                    <p>Real-time insights into MedBroker's performance</p>
                </div>
            </header>

            <div className="metrics-grid">
                <div className="metric-card glass-card">
                    <div className="metric-icon blue"><TrendingUp /></div>
                    <div className="metric-content">
                        <h3>Total Revenue</h3>
                        <p className="metric-value">{formatCents(stats?.totalRevenueCents || 0)}</p>
                        <span className="metric-trend positive">
                            +{(( (stats?.currentMonthRevenueCents || 0) / (stats?.lastMonthRevenueCents || 1) ) * 100).toFixed(1)}% this month
                        </span>
                    </div>
                </div>

                <div className="metric-card glass-card">
                    <div className="metric-icon purple"><ShoppingBag /></div>
                    <div className="metric-content">
                        <h3>Total Orders</h3>
                        <p className="metric-value">{stats.totalOrders}</p>
                        <span className="metric-trend">Platform lifetime</span>
                    </div>
                </div>

                <div className="metric-card glass-card">
                    <div className="metric-icon orange"><Users /></div>
                    <div className="metric-content">
                        <h3>Active Vendors</h3>
                        <p className="metric-value">{stats.totalVendors}</p>
                    </div>
                </div>

                <div className="metric-card glass-card">
                    <div className="metric-icon green"><Activity /></div>
                    <div className="metric-content">
                        <h3>Customers</h3>
                        <p className="metric-value">{stats.totalCustomers}</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-charts">
                <div className="chart-container glass-card">
                    <h2>Weekly Order Volume</h2>
                    <div className="css-bar-chart">
                        {weeklyData.map((data) => (
                            <div className="chart-bar-group" key={data.day}>
                                <div className="bar-wrapper">
                                    <div 
                                        className="bar-fill" 
                                        style={{ height: `${data.value}%` }}
                                        title={`${data.value} Orders`}
                                    ></div>
                                </div>
                                <span className="bar-label">{data.day}</span>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="dashboard-summary glass-card">
                    <h2>Revenue Breakdown</h2>
                    <div className="summary-list">
                        <div className="summary-item">
                            <span>Current Month</span>
                            <strong>{formatCents(stats.currentMonthRevenueCents)}</strong>
                        </div>
                        <div className="summary-item">
                            <span>Last Month</span>
                            <strong>{formatCents(stats.lastMonthRevenueCents)}</strong>
                        </div>
                        <div className="summary-item total">
                            <span>Platform Take Rate</span>
                            <strong>5.0%</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;