import React, { useEffect, useState } from 'react';
import adminService from '../../services/admin.service';
import './AdminOperations.css';

const AdminNotifications = () => {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ total: 0, unread: 0, read: 0, typeBreakdown: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markAllLoading, setMarkAllLoading] = useState(false);
  const [clearAllLoading, setClearAllLoading] = useState(false);
  const [rowLoading, setRowLoading] = useState({});

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

  useEffect(() => { load(); }, []);

  // Mark a single notification as read (optimistic)
  const handleMarkRead = async (item) => {
    if (item.isRead) return;
    setRowLoading((p) => ({ ...p, [item.id]: true }));
    try {
      await adminService.markNotificationRead(item.id);
      setItems((prev) => prev.map((n) => n.id === item.id ? { ...n, isRead: true } : n));
      setSummary((prev) => ({
        ...prev,
        unread: Math.max(0, (prev.unread || 1) - 1),
        read: (prev.read || 0) + 1,
      }));
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to mark as read.');
    } finally {
      setRowLoading((p) => ({ ...p, [item.id]: false }));
    }
  };

  // Mark ALL unread as read
  const handleMarkAllRead = async () => {
    const unreadIds = items.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setMarkAllLoading(true);
    try {
      await adminService.markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setSummary((prev) => ({ ...prev, unread: 0, read: prev.total }));
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to mark all as read.');
    } finally {
      setMarkAllLoading(false);
    }
  };

  // Clear all (delete/archive) notifications
  const handleClearAll = async () => {
    if (!window.confirm('Clear all notifications? This cannot be undone.')) return;
    setClearAllLoading(true);
    try {
      await adminService.clearAllNotifications();
      setItems([]);
      setSummary({ total: 0, unread: 0, read: 0, typeBreakdown: {} });
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to clear notifications.');
    } finally {
      setClearAllLoading(false);
    }
  };

  if (loading) return <div className="admin-loading"><div className="spinner"></div>Loading notifications...</div>;
  if (error) return <div className="admin-error">{error}</div>;

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <section className="admin-ops-page">
      <header className="page-header">
        <div>
          <h1>Notification Center</h1>
          <p>Track channel activity and unread operational alerts across all user roles.</p>
        </div>
        <div className="admin-ops-actions" style={{ marginLeft: 'auto' }}>
          <button
            id="notifications-mark-all-read"
            className="btn btn-secondary"
            disabled={unreadCount === 0 || markAllLoading}
            onClick={handleMarkAllRead}
          >
            {markAllLoading ? <span className="btn-spinner" /> : null}
            Mark All Read {unreadCount > 0 ? `(${unreadCount})` : ''}
          </button>
          <button
            id="notifications-clear-all"
            className="btn btn-danger"
            disabled={items.length === 0 || clearAllLoading}
            onClick={handleClearAll}
          >
            {clearAllLoading ? <span className="btn-spinner" /> : null}
            Clear All
          </button>
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan="7" className="admin-muted">No notifications found.</td></tr>
            ) : items.map((item) => (
              <tr key={item.id} className={!item.isRead ? 'admin-row-unread' : ''}>
                <td>
                  <strong>{item.title}</strong>
                  <div className="admin-muted">{item.body}</div>
                </td>
                <td>{item.user?.email || '-'}</td>
                <td>{item.type}</td>
                <td>{item.channel}</td>
                <td>
                  <span className={`admin-pill ${item.isRead ? 'succeeded' : 'pending'}`}>
                    {item.isRead ? 'READ' : 'UNREAD'}
                  </span>
                </td>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
                <td>
                  <button
                    id={`notif-read-${item.id}`}
                    className="btn btn-secondary"
                    disabled={item.isRead || !!rowLoading[item.id]}
                    onClick={() => handleMarkRead(item)}
                  >
                    {rowLoading[item.id] ? <span className="btn-spinner" /> : (item.isRead ? 'Read ✓' : 'Mark Read')}
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

export default AdminNotifications;
