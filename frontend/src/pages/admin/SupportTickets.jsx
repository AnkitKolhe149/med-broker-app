import React, { useEffect, useState } from 'react';
import adminService from '../../services/admin.service';
import AdminPagination from '../../components/common/AdminPagination';
import './AdminOperations.css';

const AdminSupportTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [summary, setSummary] = useState({ total: 0, statusCounts: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await adminService.getSupportTicketsOverview({
          status: status || undefined,
          page: currentPage,
          limit: pageSize
        });
        setTickets(response?.data || []);
        setSummary(response?.summary || { total: 0, statusCounts: {} });
        setPagination(response?.pagination || { page: currentPage, limit: pageSize, total: 0, totalPages: 1 });
      } catch (error) {
        console.error('Failed to load support tickets', error);
        setError('Unable to fetch support tickets right now.');
        setTickets([]);
        setPagination({ page: currentPage, limit: pageSize, total: 0, totalPages: 1 });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [status, currentPage, pageSize]);

  if (loading) return <div className="admin-loading"><div className="spinner"></div>Loading support tickets...</div>;
  if (error) return <div className="admin-error">{error}</div>;

  return (
    <section className="admin-ops-page">
      <header className="page-header">
        <div>
          <h1>Support Tickets</h1>
          <p>Prioritize ticket flow, assignment status, and SLA-sensitive workloads.</p>
        </div>
      </header>

      <div className="admin-ops-summary">
        <div className="admin-ops-summary-card"><h4>Total Tickets</h4><p>{summary.total || 0}</p></div>
        <div className="admin-ops-summary-card"><h4>Open</h4><p>{summary.statusCounts?.OPEN || 0}</p></div>
        <div className="admin-ops-summary-card"><h4>In Progress</h4><p>{summary.statusCounts?.IN_PROGRESS || 0}</p></div>
        <div className="admin-ops-summary-card"><h4>Resolved</h4><p>{summary.statusCounts?.RESOLVED || 0}</p></div>
      </div>

      <div className="admin-ops-toolbar">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setCurrentPage(1); }}>
          <option value="">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      <div className="admin-ops-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Requester</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assignee</th>
              <th>Messages</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr>
                <td colSpan="7" className="admin-muted">No support tickets found for current filters.</td>
              </tr>
            ) : tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td>
                  <strong>{ticket.ticketNumber || ticket.id.slice(0, 10)}</strong>
                  <div className="admin-muted">{ticket.subject}</div>
                </td>
                <td>{ticket.requester?.name || ticket.requester?.email || 'Unknown'}</td>
                <td>{ticket.priority}</td>
                <td><span className={`admin-pill ${String(ticket.status || '').toLowerCase()}`}>{ticket.status}</span></td>
                <td>{ticket.assignee?.name || ticket.assignee?.email || 'Unassigned'}</td>
                <td>{ticket._count?.messages || 0}</td>
                <td>{new Date(ticket.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminPagination
        pagination={pagination}
        loading={loading}
        itemLabel="tickets"
        onPageChange={setCurrentPage}
        onPageSizeChange={(value) => {
          setPageSize(value);
          setCurrentPage(1);
        }}
      />
    </section>
  );
};

export default AdminSupportTickets;
