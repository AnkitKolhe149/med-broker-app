import React, { useEffect, useState } from 'react';
import adminService from '../../services/admin.service';
import { useCurrency } from '../../context/CurrencyContext';
import './AdminOperations.css';

const AdminDisputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const { formatCurrency } = useCurrency();

  useEffect(() => {
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

    load();
  }, [statusFilter]);

  if (loading) return <div className="admin-loading"><div className="spinner"></div>Loading disputes...</div>;

  return (
    <section className="admin-ops-page">
      <header className="page-header">
        <div>
          <h1>Dispute Management</h1>
          <p>Cases derived from payment failures, refunds, and cancellation conflicts.</p>
        </div>
      </header>

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
            </tr>
          </thead>
          <tbody>
            {disputes.map((dispute) => (
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AdminDisputes;
