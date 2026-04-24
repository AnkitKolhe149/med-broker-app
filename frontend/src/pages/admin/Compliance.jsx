import React, { useEffect, useState } from 'react';
import adminService from '../../services/admin.service';
import './AdminOperations.css';

const AdminCompliance = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  const load = async () => {
    try {
      setLoading(true);
      const response = await adminService.getComplianceOverview();
      setData(response?.data || null);
    } catch (error) {
      console.error('Failed to load compliance overview', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleVerifyKyc = async (doc) => {
    if (!window.confirm(`Verify KYC document "${doc.type}" for ${doc.vendor?.companyName || 'this vendor'}?`)) return;
    setActionLoading((p) => ({ ...p, [doc.id]: true }));
    try {
      await adminService.verifyKycDocument(doc.id, 'VERIFIED');
      setData((prev) => ({
        ...prev,
        kycDocs: prev.kycDocs.map((d) =>
          d.id === doc.id ? { ...d, status: 'VERIFIED', verifiedAt: new Date().toISOString() } : d
        ),
        summary: {
          ...prev.summary,
          pendingKyc: Math.max(0, (prev.summary?.pendingKyc || 1) - 1),
        },
      }));
    } catch (e) {
      alert(e?.response?.data?.message || 'Verification failed.');
    } finally {
      setActionLoading((p) => ({ ...p, [doc.id]: false }));
    }
  };

  if (loading) return <div className="admin-loading"><div className="spinner"></div>Loading compliance data...</div>;
  if (!data) return <div className="admin-error">Failed to load compliance overview.</div>;

  return (
    <section className="admin-ops-page">
      <header className="page-header">
        <div>
          <h1>Compliance &amp; Audit</h1>
          <p>Review KYC, prescription controls, return risk, and audit activity from one console.</p>
        </div>
      </header>

      <div className="admin-ops-summary">
        <div className="admin-ops-summary-card"><h4>Pending KYC</h4><p>{data.summary?.pendingKyc || 0}</p></div>
        <div className="admin-ops-summary-card"><h4>Pending Prescriptions</h4><p>{data.summary?.pendingPrescriptions || 0}</p></div>
        <div className="admin-ops-summary-card"><h4>Open Disputes</h4><p>{data.summary?.openDisputes || 0}</p></div>
        <div className="admin-ops-summary-card"><h4>Open Returns</h4><p>{data.summary?.openReturns || 0}</p></div>
      </div>

      <div className="admin-ops-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>KYC Type</th>
              <th>Vendor</th>
              <th>Status</th>
              <th>Verified At</th>
              <th>Expiry</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data.kycDocs || []).slice(0, 15).map((doc) => (
              <tr key={doc.id}>
                <td>{doc.type}</td>
                <td>{doc.vendor?.companyName || '-'}</td>
                <td><span className={`admin-pill ${String(doc.status || '').toLowerCase()}`}>{doc.status}</span></td>
                <td>{doc.verifiedAt ? new Date(doc.verifiedAt).toLocaleDateString() : '-'}</td>
                <td>{doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : '-'}</td>
                <td>
                  <button
                    id={`kyc-verify-${doc.id}`}
                    className="btn btn-success"
                    disabled={doc.status === 'VERIFIED' || !!actionLoading[doc.id]}
                    onClick={() => handleVerifyKyc(doc)}
                  >
                    {actionLoading[doc.id] ? <span className="btn-spinner" /> : (doc.status === 'VERIFIED' ? 'Verified ✓' : 'Verify KYC')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AdminCompliance;
