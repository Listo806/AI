import React, { useEffect, useState } from "react";
import customerServiceApi from "../../api/customerServiceApi";
import CsRuleModal from "./CsRuleModal";
import { formatDate } from "../sales/salesFormat";

const TRIGGER_OPTS = [
  "Ticket created",
  "Ticket resolved",
  "SLA breached",
  "No agent response",
  "Status changed",
  "New customer reply",
];

const FIELDS = [
  { key: "name", label: "Automation name", type: "text", full: true, placeholder: "e.g. Auto-assign new tickets" },
  { key: "trigger", label: "Trigger", type: "select", options: TRIGGER_OPTS },
  { key: "conditions", label: "Conditions", type: "textarea", full: true, placeholder: "e.g. priority is High" },
  { key: "actions", label: "Actions", type: "textarea", full: true, placeholder: "e.g. assign to on-call agent, notify manager" },
  { key: "active", label: "Active", type: "checkbox", default: true },
];

const api = {
  get: (id) => customerServiceApi.listAutomations().then((rows) => rows.find((r) => r.id === id)),
  create: (b) => customerServiceApi.createAutomation(b),
  update: (id, b) => customerServiceApi.updateAutomation(id, b),
  remove: (id) => customerServiceApi.deleteAutomation(id),
};

export default function CsAutomationSection() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState({ open: false, mode: "create", id: null, nonce: 0 });

  const load = async () => {
    setLoading(true);
    try {
      const r = await customerServiceApi.listAutomations();
      setRows(Array.isArray(r) ? r : []);
      setError("");
    } catch {
      setError("Could not load automations.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { window.lucide?.createIcons(); }, [rows, loading, modal.open]);

  const open = (mode, id = null) => setModal((m) => ({ open: true, mode, id, nonce: m.nonce + 1 }));

  return (
    <>
      <section className="csw-mobile-only csw-mobile-feature-panel tone-green">
        <div className="csw-mobile-feature-head">
          <span className="csw-mobile-feature-title"><i data-lucide="bot" />Automation</span>
          <button type="button" onClick={() => open("create")}>View All <i data-lucide="chevron-right" /></button>
        </div>
        <div className="csw-mobile-feature-list">
          {loading ? (
            <div className="csw-mobile-empty">Loading…</div>
          ) : error ? (
            <div className="csw-mobile-empty error">{error}</div>
          ) : rows.length === 0 ? (
            <div className="csw-mobile-empty">No automations yet. Create a rule to get started.</div>
          ) : (
            rows.slice(0, 4).map((a, idx) => (
              <button type="button" key={a.id} className="csw-mobile-feature-row automation-row" onClick={() => open("edit", a.id)}>
                <span className={`row-icon auto-${idx % 4}`}><i data-lucide={idx % 3 === 0 ? "zap" : idx % 3 === 1 ? "mail" : "bell"} /></span>
                <span className="row-copy"><b>{a.name || "-"}</b><small>{a.trigger || "Automation rule"}</small></span>
                <em className={a.active ? "is-active" : "is-paused"}>{a.active ? "Active" : "Paused"}</em>
                <span className={`fake-switch ${a.active ? "on" : ""}`}><i /></span>
                <i data-lucide="chevron-right" />
              </button>
            ))
          )}
        </div>
        <button type="button" className="csw-mobile-outline-action" onClick={() => open("create")}>
          <i data-lucide="circle-plus" />Create New Automation
        </button>
      </section>

      <div className="csw-desktop-only">
      <div className="csw-section-head">
        <div>
          <h2>Automation</h2>
          <p>Rules that run on your tickets. Rules are stored here; the runtime executes them without duplicating actions.</p>
        </div>
        <div>
          <button className="primary" onClick={() => open("create")}>
            <i data-lucide="plus" style={{ width: 15, height: 15 }} />New Automation
          </button>
        </div>
      </div>
      {error && <div style={ST.error}>{error}</div>}
      <div className="csw-table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Trigger</th><th>Active</th><th>Last Run</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={ST.cell}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} style={ST.cell}>No automations yet. Create a rule to get started.</td></tr>
            ) : (
              rows.map((a) => (
                <tr key={a.id}>
                  <td><b>{a.name || "-"}</b></td>
                  <td>{a.trigger || "-"}</td>
                  <td><span className={`pill ${a.active ? "green" : ""}`}>{a.active ? "Active" : "Inactive"}</span></td>
                  <td>{a.lastRunAt ? formatDate(a.lastRunAt) : "Not run yet"}</td>
                  <td>{a.runStatus || "-"}</td>
                  <td>
                    <div className="row-actions">
                      <button onClick={() => open("edit", a.id)}><i data-lucide="pencil" style={{ width: 14, height: 14 }} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      </div>

      <CsRuleModal
        key={modal.nonce}
        open={modal.open}
        mode={modal.mode}
        recordId={modal.id}
        entity="automation"
        fields={FIELDS}
        api={api}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        onSaved={load}
      />
    </>
  );
}

const ST = {
  error: { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", fontSize: 13, marginBottom: 10 },
  cell: { textAlign: "center", padding: 24, color: "#64748b" },
};
