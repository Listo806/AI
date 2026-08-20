import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Search,
  Plus,
  Upload,
  Download,
  Settings2,
  Eye,
  Pencil,
  MoreVertical,
  RotateCcw,
} from "lucide-react";

// Reusable fsw-styled table section for the Financial Services Workspace, matching
// the Clients tab look. Config props: title/subtitle/newLabel, columns
// ([{header, render(row), className?}]), fetchList (params -> {data,total}),
// ModalComponent (open/mode/recordId/onClose/onSaved), optional statusOptions for a
// status filter. Holds no tenant logic; all authorization is server-side.
export default function FinancialRecordSection({
  title,
  subtitle,
  newLabel,
  columns,
  fetchList,
  ModalComponent,
  statusOptions,
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("");
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
  }, [debounced, status, limit]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchList({ search: debounced || undefined, status: status || undefined, page, limit })
      .then((res) => {
        if (!alive) return;
        setRows(res?.data || []);
        setTotal(res?.total || 0);
        setError("");
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setError(t("financialWorkspace.record.loadError", { title: title.toLowerCase() }));
        setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, status, page, limit, tick]);

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
    <>
      <section className="fsw-section-title">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="fsw-section-actions">
          <button><Upload size={14} />{t("financialWorkspace.actions.import")}</button>
          <button><Download size={14} />{t("financialWorkspace.actions.export")}</button>
          <button><Settings2 size={14} /></button>
          <button className="primary" onClick={() => openModal("create")}>
            <Plus size={14} />{newLabel}
          </button>
        </div>
      </section>

      <div className="fsw-filters">
        <label className="fsw-search">
          <Search size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("financialWorkspace.record.search", { title: title.toLowerCase() })}
          />
        </label>
        {statusOptions && (
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{t("financialWorkspace.filters.status")}</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
        <button className="fsw-reset" onClick={() => { setSearch(""); setStatus(""); }}>
          <RotateCcw size={14} />{t("financialWorkspace.actions.reset")}
        </button>
      </div>

      <div className="fsw-mobile-record-list">
        {loading ? (
          <div className="fsw-mobile-state">{t("common.loading")}</div>
        ) : error ? (
          <div className="fsw-mobile-state error">{error}</div>
        ) : rows.length === 0 ? (
          <div className="fsw-mobile-state">{t("financialWorkspace.record.empty", { title: title.toLowerCase() })}</div>
        ) : (
          rows.map((row, rowIndex) => (
            <article className={`fsw-mobile-record-card tone-${rowIndex % 5}`} key={row.id}>
              <div className="fsw-mobile-record-grid">
                {columns.map((c, colIndex) => (
                  <div className={colIndex === 0 ? "primary" : ""} key={c.header}>
                    <small>{c.header}</small>
                    <div>{c.render(row)}</div>
                  </div>
                ))}
              </div>
              <div className="fsw-mobile-record-actions">
                <button onClick={() => openModal("view", row.id)}><Eye size={16} />{t("common.view")}</button>
                <button onClick={() => openModal("edit", row.id)}><Pencil size={16} />{t("common.edit")}</button>
                <button onClick={() => openModal("view", row.id)}><MoreVertical size={16} />{t("financialWorkspace.actions.more")}</button>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="fsw-table-wrap">
        <table className="fsw-table">
          <thead>
            <tr>
              <th><input type="checkbox" /></th>
              {columns.map((c) => (
                <th key={c.header}>{c.header}</th>
              ))}
              <th>{t("financialWorkspace.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={colSpan} style={{ textAlign: "center", padding: 24, color: "#64748b" }}>{t("common.loading")}</td></tr>
            ) : error ? (
              <tr><td colSpan={colSpan} style={{ textAlign: "center", padding: 24, color: "#b91c1c" }}>{error}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={colSpan} style={{ textAlign: "center", padding: 24, color: "#64748b" }}>{t("financialWorkspace.record.empty", { title: title.toLowerCase() })}</td></tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td><input type="checkbox" /></td>
                  {columns.map((c) => (
                    <td key={c.header} className={c.className || undefined}>{c.render(row)}</td>
                  ))}
                  <td>
                    <div className="fsw-row-actions">
                      <button onClick={() => openModal("view", row.id)} aria-label={`View ${title}`}><Eye size={15} /></button>
                      <button onClick={() => openModal("edit", row.id)} aria-label={`Edit ${title}`}><Pencil size={15} /></button>
                      <button onClick={() => openModal("view", row.id)} aria-label="More"><MoreVertical size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="fsw-pagination">
          <span>{t("financialWorkspace.pagination.showingGeneric", { from, to, total: total.toLocaleString(), title: title.toLowerCase() })}</span>
          <div>
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
            <button className="active">{page}</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>›</button>
          </div>
          <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </select>
        </div>
      </div>

      <ModalComponent
        key={nonce}
        open={modalOpen}
        mode={modalMode}
        recordId={modalId}
        onClose={() => setModalOpen(false)}
        onSaved={() => setTick((t) => t + 1)}
      />
    </>
  );
}
