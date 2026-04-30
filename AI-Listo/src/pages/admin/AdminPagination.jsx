export default function AdminPagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="admin-pagination">
      <div className="admin-pagination-info">
        Showing {start}-{end} of {total}
      </div>
      <div className="admin-pagination-controls">
        <label>
          Per page:
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="admin-pagination-select"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <div className="admin-pagination-buttons">
          <button
            type="button"
            className="crm-btn crm-btn-secondary admin-pagination-btn"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Prev
          </button>
          <span className="admin-pagination-page">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="crm-btn crm-btn-secondary admin-pagination-btn"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
