import React, { useEffect, useState, useCallback } from 'react';
import adminService from '../../services/admin.service';
import { CheckCircle, XCircle, AlertCircle, RefreshCcw, Search, Clock } from 'lucide-react';
import './Vendors.css';

const STATUS_TABS = [
    { key: '', label: 'All Vendors' },
    { key: 'PENDING', label: 'Pending', icon: <Clock size={13} /> },
    { key: 'VERIFIED', label: 'Verified', icon: <CheckCircle size={13} /> },
    { key: 'REJECTED', label: 'Rejected', icon: <XCircle size={13} /> },
];

const BADGE_CLASS = {
    PENDING: 'badge-pending',
    VERIFIED: 'badge-verified',
    REJECTED: 'badge-rejected',
};

const AdminVendors = () => {
    const [vendors, setVendors] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({});
    const [activeTab, setActiveTab] = useState('PENDING');
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ totalPages: 1 });
    const [error, setError] = useState(null);

    const fetchVendors = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminService.getVendorsOverview({
                status: activeTab || undefined,
                search: search || undefined,
                page,
                limit: 20
            });
            setVendors(res.data || []);
            setSummary(res.summary || {});
            setPagination(res.pagination || { totalPages: 1 });
        } catch (err) {
            console.error('Failed to fetch vendors:', err);
            setError('Failed to load vendors. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [activeTab, search, page]);

    useEffect(() => {
        fetchVendors();
    }, [fetchVendors]);

    const handleAction = async (vendorId, status) => {
        setActionLoading(prev => ({ ...prev, [vendorId]: status }));
        try {
            await adminService.updateVendorStatus(vendorId, status);
            // Update the vendor in place without a full reload
            setVendors(prev => prev.map(v =>
                v.id === vendorId ? { ...v, verificationStatus: status } : v
            ));
            // Update the summary counts
            setSummary(prev => {
                const oldStatus = vendors.find(v => v.id === vendorId)?.verificationStatus;
                const counts = { ...(prev.statusCounts || {}) };
                if (oldStatus) counts[oldStatus] = Math.max(0, (counts[oldStatus] || 0) - 1);
                counts[status] = (counts[status] || 0) + 1;
                return { ...prev, statusCounts: counts };
            });
        } catch (err) {
            console.error(`Failed to update vendor to ${status}:`, err);
            alert(err?.response?.data?.message || 'Failed to update vendor status.');
        } finally {
            setActionLoading(prev => {
                const next = { ...prev };
                delete next[vendorId];
                return next;
            });
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(1);
    };

    return (
        <div className="admin-vendors fade-in">
            <header className="page-header">
                <div>
                    <h1>Vendor Management</h1>
                    <p>Review, approve, and manage pharmaceutical vendors</p>
                </div>
                <div className="header-stats">
                    <div className="stat-badge warning">
                        <Clock size={15} />
                        <span>{summary?.statusCounts?.PENDING || 0} Pending</span>
                    </div>
                    <div className="stat-badge success">
                        <CheckCircle size={15} />
                        <span>{summary?.statusCounts?.VERIFIED || 0} Verified</span>
                    </div>
                    <div className="stat-badge danger">
                        <XCircle size={15} />
                        <span>{summary?.statusCounts?.REJECTED || 0} Rejected</span>
                    </div>
                </div>
            </header>

            {/* Search + Tabs */}
            <div className="vendors-controls">
                <div className="status-tabs">
                    {STATUS_TABS.map(tab => (
                        <button
                            key={tab.key}
                            className={`status-tab ${activeTab === tab.key ? 'active' : ''}`}
                            onClick={() => { setActiveTab(tab.key); setPage(1); }}
                        >
                            {tab.icon && tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
                <form className="vendor-search-form" onSubmit={handleSearch}>
                    <div className="search-input-wrap">
                        <Search size={15} />
                        <input
                            type="text"
                            placeholder="Search by company, name or email..."
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn-search">Search</button>
                </form>
            </div>

            <div className="vendors-table-container glass-card">
                {error && (
                    <div className="vendors-error">
                        <AlertCircle size={18} /> {error}
                        <button onClick={fetchVendors} style={{ marginLeft: 12 }}>Retry</button>
                    </div>
                )}

                {loading ? (
                    <div className="admin-loading"><div className="spinner"></div>Loading Vendors...</div>
                ) : vendors.length === 0 ? (
                    <div className="empty-state">
                        <CheckCircle size={48} color="#22c55e" />
                        <h2>No vendors found</h2>
                        <p>
                            {activeTab === 'PENDING'
                                ? 'There are no pending vendor approvals at this time.'
                                : `No vendors match the current filter.`}
                        </p>
                    </div>
                ) : (
                    <>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Company</th>
                                    <th>Type</th>
                                    <th>Contact Person</th>
                                    <th>Licenses</th>
                                    <th>Location</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vendors.map(vendor => {
                                    const isLoading = !!actionLoading[vendor.id];
                                    const currentStatus = vendor.verificationStatus;
                                    return (
                                        <tr key={vendor.id}>
                                            <td>
                                                <div className="vendor-company">
                                                    <strong>{vendor.companyName}</strong>
                                                    <span className="vendor-email">{vendor.user?.email}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`type-badge ${(vendor.vendorType || '').toLowerCase()}`}>
                                                    {vendor.vendorType || 'N/A'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="vendor-contact">
                                                    <span>{vendor.contactPersonName}</span>
                                                    <span className="sub-text">{vendor.contactNumber}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="vendor-licenses">
                                                    <span className="license-tag" title="GSTIN Number">GST: {vendor.gstinNumber || 'N/A'}</span>
                                                    <span className="license-tag" title="Drug License">DL: {vendor.drugLicenseNumber || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="vendor-location">
                                                    <span>{vendor.state}</span>
                                                    <span className="sub-text">{vendor.country}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${BADGE_CLASS[currentStatus] || ''}`}>
                                                    {currentStatus}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    {currentStatus !== 'VERIFIED' && (
                                                        <button
                                                            className="btn-action approve"
                                                            onClick={() => handleAction(vendor.id, 'VERIFIED')}
                                                            disabled={isLoading}
                                                            title="Approve Vendor"
                                                        >
                                                            <CheckCircle size={15} />
                                                            {actionLoading[vendor.id] === 'VERIFIED' ? '...' : 'Approve'}
                                                        </button>
                                                    )}
                                                    {currentStatus !== 'REJECTED' && (
                                                        <button
                                                            className="btn-action reject"
                                                            onClick={() => handleAction(vendor.id, 'REJECTED')}
                                                            disabled={isLoading}
                                                            title="Reject Vendor"
                                                        >
                                                            <XCircle size={15} />
                                                            {actionLoading[vendor.id] === 'REJECTED' ? '...' : 'Reject'}
                                                        </button>
                                                    )}
                                                    {currentStatus !== 'PENDING' && (
                                                        <button
                                                            className="btn-action revert"
                                                            onClick={() => handleAction(vendor.id, 'PENDING')}
                                                            disabled={isLoading}
                                                            title="Revert to Pending"
                                                        >
                                                            <RefreshCcw size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="vendors-pagination">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="btn-page"
                                >← Prev</button>
                                <span>Page {page} of {pagination.totalPages}</span>
                                <button
                                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                    disabled={page >= pagination.totalPages}
                                    className="btn-page"
                                >Next →</button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminVendors;
