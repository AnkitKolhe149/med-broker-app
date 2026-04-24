import React, { useEffect, useState } from 'react';
import adminService from '../../services/admin.service';
import './AdminOperations.css';

const AdminPrescriptions = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  const load = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPrescriptionQueue({ limit: 30 });
      setQueue(response?.data || []);
    } catch (error) {
      console.error('Failed to load prescription queue', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    if (newStatus === 'REJECTED') {
      if (!window.confirm('Reject this prescription? The customer will be notified.')) return;
    }
    const key = `${orderId}-${newStatus}`;
    setActionLoading((p) => ({ ...p, [key]: true }));
    try {
      await adminService.updatePrescriptionStatus(orderId, newStatus);
      setQueue((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (e) {
      alert(e?.response?.data?.message || 'Action failed. Please try again.');
    } finally {
      setActionLoading((p) => ({ ...p, [key]: false }));
    }
  };

  if (loading) return <div className="admin-loading"><div className="spinner"></div>Loading prescription queue...</div>;

  return (
    <section className="admin-ops-page">
      <header className="page-header">
        <div>
          <h1>Prescription Verification</h1>
          <p>Orders containing Rx medicines requiring operational verification.</p>
        </div>
      </header>

      <div className="admin-ops-summary">
        <div className="admin-ops-summary-card"><h4>Queue Size</h4><p>{queue.length}</p></div>
        <div className="admin-ops-summary-card"><h4>Pending</h4><p>{queue.filter((o) => o.status === 'PENDING').length}</p></div>
        <div className="admin-ops-summary-card"><h4>Approved</h4><p>{queue.filter((o) => o.status === 'APPROVED').length}</p></div>
        <div className="admin-ops-summary-card"><h4>Rejected</h4><p>{queue.filter((o) => o.status === 'REJECTED').length}</p></div>
      </div>

      <div className="admin-ops-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Rx Medicines</th>
              <th>Order Status</th>
              <th>Payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {queue.length === 0 ? (
              <tr><td colSpan="6" className="admin-muted">No prescription orders in queue.</td></tr>
            ) : queue.map((order) => {
              const rxItems = (order.items || []).filter((i) => i?.medicine?.requiresPrescription);
              const isPending = order.status === 'PENDING';
              const approveKey = `${order.id}-APPROVED`;
              const rejectKey = `${order.id}-REJECTED`;
              return (
                <tr key={order.id}>
                  <td>
                    <strong>{order.id.slice(0, 8)}</strong>
                    <div className="admin-muted">{new Date(order.createdAt).toLocaleString()}</div>
                  </td>
                  <td>{order.user?.name || order.user?.email || 'Customer'}</td>
                  <td>{rxItems.map((i) => i.medicine?.name).filter(Boolean).join(', ') || 'N/A'}</td>
                  <td><span className={`admin-pill ${String(order.status || '').toLowerCase()}`}>{order.status}</span></td>
                  <td><span className={`admin-pill ${String(order.payment?.status || 'INITIATED').toLowerCase()}`}>{order.payment?.status || 'INITIATED'}</span></td>
                  <td>
                    <div className="admin-ops-actions">
                      <button
                        id={`rx-approve-${order.id}`}
                        className="btn btn-success"
                        disabled={!isPending || !!actionLoading[approveKey]}
                        onClick={() => handleStatusChange(order.id, 'APPROVED')}
                      >
                        {actionLoading[approveKey] ? <span className="btn-spinner" /> : 'Approve'}
                      </button>
                      <button
                        id={`rx-reject-${order.id}`}
                        className="btn btn-danger"
                        disabled={!isPending || !!actionLoading[rejectKey]}
                        onClick={() => handleStatusChange(order.id, 'REJECTED')}
                      >
                        {actionLoading[rejectKey] ? <span className="btn-spinner" /> : 'Reject'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AdminPrescriptions;
