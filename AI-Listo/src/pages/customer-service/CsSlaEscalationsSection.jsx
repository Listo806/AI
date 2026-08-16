import React, { useEffect, useState } from "react";
import customerServiceApi from "../../api/customerServiceApi";
import CsRuleModal from "./CsRuleModal";

const PRIORITY_OPTS = ["Low", "Medium", "High", "Urgent"];
const TRIGGER_OPTS = [
  "SLA approaching",
  "SLA breached",
  "High priority",
  "Ticket age",
  "No agent response",
  "Customer reply awaiting",
];
const ACTION_OPTS = ["Notify agent", "Notify manager", "Reassign", "Raise priority"];

const POLICY_FIELDS = [
  { key: "name", label: "Policy name", type: "text", full: true, placeholder: "e.g. Standard SLA" },
  { key: "priority", label: "Applies to priority", type: "select", options: PRIORITY_OPTS, placeholder: "Any priority" },
  { key: "category", label: "Applies to category (optional)", type: "text", placeholder: "Any category" },
  { key: "firstResponseTargetMins", label: "First response target (minutes)", type: "number", placeholder: "e.g. 120" },
  { key: "resolutionTargetMins", label: "Resolution target (minutes)", type: "number", placeholder: "e.g. 1440" },
  { key: "active", label: "Active", type: "checkbox", default: true },
];
const ESCALATION_FIELDS = [
  { key: "name", label: "Rule name", type: "text", full: true, placeholder: "e.g. Escalate breached tickets" },
  { key: "trigger", label: "Trigger", type: "select", options: TRIGGER_OPTS },
  { key: "thresholdMins", label: "Threshold (minutes)", type: "number", placeholder: "e.g. 60" },
  { key: "action", label: "Action", type: "select", options: ACTION_OPTS },
  { key: "target", label: "Target (agent / team, optional)", type: "text" },
  { key: "active", label: "Active", type: "checkbox", default: true },
];

const policyApi = {
  get: (id) => customerServiceApi.listSlaPolicies().then((rows) => rows.find((r) => r.id === id)),
  create: (b) => customerServiceApi.createSlaPolicy(b),
  update: (id, b) => customerServiceApi.updateSlaPolicy(id, b),
  remove: (id) => customerServiceApi.deleteSlaPolicy(id),
};
const escalationApi = {
  get: (id) => customerServiceApi.listEscalations().then((rows) => rows.find((r) => r.id === id)),
  create: (b) => customerServiceApi.createEscalation(b),
  update: (id, b) => customerServiceApi.updateEscalation(id, b),
  remove: (id) => customerServiceApi.deleteEscalation(id),
};

export default function CsSlaEscalationsSection() {
  const [policies, setPolicies] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recomputing, setRecomputing] = useState(false);
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState({ open: false, kind: "policy", mode: "create", id: null, nonce: 0 });

  const load = async () => {
    setLoading(true);
    try {
      const [p, e] = await Promise.all([
        customerServiceApi.listSlaPolicies(),
        customerServiceApi.listEscalations(),
      ]);
      setPolicies(Array.isArray(p) ? p : []);
      setEscalations(Array.isArray(e) ? e : []);
      setError("");
    } catch {
      setError("Could not load SLA configuration.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { window.lucide?.createIcons(); }, [policies, escalations, loading, modal.open]);

  const open = (kind, mode, id = null) =>
    setModal((m) => ({ open: true, kind, mode, id, nonce: m.nonce + 1 }));

  const recompute = async () => {
    setRecomputing(true); setNotice("");
    try {
      const res = await customerServiceApi.recomputeSla();
      setNotice(`SLA states recomputed. ${res?.updated ?? 0} ticket(s) updated.`);
    } catch (e) {
      setNotice(e?.message || "Recompute failed.");
    } finally {
      setRecomputing(false);
    }
  };

  const isPolicy = modal.kind === "policy";

  return (
    <>
      <div className="csw-section-head">
        <div>
          <h2>SLA &amp; Escalations</h2>
          <p>Targets that derive each ticket's SLA state, and rules for escalation</p>
        </div>
        <div>
          <button onClick={recompute} disabled={recomputing}>
            <i data-lucide="refresh-cw" style={{ width: 15, height: 15 }} />
            {recomputing ? "Recomputing…" : "Recompute SLA"}
          </button>
        </div>
      </div>
      {notice && <div style={ST.notice}>{notice}</div>}
      {error && <div style={ST.error}>{error}</div>}

      {/* SLA policies */}
      <div style={ST.blockHead}>
        <h3 style={ST.h3}>SLA policies</h3>
        <button className="primary" onClick={() => open("policy", "create")}>
          <i data-lucide="plus" style={{ width: 15, height: 15 }} />New Policy
        </button>
      </div>
      <div className="csw-table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Priority</th><th>Category</th><th>First Response</th><th>Resolution</th><th>Active</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={ST.cell}>Loading…</td></tr>
            ) : policies.length === 0 ? (
              <tr><td colSpan={7} style={ST.cell}>No SLA policies yet. Add one so tickets get a real SLA state.</td></tr>
            ) : (
              policies.map((p) => (
                <tr key={p.id}>
                  <td><b>{p.name || "-"}</b></td>
                  <td>{p.priority || "Any"}</td>
                  <td>{p.category || "Any"}</td>
                  <td>{p.firstResponseTargetMins != null ? `${p.firstResponseTargetMins} min` : "-"}</td>
                  <td>{p.resolutionTargetMins != null ? `${p.resolutionTargetMins} min` : "-"}</td>
                  <td><span className={`pill ${p.active ? "green" : ""}`}>{p.active ? "Active" : "Inactive"}</span></td>
                  <td>
                    <div className="row-actions">
                      <button onClick={() => open("policy", "edit", p.id)}><i data-lucide="pencil" style={{ width: 14, height: 14 }} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Escalation rules */}
      <div style={{ ...ST.blockHead, marginTop: 18 }}>
        <h3 style={ST.h3}>Escalation rules</h3>
        <button className="primary" onClick={() => open("escalation", "create")}>
          <i data-lucide="plus" style={{ width: 15, height: 15 }} />New Escalation
        </button>
      </div>
      <div className="csw-table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Trigger</th><th>Threshold</th><th>Action</th><th>Target</th><th>Active</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={ST.cell}>Loading…</td></tr>
            ) : escalations.length === 0 ? (
              <tr><td colSpan={7} style={ST.cell}>No escalation rules yet.</td></tr>
            ) : (
              escalations.map((e) => (
                <tr key={e.id}>
                  <td><b>{e.name || "-"}</b></td>
                  <td>{e.trigger || "-"}</td>
                  <td>{e.thresholdMins != null ? `${e.thresholdMins} min` : "-"}</td>
                  <td>{e.action || "-"}</td>
                  <td>{e.target || "-"}</td>
                  <td><span className={`pill ${e.active ? "green" : ""}`}>{e.active ? "Active" : "Inactive"}</span></td>
                  <td>
                    <div className="row-actions">
                      <button onClick={() => open("escalation", "edit", e.id)}><i data-lucide="pencil" style={{ width: 14, height: 14 }} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CsRuleModal
        key={`${modal.kind}-${modal.nonce}`}
        open={modal.open}
        mode={modal.mode}
        recordId={modal.id}
        entity={isPolicy ? "SLA policy" : "escalation rule"}
        fields={isPolicy ? POLICY_FIELDS : ESCALATION_FIELDS}
        api={isPolicy ? policyApi : escalationApi}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        onSaved={load}
      />
    </>
  );
}

const ST = {
  notice: { background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0", borderRadius: 8, padding: "8px 12px", fontSize: 13, marginBottom: 10 },
  error: { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", fontSize: 13, marginBottom: 10 },
  blockHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  h3: { fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 },
  cell: { textAlign: "center", padding: 24, color: "#64748b" },
};
