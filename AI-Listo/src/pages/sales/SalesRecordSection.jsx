import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Upload,
  Download,
  Settings2,
  Eye,
  Pencil,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ChevronDown,
  Table2,
  List,
  CalendarDays,
} from "lucide-react";

// Reusable Sales table section, wired to a live paginated endpoint. Config props:
//  title/subtitle/newLabel, columns ([{header, render(row)}]), fetchList (params
//  -> {data,total}), ModalComponent (open/mode/recordId/onClose/onSaved), and an
//  optional extraActions(row, openModal) for per-row buttons (e.g. Convert). All
//  data is server-scoped to the account; this component holds no tenant logic.
export default function SalesRecordSection({
  title,
  subtitle,
  newLabel,
  columns,
  fetchList,
  ModalComponent,
  extraActions,
}) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [modalId, setModalId] = useState(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debounced, limit]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchList({ search: debounced || undefined, page, limit })
      .then((res) => {
        if (!alive) return;
        setRows(res?.data || []);
        setTotal(res?.total || 0);
        setError("");
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setError(`Could not load ${title.toLowerCase()}.`);
        setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, page, limit, tick]);

  const openModal = (mode, id = null) => {
    setModalMode(mode);
    setModalId(id);
    setNonce((n) => n + 1);
    setModalOpen(true);
  };
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const colSpan = columns.length + 2;

  return (
    <section className="sales-ws-quotes">
      <div className="sales-ws-section-head">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="sales-ws-section-actions">
          <button>
            <Upload size={14} /> Import
          </button>
          <button>
            <Download size={14} /> Export
          </button>
          <button>
            <Settings2 size={14} />
          </button>
          <button className="primary" onClick={() => openModal("create")}>
            <Plus size={14} /> {newLabel}
          </button>
        </div>
      </div>

      <div className="sales-ws-filters">
        <label>
          <Search size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}...`}
          />
        </label>
        {["Status", "Owner", "Date Range", "More Filters"].map((item) => (
          <button key={item}>
            {item}
            <ChevronDown size={14} />
          </button>
        ))}
        <button className="reset" onClick={() => setSearch("")}>
          <RotateCcw size={13} /> Reset
        </button>
        <span>View</span>
        <button>
          <Table2 size={13} /> Table
        </button>
        <button>
          <List size={13} />
        </button>
        <button>
          <CalendarDays size={13} />
        </button>
      </div>
      
      <div className="sales-ws-mobile-record-list">
        {loading ? (
          <div className="sales-ws-mobile-record-state">Loading…</div>
        ) : error ? (
          <div className="sales-ws-mobile-record-state error">{error}</div>
        ) : rows.length === 0 ? (
          <div className="sales-ws-mobile-record-state">
            No {title.toLowerCase()} yet.
          </div>
        ) : (
          rows.map((row) => {
            const primaryColumn = columns[0];
            const detailColumns = columns.slice(1);

            return (
              <article className="sales-ws-mobile-record-card" key={row.id}>
                {/* HEADER */}
                <div className="sales-ws-mobile-record-main">
  <div className="sales-ws-mobile-record-primary">
    <div className="sales-ws-mobile-record-icon">
      <Table2 size={28} />
    </div>

    <div className="sales-ws-mobile-record-title">
      <strong>
        {primaryColumn?.render
          ? primaryColumn.render(row)
          : "-"}
      </strong>

      <span>{primaryColumn?.header}</span>
    </div>
  </div>

  {detailColumns.slice(0, 3).map((column) => (
    <div
      className="sales-ws-mobile-record-main-field"
      key={column.header}
    >
      <div className="sales-ws-mobile-record-value">
        {column.render(row)}
      </div>

      <span>{column.header}</span>
    </div>
  ))}
</div>

<div className="sales-ws-mobile-record-meta">
  {detailColumns.slice(3).map((column) => (
    <div
      className="sales-ws-mobile-record-meta-field"
      key={column.header}
    >
      <div className="sales-ws-mobile-record-value">
        {column.render(row)}
      </div>

      <span>{column.header}</span>
    </div>
  ))}

  <button
    type="button"
    onClick={() => openModal("view", row.id)}
    aria-label={`View ${title}`}
  >
    <MoreVertical size={20} />
  </button>
</div>

                {/* ACTIONS */}
                <div
                  className="sales-ws-mobile-record-actions"
                  style={{
                    "--action-count": extraActions ? 4 : 3,
                  }}
                >
                  {extraActions
                    ? extraActions(row, () => setTick((t) => t + 1))
                    : null}

                  <button
                    type="button"
                    onClick={() => openModal("view", row.id)}
                  >
                    <Eye size={15} />
                    <span>View</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openModal("edit", row.id)}
                  >
                    <Pencil size={15} />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openModal("view", row.id)}
                  >
                    <span>More</span>
                    <MoreVertical size={15} />
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
      <div className="sales-ws-table-wrap">
        <table className="sales-ws-table">
          <thead>
            <tr>
              <th>
                <input type="checkbox" />
              </th>
              {columns.map((c) => (
                <th key={c.header}>{c.header}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colSpan} className="sales-ws-empty-row">
                  Loading…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={colSpan} className="sales-ws-empty-row">
                  {error}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="sales-ws-empty-row">
                  No {title.toLowerCase()} yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input type="checkbox" />
                  </td>
                  {columns.map((c) => (
                    <td key={c.header} className={c.className || undefined}>
                      {c.render(row)}
                    </td>
                  ))}
                  <td>
                    <div className="sales-ws-row-actions">
                      {extraActions
                        ? extraActions(row, () => setTick((t) => t + 1))
                        : null}
                      <button
                        type="button"
                        onClick={() => openModal("view", row.id)}
                        aria-label={`View ${title}`}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openModal("edit", row.id)}
                        aria-label={`Edit ${title}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openModal("view", row.id)}
                        aria-label="More"
                      >
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="sales-ws-pagination">
        <span>
          Showing {from} to {to} of {total.toLocaleString("en-US")}{" "}
          {title.toLowerCase()}
        </span>
        <div>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={14} />
          </button>
          <button className="active">{page}</button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
        >
          <option value="20">20 / page</option>
          <option value="50">50 / page</option>
          <option value="100">100 / page</option>
        </select>
      </div>

      <ModalComponent
        key={nonce}
        open={modalOpen}
        mode={modalMode}
        recordId={modalId}
        onClose={() => setModalOpen(false)}
        onSaved={() => setTick((t) => t + 1)}
      />
    </section>
  );
}
