import React, { useEffect, useState } from 'react';
import adminService from '../../services/admin.service';
import './AdminOperations.css';

const AdminNotifications = () => {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ total: 0, unread: 0, read: 0, typeBreakdown: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await adminService.getNotificationsOverview({ limit: 40 });
        setItems(response?.data || []);
        setSummary(response?.summary || { total: 0, unread: 0, read: 0, typeBreakdown: {} });
      } catch (error) {
        console.error('Failed to load notifications overview', error);
        setError('Unable to fetch notifications right now.');
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <div className="admin-loading"><div className="spinner"></div>Loading notifications...</div>;
  if (error) return <div className="admin-error">{error}</div>;

  return (
    <section className="admin-ops-page">
      <header className="page-header">
        <div>
          <h1>Notification Center</h1>
          <p>Track channel activity and unread operational alerts across all user roles.</p>
        </div>
      </header>

      <div className="admin-ops-summary">
        <div className="admin-ops-summary-card"><h4>Total</h4><p>{summary.total || 0}</p></div>
        <div className="admin-ops-summary-card"><h4>Unread</h4><p>{summary.unread || 0}</p></div>
        <div className="admin-ops-summary-card"><h4>Read</h4><p>{summary.read || 0}</p></div>
        <div className="admin-ops-summary-card"><h4>Types</h4><p>{Object.keys(summary.typeBreakdown || {}).length}</p></div>
      </div>

      <div className="admin-ops-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>User</th>
              <th>Type</th>
              <th>Channel</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="6" className="admin-muted">No notifications found.</td>
              </tr>
            ) : items.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.title}</strong>
                  <div className="admin-muted">{item.body}</div>
                </td>
                <td>{item.user?.email || '-'}</td>
                <td>{item.type}</td>
                <td>{item.channel}</td>
                <td><span className={`admin-pill ${item.isRead ? 'succeeded' : 'pending'}`}>{item.isRead ? 'READ' : 'UNREAD'}</span></td>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AdminNotifications;
