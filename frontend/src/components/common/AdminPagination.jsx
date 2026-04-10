import React from 'react';

const PAGE_SIZE_OPTIONS = [25, 50, 100];

function AdminPagination({
  pagination = { page: 1, limit: 25, total: 0, totalPages: 1 },
  loading = false,
  itemLabel = 'items',
  onPageChange,
  onPageSizeChange
}) {
  const page = pagination?.page || 1;
  const limit = pagination?.limit || 25;
  const total = pagination?.total || 0;
  const totalPages = Math.max(1, pagination?.totalPages || 1);

  return (
    <div className="admin-ops-pagination">
      <div className="admin-ops-pagination-meta">
        Page {page} of {totalPages} · {total} {itemLabel}
      </div>

      <div className="admin-ops-pagination-actions">
        <label htmlFor="admin-page-size">Rows</label>
        <select
          id="admin-page-size"
          value={limit}
          disabled={loading}
          onChange={(event) => onPageSizeChange?.(Number(event.target.value))}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>

        <button
          className="btn btn-secondary"
          disabled={loading || page <= 1}
          onClick={() => onPageChange?.(Math.max(1, page - 1))}
        >
          Previous
        </button>

        <button
          className="btn btn-secondary"
          disabled={loading || page >= totalPages}
          onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default AdminPagination;
