import React, { useEffect, useState } from 'react';
import adminService from '../../services/admin.service';
import { useCurrency } from '../../context/CurrencyContext';
import './AdminOperations.css';

const AdminDisputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [resolveLoading, setResolveLoading] = useState({});
  const { formatCurrency } = useCurrency();

  const load = async () => {
    try {
      setLoading(true);
      const response = await adminService.getDisputes({ status: statusFilter || undefined, limit: 30 });
      setDisputes(response?.data || []);
    } catch (error) {
      console.error('Failed to load disputes', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleResolve = async (dispute) => {
    if (!window.confirm(`Resolve dispute ${dispute.id.slice(0, 12)}? This action cannot be undone.`)) return;
    const resolution = window.prompt('Enter resolution note (optional):') ?? '';
    setResolveLoading((p) => ({ ...p, [dispute.id]: true }));
    try {
      await adminService.resolveDispute(dispute.id, resolution);
      setDisputes((prev) =>
        prev.map((d) => (d.id === dispute.id ? { ...d, status: 'RESOLVED', resolution } : d))
      );
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to resolve dispute.');
    } finally {
      setResolveLoading((p) => ({ ...p, [dispute.id]: false }));
    }
  };

  if (loading) return <div className="admin-loading"><div className="spinner"></div>Loading disputes...</div>;

  const openCount = disputes.filter((d) => d.status === 'OPEN').length;
  const resolvedCount = disputes.filter((d) => d.status === 'RESOLVED').length;

  return (
    <section className="admin-ops-page">
      <header className="page-header">
        <div>
          <h1>Dispute Management</h1>
          <p>Cases derived from payment failures, refunds, and cancellation conflicts.</p>
        </div>
      </header>

      <div className="admin-ops-summary">
        <div className="admin-ops-summary-card"><h4>Total Cases</h4><p>{disputes.length}</p></div>
        <div className="admin-ops-summary-card"><h4>Open</h4><p>{openCount}</p></div>
        <div className="admin-ops-summary-card"><h4>Resolved</h4><p>{resolvedCount}</p></div>
      </div>

      <div className="admin-ops-toolbar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All cases</option>
          <option value="OPEN">Open</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      <div className="admin-ops-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Case</th>
              <th>Order</th>
              <th>Customer</th>
              <th>Category</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {disputes.length === 0 ? (
              <tr><td colSpan="8" className="admin-muted">No disputes found for current filter.</td></tr>
            ) : disputes.map((dispute) => (
              <tr key={dispute.id}>
                <td>
                  <strong>{dispute.id.slice(0, 12)}</strong>
                  <div className="admin-muted">{new Date(dispute.createdAt).toLocaleDateString()}</div>
                </td>
                <td>{dispute.orderId.slice(0, 8)}</td>
                <td>{dispute.user?.name || dispute.user?.email || 'Customer'}</td>
                <td>{dispute.category}</td>
                <td><span className={`admin-pill ${String(dispute.status || '').toLowerCase()}`}>{dispute.status}</span></td>
                <td>{formatCurrency((dispute.amountCents || 0) / 100)}</td>
                <td>{dispute.reason}</td>
                <td>
                  <button
                    id={`dispute-resolve-${dispute.id}`}
                    className="btn btn-primary"
                    disabled={dispute.status === 'RESOLVED' || !!resolveLoading[dispute.id]}
                    onClick={() => handleResolve(dispute)}
                  >
                    {resolveLoading[dispute.id]
                      ? <span className="btn-spinner" />
                      : (dispute.status === 'RESOLVED' ? 'Resolved ✓' : 'Resolve Dispute')}
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

export default AdminDisputes;
