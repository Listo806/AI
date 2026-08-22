import React, { useEffect, useState } from "react";
import customerServiceApi from "../../api/customerServiceApi";
import CsArticleModal from "./CsArticleModal";
import { formatDate } from "../sales/salesFormat";

const STATUS_OPTS = ["Draft", "Published", "Archived"];

// Knowledge Base tab: team-scoped articles with real create/edit/publish/archive.
// Only the account's own articles are ever listed (enforced server-side).
export default function CsKnowledgeBaseSection() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
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
  useEffect(() => { setPage(1); }, [debounced, status, limit]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    customerServiceApi
      .listArticles({ search: debounced || undefined, status: status || undefined, page, limit })
      .then((res) => {
        if (!alive) return;
        setRows(res?.data || []);
        setTotal(res?.total || 0);
        setError("");
        setLoading(false);
      })
      .catch(() => { if (alive) { setError("Could not load articles."); setLoading(false); } });
    return () => { alive = false; };
  }, [debounced, status, page, limit, tick]);

  // Re-render the data-lucide action icons whenever the rows change.
  useEffect(() => { window.lucide?.createIcons(); }, [rows, loading, modalOpen]);

  const openModal = (mode, id = null) => {
    setModalMode(mode); setModalId(id); setNonce((n) => n + 1); setModalOpen(true);
  };
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <>
      <section className="csw-mobile-only csw-mobile-feature-panel tone-purple">
        <div className="csw-mobile-feature-head">
          <span className="csw-mobile-feature-title"><i data-lucide="library" />Knowledge Base</span>
          <button type="button" onClick={() => { setSearch(""); setStatus(""); }}>View All <i data-lucide="chevron-right" /></button>
        </div>
        <div className="csw-mobile-feature-list">
          {loading ? (
            <div className="csw-mobile-empty">Loading…</div>
          ) : error ? (
            <div className="csw-mobile-empty error">{error}</div>
          ) : rows.length === 0 ? (
            <div className="csw-mobile-empty">No articles yet. Create your first article.</div>
          ) : (
            rows.slice(0, 4).map((a) => (
              <button type="button" key={a.id} className="csw-mobile-feature-row" onClick={() => openModal("view", a.id)}>
                <span className="row-icon"><i data-lucide="file-text" /></span>
                <span className="row-copy"><b>{a.title || "-"}</b><small>{a.category || "General"}</small></span>
                {a.status && <em>{a.status}</em>}
                <i data-lucide="chevron-right" />
              </button>
            ))
          )}
        </div>
        <button type="button" className="csw-mobile-outline-action" onClick={() => setSearch((v) => v)}>
          <i data-lucide="search" />Search Knowledge Base
        </button>
      </section>

      <div className="csw-desktop-only">
      <div className="csw-section-head">
        <div>
          <h2>Knowledge Base</h2>
          <p>Help articles for your team and customers</p>
        </div>
        <div>
          <button className="primary" onClick={() => openModal("create")}>
            <i data-lucide="plus" style={{ width: 16, height: 16 }} />New Article
          </button>
        </div>
      </div>
      <div className="csw-filters">
        <label>
          <i data-lucide="search" style={{ width: 16, height: 16 }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search articles..." />
        </label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Status</option>
          {STATUS_OPTS.map((s) => (<option key={s} value={s}>{s}</option>))}
        </select>
        <button className="reset" onClick={() => { setSearch(""); setStatus(""); }}>↻ Reset</button>
      </div>
      <div className="csw-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Status</th>
              <th>Author</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 24, color: "#64748b" }}>Loading…</td></tr>
            ) : error ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 24, color: "#b91c1c" }}>{error}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 24, color: "#64748b" }}>No articles yet. Create your first article.</td></tr>
            ) : (
              rows.map((a) => (
                <tr key={a.id}>
                  <td><b>{a.title || "-"}</b></td>
                  <td>{a.category || "-"}</td>
                  <td><span className={`pill ${String(a.status || "").toLowerCase()}`}>{a.status || "-"}</span></td>
                  <td>{a.authorName || "-"}</td>
                  <td>{formatDate(a.updatedAt)}</td>
                  <td>
                    <div className="row-actions">
                      <button onClick={() => openModal("view", a.id)}><i data-lucide="eye" style={{ width: 14, height: 14 }} /></button>
                      <button onClick={() => openModal("edit", a.id)}><i data-lucide="pencil" style={{ width: 14, height: 14 }} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="csw-pagination">
          <span>Showing {from} to {to} of {total.toLocaleString("en-US")} articles</span>
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

      </div>

      <CsArticleModal
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
