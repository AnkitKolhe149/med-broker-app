import React, { useEffect, useState } from 'react';
import adminService from '../../services/admin.service';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import './Vendors.css';

const AdminVendors = () => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            const data = await adminService.getPendingVendors();
            setVendors(data.data || []);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch vendors:', error);
            setLoading(false);
        }
    };

    const handleAction = async (vendorId, status) => {
        try {
            await adminService.updateVendorStatus(vendorId, status);
            // Remove the vendor from the list after acting on it
            setVendors(vendors.filter(v => v.id !== vendorId));
        } catch (error) {
            console.error(`Failed to update vendor to ${status}:`, error);
            alert('Failed to update vendor status.');
        }
    };

    if (loading) return <div className="admin-loading"><div className="spinner"></div>Loading Vendors...</div>;

    return (
        <div className="admin-vendors fade-in">
            <header className="page-header">
                <div>
                    <h1>Vendor Approvals</h1>
                    <p>Review and verify pending pharmaceutical distributors and manufacturers</p>
                </div>
                <div className="header-stats">
                    <div className="stat-badge warning">
                        <AlertCircle size={16} />
                        <span>{vendors.length} Pending</span>
                    </div>
                </div>
            </header>

            <div className="vendors-table-container glass-card">
                {vendors.length === 0 ? (
                    <div className="empty-state">
                        <CheckCircle size={48} color="#22c55e" />
                        <h2>All Caught Up!</h2>
                        <p>There are no pending vendor approvals at this time.</p>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Company</th>
                                <th>Type</th>
                                <th>Contact</th>
                                <th>Licenses</th>
                                <th>Location</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendors.map(vendor => (
                                <tr key={vendor.id}>
                                    <td>
                                        <div className="vendor-company">
                                            <strong>{vendor.companyName}</strong>
                                            <span className="vendor-email">{vendor.user?.email}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`type-badge ${(vendor.vendorType || '').toLowerCase()}`}>
                                            {vendor.vendorType || 'Unknown'}
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
                                            <span className="license-tag" title="GSTIN Number">GST: {vendor.gstinNumber}</span>
                                            <span className="license-tag" title="Drug License">DL: {vendor.drugLicenseNumber}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="vendor-location">
                                            <span>{vendor.state}</span>
                                            <span className="sub-text">{vendor.country}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button 
                                                className="btn-action approve"
                                                onClick={() => handleAction(vendor.id, 'VERIFIED')}
                                                title="Approve Vendor"
                                            >
                                                <CheckCircle size={18} /> Approve
                                            </button>
                                            <button 
                                                className="btn-action reject"
                                                onClick={() => handleAction(vendor.id, 'REJECTED')}
                                                title="Reject Vendor"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </div>
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

export default AdminVendors;
