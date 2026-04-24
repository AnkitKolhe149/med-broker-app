import React, { useEffect, useState } from 'react';
import adminService from '../../services/admin.service';
import { useCurrency } from '../../context/CurrencyContext';
import './AdminOperations.css';

const AdminReturnsRefunds = () => {
  const [refunds, setRefunds] = useState([]);
  const [summary, setSummary] = useState({ total: 0, succeeded: 0, refunded: 0, initiated: 0 });
  const [loading, setLoading] = useState(true);
  const [processingOrderId, setProcessingOrderId] = useState(null);
  const { formatCurrency } = useCurrency();

  const loadRefunds = async () => {
    try {
      setLoading(true);
      const response = await adminService.getRefundCenter({ limit: 30 });
      setRefunds(response?.data || []);
      setSummary(response?.summary || { total: 0, succeeded: 0, refunded: 0, initiated: 0 });
    } catch (error) {
      console.error('Failed to load refund center', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRefunds();
  }, []);

  const handleRefund = async (payment) => {
    try {
      setProcessingOrderId(payment.orderId);
      await adminService.processRefund({
        orderId: payment.orderId,
        reason: 'Admin approved refund',
        amount: payment.amountCents
      });
      await loadRefunds();
    } catch (error) {
      console.error('Failed to process refund', error);
      alert(error?.response?.data?.message || 'Failed to process refund');
    } finally {
      setProcessingOrderId(null);
    }
  };

  if (loading) return <div className="admin-loading"><div className="spinner"></div>Loading refund center...</div>;

  return (
    <section className="admin-ops-page">
      <header className="page-header">
        <div>
          <h1>Returns & Refunds</h1>
          <p>Process refunds and monitor payment recovery lifecycle.</p>
        </div>
      </header>

      <div className="admin-ops-summary">
        <div className="admin-ops-summary-card"><h4>Total Payments</h4><p>{summary.total}</p></div>
        <div className="admin-ops-summary-card"><h4>Succeeded</h4><p>{summary.succeeded}</p></div>
        <div className="admin-ops-summary-card"><h4>Refunded</h4><p>{summary.refunded}</p></div>
        <div className="admin-ops-summary-card"><h4>Initiated</h4><p>{summary.initiated}</p></div>
      </div>

      <div className="admin-ops-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Payment</th>
              <th>Order</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {refunds.map((payment) => (
              <tr key={payment.id}>
                <td>
                  <strong>{payment.id.slice(0, 8)}</strong>
                  <div className="admin-muted">{payment.provider}</div>
                </td>
                <td>{payment.orderId?.slice(0, 8)}</td>
                <td>{payment.order?.user?.name || payment.order?.user?.email || 'Customer'}</td>
                <td><span className={`admin-pill ${String(payment.status || '').toLowerCase()}`}>{payment.status}</span></td>
                <td>{formatCurrency((payment.amountCents || 0) / 100)}</td>
                <td>
                  <button
                    className="btn btn-secondary"
                    disabled={!payment.canRefund || processingOrderId === payment.orderId}
                    onClick={() => handleRefund(payment)}
                  >
                    {processingOrderId === payment.orderId ? 'Processing...' : 'Process Refund'}
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

export default AdminReturnsRefunds;
