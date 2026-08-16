import React, { useEffect, useState, useCallback } from "react";
import { icons as lucideIcons } from "lucide-react";
import marketingApi from "../../api/marketingApi";
import { relativeTime } from "../sales/salesFormat";

// Automation tab, with three real sub-views:
//  - Automations: idempotent WHEN-trigger-THEN-action rules (runs never duplicate).
//  - Integrations: honest connection status; an unconnected provider shows "Not
//    Connected" and NO external performance is ever fabricated.
//  - Assistant: answers strictly from THIS account's marketing data (team-isolated).

const toPascal = (name = "") => name.split("-").filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
function I({ name, size = 15 }) {
  const Ic = lucideIcons[toPascal(name)] || lucideIcons.Circle;
  return <Ic size={size} strokeWidth={1.8} aria-hidden="true" />;
}

const TRIGGERS = [["form_submission", "Form submission"], ["lead_created", "Lead created"], ["conversion", "Conversion"], ["audience_added", "Added to audience"], ["manual", "Manual"]];
const ACTIONS = [["add_tag", "Add tag"], ["add_to_audience", "Add to audience"], ["create_task", "Create task"], ["notify", "Notify team"], ["send_message", "Send message"]];
const label = (list, v) => (list.find((x) => x[0] === v) || [v, v])[1];

export default function MktAutomation() {
  const [view, setView] = useState("automations");
  return (
    <div className="mkw-msg">
      <div className="mkw-section-head">
        <div><h2>Automation</h2><p>Automate follow-up, connect tools, and ask about your own data.</p></div>
        <div>
          <button className={view === "automations" ? "primary" : ""} onClick={() => setView("automations")}><I name="network" size={14} />Automations</button>
          <button className={view === "integrations" ? "primary" : ""} onClick={() => setView("integrations")}><I name="plug" size={14} />Integrations</button>
          <button className={view === "assistant" ? "primary" : ""} onClick={() => setView("assistant")}><I name="sparkles" size={14} />Assistant</button>
        </div>
      </div>
      {view === "automations" ? <Automations /> : view === "integrations" ? <Integrations /> : <Assistant />}
    </div>
  );
}

function Automations() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", triggerType: "form_submission", actionType: "add_tag", tag: "", audienceId: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    marketingApi.listAutomations({ limit: 100 })
      .then((res) => { if (!alive) return; setRows(res?.data || []); setErr(""); setLoading(false); })
      .catch(() => { if (!alive) return; setErr("Could not load automations."); setLoading(false); });
    return () => { alive = false; };
  }, [tick]);

  const create = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      const actionConfig = form.actionType === "add_tag" ? { tag: form.tag || "lead" } : form.actionType === "add_to_audience" && form.audienceId ? { audienceId: form.audienceId } : {};
      await marketingApi.createAutomation({ name: form.name, triggerType: form.triggerType, actionType: form.actionType, actionConfig });
      setCreating(false); setForm({ name: "", triggerType: "form_submission", actionType: "add_tag", tag: "", audienceId: "" }); reload();
    } catch (_) {} finally { setBusy(false); }
  };
  const toggle = async (a) => { setBusy(true); try { await marketingApi.updateAutomation(a.id, { status: a.status === "Active" ? "Paused" : "Active" }); reload(); } catch (_) {} finally { setBusy(false); } };
  const del = async (id) => { setBusy(true); try { await marketingApi.deleteAutomation(id); reload(); } catch (_) {} finally { setBusy(false); } };

  return (
    <>
      <div className="mkw-filters" style={{ justifyContent: "flex-end" }}>
        <button className="primary" onClick={() => setCreating((v) => !v)}><I name="plus" size={14} />New Automation</button>
      </div>
      {creating && (
        <form className="mkw-msg-form" onSubmit={create}>
          <div className="mkw-msg-form-row">
            <input placeholder="Automation name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select value={form.triggerType} onChange={(e) => setForm({ ...form, triggerType: e.target.value })}>{TRIGGERS.map(([v, l]) => (<option key={v} value={v}>When: {l}</option>))}</select>
            <select value={form.actionType} onChange={(e) => setForm({ ...form, actionType: e.target.value })}>{ACTIONS.map(([v, l]) => (<option key={v} value={v}>Then: {l}</option>))}</select>
          </div>
          {form.actionType === "add_tag" && <input placeholder="Tag to add" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} />}
          {form.actionType === "add_to_audience" && <input placeholder="Audience ID" value={form.audienceId} onChange={(e) => setForm({ ...form, audienceId: e.target.value })} />}
          <div className="mkw-msg-form-actions">
            <button type="button" onClick={() => setCreating(false)}>Cancel</button>
            <button className="primary" disabled={busy || !form.name.trim()}>Create</button>
          </div>
        </form>
      )}
      {err ? <p style={{ color: "#b91c1c", fontSize: 13 }}>{err}</p> : null}
      <div className="mkw-table-wrap">
        <table>
          <thead><tr><th>Automation</th><th>When</th><th>Then</th><th>Status</th><th>Last run</th><th>Runs</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={CELL}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} style={CELL}>No automations yet. Create your first rule.</td></tr>
            ) : rows.map((a) => (
              <tr key={a.id}>
                <td><b>{a.name || "Untitled"}</b></td>
                <td>{label(TRIGGERS, a.triggerType)}</td>
                <td>{label(ACTIONS, a.actionType)}</td>
                <td><span className={`pill ${a.status === "Active" ? "green" : "gray"}`}>{a.status}</span></td>
                <td>{a.lastRunAt ? relativeTime(a.lastRunAt) : "—"}</td>
                <td>{a.runCount ?? 0}</td>
                <td>
                  <div className="row-actions">
                    <button title={a.status === "Active" ? "Pause" : "Activate"} disabled={busy} onClick={() => toggle(a)}><I name={a.status === "Active" ? "pause" : "play"} size={14} /></button>
                    <button title="Delete" disabled={busy} onClick={() => del(a.id)}><I name="trash-2" size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ ...MUTED, fontSize: 11 }}>Automations are idempotent — the same rule applies to a given record only once, so no duplicate actions or sends.</p>
    </>
  );
}

function Integrations() {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    marketingApi.listIntegrations().then((res) => { if (alive) setRows(res?.data || []); }).catch(() => {});
    return () => { alive = false; };
  }, [tick]);

  const connect = async (provider) => { setBusy(true); try { await marketingApi.connectIntegration({ provider, status: "connected" }); reload(); } catch (_) {} finally { setBusy(false); } };
  const disconnect = async (provider) => { setBusy(true); try { await marketingApi.disconnectIntegration(provider); reload(); } catch (_) {} finally { setBusy(false); } };

  return (
    <div className="mkw-integrations">
      {rows.length === 0 ? (
        <p style={MUTED}>Loading integrations…</p>
      ) : rows.map((it) => {
        const connected = it.status === "connected";
        return (
          <div key={it.provider} className="mkw-integration-card">
            <div className="mkw-integration-head">
              <span className="mkw-integration-icon"><I name={it.icon || "plug"} size={18} /></span>
              <div><b>{it.label}</b><small>{it.category}</small></div>
            </div>
            <div className="mkw-integration-foot">
              <span className={`pill ${connected ? "green" : "gray"}`}>{connected ? "Connected" : "Not Connected"}</span>
              {connected ? (
                <button disabled={busy} onClick={() => disconnect(it.provider)}>Disconnect</button>
              ) : (
                <button className="primary" disabled={busy} onClick={() => connect(it.provider)}>Connect</button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Assistant() {
  const [q, setQ] = useState("");
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const ask = async (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    try { const r = await marketingApi.aiQuery(q.trim()); setRes(r); } catch (_) { setRes({ answer: "Could not answer right now." }); } finally { setBusy(false); }
  };
  return (
    <div className="mkw-panel">
      <div className="mkw-panel-head"><b>Ask about your marketing</b><span style={{ fontSize: 12, color: "#94a3b8" }}>Answers only from your account</span></div>
      <form className="mkw-add-recips" onSubmit={ask} style={{ alignItems: "center" }}>
        <input placeholder="e.g. Which channel brought the most leads this month?" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 8, padding: "9px 11px", fontSize: 13 }} />
        <button className="primary" disabled={busy || !q.trim()} style={{ background: "#2563eb", color: "#fff", borderColor: "#2563eb" }}><I name="sparkles" size={14} />Ask</button>
      </form>
      {res && (
        <div className="mkw-ai-answer">
          <p style={{ fontSize: 13, color: "#0f172a", whiteSpace: "pre-wrap" }}>{res.answer}</p>
          {Array.isArray(res.facts) && res.facts.length > 0 && (
            <div className="mkw-ai-facts">
              {res.facts.map((f, i) => (<p key={i}><I name="dot" size={14} /><span>{f}</span></p>))}
            </div>
          )}
          <p style={{ ...MUTED, fontSize: 11 }}>Based only on your account's records. No external or fabricated data.</p>
        </div>
      )}
    </div>
  );
}

const CELL = { textAlign: "center", padding: 20, color: "#64748b" };
const MUTED = { color: "#94a3b8", fontSize: 13, padding: "8px 2px" };
