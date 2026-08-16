import React, { useEffect, useState, useCallback } from "react";
import { icons as lucideIcons } from "lucide-react";
import marketingApi from "../../api/marketingApi";
import { relativeTime } from "../sales/salesFormat";

// Forms & Landing Pages tab. Published forms accept REAL public submissions; each
// submission with an email creates a marketing lead (first-touch) so capture feeds
// attribution honestly. The owning account is derived from the form, never the
// submitter — so a public submit can never target another account.

const toPascal = (name = "") => name.split("-").filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
function I({ name, size = 15 }) {
  const Ic = lucideIcons[toPascal(name)] || lucideIcons.Circle;
  return <Ic size={size} strokeWidth={1.8} aria-hidden="true" />;
}

export default function MktForms() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", type: "form", fields: "name, email, phone", source: "" });
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    marketingApi.listForms({ limit: 100 })
      .then((res) => { if (!alive) return; setRows(res?.data || []); setErr(""); setLoading(false); })
      .catch(() => { if (!alive) return; setErr("Could not load forms."); setLoading(false); });
    return () => { alive = false; };
  }, [tick]);

  const create = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      const fields = form.fields.split(",").map((s) => s.trim()).filter(Boolean).map((key) => ({ key, label: key, type: key === "email" ? "email" : "text", required: key === "email" }));
      const f = await marketingApi.createForm({ name: form.name, type: form.type, fields, source: form.source || undefined });
      setCreating(false); setForm({ name: "", type: "form", fields: "name, email, phone", source: "" }); setSelected(f?.id || null); reload();
    } catch (_) {} finally { setBusy(false); }
  };
  const del = async (id) => { setBusy(true); try { await marketingApi.deleteForm(id); if (selected === id) setSelected(null); reload(); } catch (_) {} finally { setBusy(false); } };

  if (selected) return <FormDetail id={selected} onBack={() => { setSelected(null); reload(); }} />;

  return (
    <div className="mkw-msg">
      <div className="mkw-section-head">
        <div><h2>Forms & Landing Pages</h2><p>Capture leads from real submissions. Publish to accept public entries.</p></div>
        <div><button className="primary" onClick={() => setCreating((v) => !v)}><I name="plus" size={14} />New Form</button></div>
      </div>

      {creating && (
        <form className="mkw-msg-form" onSubmit={create}>
          <div className="mkw-msg-form-row">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="form">Form</option><option value="landing_page">Landing Page</option></select>
            <input placeholder="Form name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Source label (e.g. Website)" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
          </div>
          <input placeholder="Fields (comma separated, e.g. name, email, phone)" value={form.fields} onChange={(e) => setForm({ ...form, fields: e.target.value })} />
          <div className="mkw-msg-form-actions">
            <button type="button" onClick={() => setCreating(false)}>Cancel</button>
            <button className="primary" disabled={busy || !form.name.trim()}>Create draft</button>
          </div>
        </form>
      )}

      {err ? <p style={{ color: "#b91c1c", fontSize: 13 }}>{err}</p> : null}
      <div className="mkw-table-wrap">
        <table>
          <thead><tr><th>Form</th><th>Type</th><th>Status</th><th>Submissions</th><th>Leads</th><th>Updated</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={CELL}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} style={CELL}>No forms yet. Create your first form or landing page.</td></tr>
            ) : rows.map((f) => (
              <tr key={f.id}>
                <td><b>{f.name || "Untitled"}</b></td>
                <td>{f.type === "landing_page" ? "Landing Page" : "Form"}</td>
                <td><span className={`pill ${f.status === "Published" ? "green" : "gray"}`}>{f.status}</span></td>
                <td>{f.submissions}</td>
                <td>{f.leads}</td>
                <td>{relativeTime(f.updatedAt)}</td>
                <td>
                  <div className="row-actions">
                    <button title="Open" onClick={() => setSelected(f.id)}><I name="eye" size={14} /></button>
                    <button title="Delete" disabled={busy} onClick={() => del(f.id)}><I name="trash-2" size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FormDetail({ id, onBack }) {
  const [f, setF] = useState(null);
  const [subs, setSubs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    Promise.all([marketingApi.getForm(id), marketingApi.listSubmissions(id)])
      .then(([form, s]) => { if (!alive) return; setF(form); setSubs(s || []); })
      .catch(() => {});
    return () => { alive = false; };
  }, [id, tick]);

  const publish = async () => { setBusy(true); try { await marketingApi.updateForm(id, { status: f.status === "Published" ? "Draft" : "Published" }); reload(); } catch (_) {} finally { setBusy(false); } };
  const publicUrl = marketingApi.publicFormUrl(id);
  const copy = () => { try { navigator.clipboard.writeText(publicUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch (_) {} };
  const testSubmit = async () => {
    setBusy(true);
    try { await marketingApi.submitPublicForm(id, { email: `test+${Date.now()}@example.com`, name: "Test Submission", data: { note: "test" } }); reload(); } catch (_) {} finally { setBusy(false); }
  };

  if (!f) return <p style={MUTED}>Loading…</p>;
  const fields = Array.isArray(f.fields) ? f.fields : [];
  const isPublished = f.status === "Published";
  return (
    <div className="mkw-msg-detail">
      <button className="mkw-back" onClick={onBack}><I name="arrow-left" size={14} />Back to forms</button>
      <div className="mkw-panel">
        <div className="mkw-panel-head"><b>{f.name}</b><span className={`pill ${isPublished ? "green" : "gray"}`}>{f.status}</span></div>
        <div className="mkw-msg-stats">
          <div><span>Submissions</span><strong>{f.submissions}</strong></div>
          <div><span>Leads created</span><strong>{f.leads}</strong></div>
          <div><span>Type</span><strong style={{ fontSize: 15 }}>{f.type === "landing_page" ? "Landing Page" : "Form"}</strong></div>
          <div><span>Fields</span><strong style={{ fontSize: 15 }}>{fields.length}</strong></div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "6px 2px" }}>
          {fields.map((fl) => (<span key={fl.key} className="pill gray" style={{ fontSize: 11 }}>{fl.label || fl.key}{fl.required ? " *" : ""}</span>))}
        </div>
        <div className="mkw-msg-send">
          <button className="primary" disabled={busy} onClick={publish} style={{ background: isPublished ? "#64748b" : "#16a34a", borderColor: isPublished ? "#64748b" : "#16a34a" }}>
            <I name={isPublished ? "eye-off" : "globe"} size={14} />{isPublished ? "Unpublish" : "Publish"}
          </button>
          {isPublished && (
            <div className="mkw-add-recips" style={{ alignItems: "center" }}>
              <input readOnly value={publicUrl} style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "#475569" }} />
              <button onClick={copy}><I name="copy" size={14} />{copied ? "Copied" : "Copy link"}</button>
              <button disabled={busy} onClick={testSubmit}><I name="flask-conical" size={14} />Test submit</button>
            </div>
          )}
          {!isPublished ? <p style={{ ...MUTED, fontSize: 11 }}>Publish the form to accept public submissions. Submissions with an email create a lead automatically.</p> : null}
        </div>
      </div>

      <div className="mkw-panel">
        <div className="mkw-panel-head"><b>Submissions</b><span style={{ fontSize: 12, color: "#94a3b8" }}>{subs.length} shown</span></div>
        <div className="mini-list">
          {subs.length === 0 ? (
            <p style={MUTED}>No submissions yet.</p>
          ) : subs.map((s) => (
            <p key={s.id} className="mkw-recip-row">
              <span><b>{s.email || s.name || "Submission"}</b><small>{[s.name, s.leadId ? "lead created" : null, relativeTime(s.createdAt)].filter(Boolean).join(" · ")}</small></span>
              {s.leadId ? <span className="pill green" style={{ fontSize: 11 }}>Lead</span> : null}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

const CELL = { textAlign: "center", padding: 20, color: "#64748b" };
const MUTED = { color: "#94a3b8", fontSize: 13, padding: "8px 2px" };
