import React, { useEffect, useState } from "react";
import customerServiceApi from "../../api/customerServiceApi";
import CsRuleModal from "./CsRuleModal";
import { formatDate } from "../sales/salesFormat";

const STATUS_OPTS = ["Sent", "Responded", "Expired"];

const FIELDS = [
  { key: "customerName", label: "Customer name", type: "text", full: true },
  { key: "rating", label: "Rating (1-5)", type: "select", options: ["1", "2", "3", "4", "5"], placeholder: "No rating yet" },
  { key: "comment", label: "Comment", type: "textarea", full: true },
  { key: "status", label: "Status", type: "select", options: STATUS_OPTS },
];

const api = {
  get: (id) => customerServiceApi.getSurvey(id),
  create: (b) => customerServiceApi.createSurvey(b),
  update: (id, b) => customerServiceApi.updateSurvey(id, b),
  remove: (id) => customerServiceApi.deleteSurvey(id),
};

export default function CsSurveysSection() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState({ open: false, mode: "create", id: null, nonce: 0 });

  useEffect(() => { setPage(1); }, [status, limit]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await customerServiceApi.listSurveys({ status: status || undefined, page, limit });
      setRows(res?.data || []);
      setTotal(res?.total || 0);
      setError("");
    } catch {
      setError("Could not load surveys.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status, page, limit]);
  useEffect(() => { window.lucide?.createIcons(); }, [rows, loading, modal.open]);

  const open = (mode, id = null) => setModal((m) => ({ open: true, mode, id, nonce: m.nonce + 1 }));
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const ratedRows = rows.filter((s) => Number.isFinite(Number(s?.rating)));
  const avgRating = ratedRows.length
    ? (ratedRows.reduce((sum, s) => sum + Number(s.rating || 0), 0) / ratedRows.length).toFixed(1)
    : "—";

  return (
    <>
      <section className="csw-mobile-only csw-mobile-feature-panel tone-purple">
        <div className="csw-mobile-feature-head">
          <span className="csw-mobile-feature-title"><i data-lucide="clipboard-list" />Surveys</span>
          <button type="button" onClick={() => setStatus("")}>View All <i data-lucide="chevron-right" /></button>
        </div>

        <div className="csw-mobile-survey-summary">
          <div className="score">
            <strong>{avgRating}</strong>
            <div className="stars">★★★★★</div>
          </div>
          <div className="copy">
            <b>Customer Satisfaction Survey</b>
            <span>Overall Satisfaction Score</span>
          </div>
          <div className="responses">
            <strong>{total}</strong>
            <span>Responses</span>
          </div>
        </div>

        <div className="csw-mobile-feature-list">
          {loading ? (
            <div className="csw-mobile-empty">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="csw-mobile-empty">No surveys yet.</div>
          ) : (
            rows.slice(0, 3).map((s, idx) => (
              <button type="button" key={s.id} className="csw-mobile-feature-row" onClick={() => open("view", s.id)}>
                <span className={`row-icon survey-${idx % 3}`}><i data-lucide={idx === 0 ? "smile" : idx === 1 ? "thumbs-up" : "message-square-more"} /></span>
                <span className="row-copy"><b>{s.customerName || "Customer Survey"}</b><small>{s.comment || s.ticketNumber || "Survey response"}</small></span>
                <em className={s.status === "Responded" ? "is-active" : ""}>{s.status || "Sent"}</em>
                <span className="survey-count">{s.rating != null ? `${s.rating}/5` : "—"}</span>
                <i data-lucide="chevron-right" />
              </button>
            ))
          )}
        </div>

        <button type="button" className="csw-mobile-outline-action" onClick={() => open("create")}>
          <i data-lucide="circle-plus" />Create New Survey
        </button>
      </section>

      <div className="csw-desktop-only">
      <div className="csw-section-head">
        <div>
          <h2>Surveys</h2>
          <p>Customer satisfaction. The CSAT metric is calculated only from responded surveys.</p>
        </div>
        <div>
          <button className="primary" onClick={() => open("create")}>
            <i data-lucide="plus" style={{ width: 15, height: 15 }} />New Survey
          </button>
        </div>
      </div>
      <div className="csw-filters">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Status</option>
          {STATUS_OPTS.map((s) => (<option key={s} value={s}>{s}</option>))}
        </select>
        <button className="reset" onClick={() => setStatus("")}>↻ Reset</button>
      </div>
      {error && <div style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", fontSize: 13, marginBottom: 10 }}>{error}</div>}
      <div className="csw-table-wrap">
        <table>
          <thead>
            <tr><th>Customer</th><th>Ticket</th><th>Rating</th><th>Comment</th><th>Status</th><th>Sent</th><th>Responded</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={ST.cell}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} style={ST.cell}>No surveys yet. The satisfaction metric stays empty until surveys are answered.</td></tr>
            ) : (
              rows.map((s) => (
                <tr key={s.id}>
                  <td><b>{s.customerName || "-"}</b></td>
                  <td>{s.ticketNumber || "-"}</td>
                  <td>{s.rating != null ? `${s.rating}/5` : "—"}</td>
                  <td style={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.comment || "-"}</td>
                  <td><span className={`pill ${s.status === "Responded" ? "green" : ""}`}>{s.status || "-"}</span></td>
                  <td>{formatDate(s.sentAt)}</td>
                  <td>{s.respondedAt ? formatDate(s.respondedAt) : "-"}</td>
                  <td>
                    <div className="row-actions">
                      <button onClick={() => open("view", s.id)}><i data-lucide="eye" style={{ width: 14, height: 14 }} /></button>
                      <button onClick={() => open("edit", s.id)}><i data-lucide="pencil" style={{ width: 14, height: 14 }} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="csw-pagination">
          <span>Showing {from} to {to} of {total.toLocaleString("en-US")} surveys</span>
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

      <CsRuleModal
        key={modal.nonce}
        open={modal.open}
        mode={modal.mode}
        recordId={modal.id}
        entity="survey"
        fields={FIELDS}
        api={api}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        onSaved={load}
      />
    </>
  );
}

const ST = { cell: { textAlign: "center", padding: 24, color: "#64748b" } };
