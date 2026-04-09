import React, { useEffect, useState } from 'react';
import adminService from '../../services/admin.service';
import './AdminOperations.css';

const AdminPrescriptions = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    load();
  }, []);

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
        <div className="admin-ops-summary-card">
          <h4>Queue Size</h4>
          <p>{queue.length}</p>
        </div>
        <div className="admin-ops-summary-card">
          <h4>Pending Orders</h4>
          <p>{queue.filter((order) => order.status === 'PENDING').length}</p>
        </div>
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
            </tr>
          </thead>
          <tbody>
            {queue.map((order) => {
              const rxItems = (order.items || []).filter((item) => item?.medicine?.requiresPrescription);
              return (
                <tr key={order.id}>
                  <td>
                    <strong>{order.id.slice(0, 8)}</strong>
                    <div className="admin-muted">{new Date(order.createdAt).toLocaleString()}</div>
                  </td>
                  <td>{order.user?.name || order.user?.email || 'Customer'}</td>
                  <td>{rxItems.map((item) => item.medicine?.name).filter(Boolean).join(', ') || 'N/A'}</td>
                  <td><span className={`admin-pill ${String(order.status || '').toLowerCase()}`}>{order.status}</span></td>
                  <td><span className={`admin-pill ${String(order.payment?.status || 'INITIATED').toLowerCase()}`}>{order.payment?.status || 'INITIATED'}</span></td>
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
