import React, { useEffect, useState } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import adminService from '../../services/admin.service';
import AdminPagination from '../../components/common/AdminPagination';
import './AdminOperations.css';


// ── Main Component ──────────────────────────────────────────────────────────
const AdminInventory = () => {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ total: 0, lowStockCount: 0, inactiveCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const { formatCurrency } = useCurrency();

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getInventoryOverview({ page: currentPage, limit: pageSize });
      setItems(response?.data || []);
      setSummary(response?.summary || { total: 0, lowStockCount: 0, inactiveCount: 0 });
      setPagination(response?.pagination || { page: currentPage, limit: pageSize, total: 0, totalPages: 1 });
    } catch (error) {
      console.error('Failed to load inventory overview', error);
      setError('Unable to fetch inventory data right now.');
      setItems([]);
      setPagination({ page: currentPage, limit: pageSize, total: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInventory(); }, [currentPage, pageSize]);

  if (loading) return <div className="admin-loading"><div className="spinner"></div>Loading inventory...</div>;
  if (error) return <div className="admin-error">{error}</div>;

  return (
    <section className="admin-ops-page">
      <header className="page-header">
        <div>
          <h1>Inventory Management</h1>
          <p>Track stock risk, reserve levels, and inventory activity across all vendors.</p>
        </div>
      </header>

      <div className="admin-ops-summary">
        <div className="admin-ops-summary-card"><h4>Inventory Records</h4><p>{summary.total}</p></div>
        <div className="admin-ops-summary-card"><h4>Low Stock</h4><p>{summary.lowStockCount}</p></div>
        <div className="admin-ops-summary-card"><h4>Inactive Listings</h4><p>{summary.inactiveCount}</p></div>
      </div>

      <div className="admin-ops-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Vendor</th>
              <th>Stock</th>
              <th>Reserve</th>
              <th>Reorder</th>
              <th>Selling / MRP</th>
              <th>Batches</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan="8" className="admin-muted">No inventory records found.</td></tr>
            ) : items.map((item) => {
              const lowStock = item.quantity <= item.reorderLevel;
              return (
                <tr key={item.id}>
                  <td>
                    <strong>{item.medicine?.name || 'Unknown'}</strong>
                    <div className="admin-muted" style={{ wordBreak: 'break-word' }}>{item.medicine?.sku || 'No SKU'} · {item.medicine?.category || 'Uncategorized'}</div>
                  </td>
                  <td style={{ wordBreak: 'break-word' }}>{item.vendor?.companyName || 'Unknown vendor'}</td>
                  <td><span className={`admin-pill ${lowStock ? 'failed' : 'succeeded'}`}>{item.quantity}</span></td>
                  <td>{item.reservedQuantity}</td>
                  <td>{item.reorderLevel}</td>
                  <td>{formatCurrency((item.sellingPriceCents || 0) / 100)} / {formatCurrency((item.mrpCents || 0) / 100)}</td>
                  <td>{item._count?.batches || 0}</td>
                  <td><span className={`admin-pill ${item.isActive ? 'succeeded' : 'failed'}`} style={{ wordBreak: 'normal' }}>{item.isActive ? 'ACTIVE' : 'INACTIVE'}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AdminPagination
        pagination={pagination}
        loading={loading}
        itemLabel="inventory records"
        onPageChange={setCurrentPage}
        onPageSizeChange={(value) => { setPageSize(value); setCurrentPage(1); }}
      />
    </section>
  );
};

export default AdminInventory;
