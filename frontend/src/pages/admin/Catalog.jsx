import React, { useEffect, useState } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import adminService from '../../services/admin.service';
import AdminPagination from '../../components/common/AdminPagination';
import './AdminOperations.css';

// ── Force-Edit Modal ────────────────────────────────────────────────────────
const ForceEditModal = ({ item, onClose, onSaved }) => {
  const [name, setName] = useState(item.name || '');
  const [price, setPrice] = useState(((item.priceCents || 0) / 100).toFixed(2));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setErr('');
    try {
      const priceCents = Math.round(parseFloat(price) * 100);
      await adminService.adminOverrideMedicine(item.id, { name, priceCents });
      onSaved({ ...item, name, priceCents });
    } catch (e) {
      setErr(e?.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Force Edit — {item.name}</h3>
        {err && <p className="admin-error" style={{ marginBottom: '0.5rem' }}>{err}</p>}
        <label>Name
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>Price (₹)
          <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
        <div className="admin-modal-actions">
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="btn-spinner" /> : null} Save Override
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────────────────────
const AdminCatalog = () => {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ total: 0, statusCounts: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [actionLoading, setActionLoading] = useState({});
  const [editTarget, setEditTarget] = useState(null);
  const { formatCurrency } = useCurrency();

  const loadCatalog = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getCatalogOverview({
        page: currentPage,
        limit: pageSize,
        status: status || undefined,
        search: search || undefined
      });
      setItems(response?.data || []);
      setSummary(response?.summary || { total: 0, statusCounts: {} });
      setPagination(response?.pagination || { page: currentPage, limit: pageSize, total: 0, totalPages: 1 });
    } catch (error) {
      console.error('Failed to load catalog overview', error);
      setError('Unable to fetch catalog data right now.');
      setItems([]);
      setPagination({ page: currentPage, limit: pageSize, total: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, [status, currentPage, pageSize]);

  const handleSearch = () => {
    if (currentPage === 1) { loadCatalog(); return; }
    setCurrentPage(1);
  };

  const handleToggleBlock = async (item) => {
    const isBlocked = item.status === 'BLOCKED';
    const verb = isBlocked ? 'unblock' : 'block';
    if (!window.confirm(`Are you sure you want to ${verb} "${item.name}"?`)) return;
    setActionLoading((p) => ({ ...p, [`block-${item.id}`]: true }));
    try {
      await adminService.blockMedicine(item.id, !isBlocked);
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: isBlocked ? 'PUBLISHED' : 'BLOCKED' } : i
        )
      );
    } catch (e) {
      alert(e?.response?.data?.message || `Failed to ${verb} item.`);
    } finally {
      setActionLoading((p) => ({ ...p, [`block-${item.id}`]: false }));
    }
  };

  const handleEditSaved = (updated) => {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setEditTarget(null);
  };

  if (loading) return <div className="admin-loading"><div className="spinner"></div>Loading catalog...</div>;
  if (error) return <div className="admin-error">{error}</div>;

  return (
    <section className="admin-ops-page">
      <header className="page-header">
        <div>
          <h1>Catalog Management</h1>
          <p>Review product quality, status, and demand indicators across the marketplace.</p>
        </div>
      </header>

      <div className="admin-ops-summary">
        <div className="admin-ops-summary-card"><h4>Total Items</h4><p>{summary.total || 0}</p></div>
        <div className="admin-ops-summary-card"><h4>Published</h4><p>{summary.statusCounts?.PUBLISHED || 0}</p></div>
        <div className="admin-ops-summary-card"><h4>Draft</h4><p>{summary.statusCounts?.DRAFT || 0}</p></div>
        <div className="admin-ops-summary-card"><h4>Blocked</h4><p>{summary.statusCounts?.BLOCKED || 0}</p></div>
      </div>

      <div className="admin-ops-toolbar">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, brand, SKU" />
        <button className="btn btn-secondary" onClick={handleSearch}>Search</button>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setCurrentPage(1); }}>
          <option value="">All statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="BLOCKED">Blocked</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <div className="admin-ops-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Category</th>
              <th>Status</th>
              <th>Price</th>
              <th>Prescription</th>
              <th>Demand</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan="8" className="admin-muted">No catalog records found for current filters.</td></tr>
            ) : items.map((item) => {
              const isBlocked = item.status === 'BLOCKED';
              const blockKey = `block-${item.id}`;
              return (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <div className="admin-muted">{item.sku || 'No SKU'} · {item.brand || 'Unbranded'}</div>
                  </td>
                  <td>{item.category || 'Uncategorized'}</td>
                  <td><span className={`admin-pill ${String(item.status || '').toLowerCase()}`}>{item.status}</span></td>
                  <td>{formatCurrency((item.priceCents || 0) / 100)}</td>
                  <td>{item.requiresPrescription ? 'Required' : 'Not required'}</td>
                  <td>{item._count?.orderItems || 0} orders · {item._count?.reviews || 0} reviews</td>
                  <td>{new Date(item.updatedAt).toLocaleString()}</td>
                  <td>
                    <div className="admin-ops-actions">
                      <button
                        id={`catalog-block-${item.id}`}
                        className={`btn ${isBlocked ? 'btn-success' : 'btn-danger'}`}
                        onClick={() => handleToggleBlock(item)}
                        disabled={!!actionLoading[blockKey]}
                      >
                        {actionLoading[blockKey] ? <span className="btn-spinner" /> : (isBlocked ? 'Unblock' : 'Block')}
                      </button>
                      <button
                        id={`catalog-edit-${item.id}`}
                        className="btn btn-secondary"
                        onClick={() => setEditTarget(item)}
                      >
                        Force Edit
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AdminPagination
        pagination={pagination}
        loading={loading}
        itemLabel="catalog items"
        onPageChange={setCurrentPage}
        onPageSizeChange={(value) => { setPageSize(value); setCurrentPage(1); }}
      />

      {editTarget && (
        <ForceEditModal
          item={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleEditSaved}
        />
      )}
    </section>
  );
};

export default AdminCatalog;
