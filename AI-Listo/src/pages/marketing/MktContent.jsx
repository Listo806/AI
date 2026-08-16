import React, { useEffect, useState, useCallback } from "react";
import { icons as lucideIcons } from "lucide-react";
import marketingApi from "../../api/marketingApi";
import { relativeTime } from "../sales/salesFormat";

// Content tab. A real, team-scoped content library (email templates, posts, pages,
// assets). Nothing is fabricated — rows exist only when the account creates them.

const toPascal = (name = "") => name.split("-").filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
function I({ name, size = 15 }) {
  const Ic = lucideIcons[toPascal(name)] || lucideIcons.Circle;
  return <Ic size={size} strokeWidth={1.8} aria-hidden="true" />;
}

const TYPES = [["email_template", "Email Template"], ["blog", "Blog Post"], ["social", "Social Post"], ["landing", "Landing Copy"], ["asset", "Asset"], ["other", "Other"]];
const typeLabel = (t) => (TYPES.find((x) => x[0] === t) || [t, t])[1];

export default function MktContent() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", type: "email_template", status: "Draft", body: "", url: "" });
  const [busy, setBusy] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    marketingApi.listContent({ type: typeFilter || undefined, limit: 100 })
      .then((res) => { if (!alive) return; setRows(res?.data || []); setErr(""); setLoading(false); })
      .catch(() => { if (!alive) return; setErr("Could not load content."); setLoading(false); });
    return () => { alive = false; };
  }, [typeFilter, tick]);

  const create = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setBusy(true);
    try {
      await marketingApi.createContent({ title: form.title, type: form.type, status: form.status, body: form.body || undefined, url: form.url || undefined });
      setCreating(false); setForm({ title: "", type: "email_template", status: "Draft", body: "", url: "" }); reload();
    } catch (_) {} finally { setBusy(false); }
  };
  const setStatus = async (id, status) => { setBusy(true); try { await marketingApi.updateContent(id, { status }); reload(); } catch (_) {} finally { setBusy(false); } };
  const del = async (id) => { setBusy(true); try { await marketingApi.deleteContent(id); reload(); } catch (_) {} finally { setBusy(false); } };

  return (
    <div className="mkw-msg">
      <div className="mkw-section-head">
        <div><h2>Content</h2><p>Store and manage the assets your campaigns use.</p></div>
        <div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option value="">All Types</option>{TYPES.map(([v, l]) => (<option key={v} value={v}>{l}</option>))}</select>
          <button className="primary" onClick={() => setCreating((v) => !v)}><I name="plus" size={14} />New Content</button>
        </div>
      </div>

      {creating && (
        <form className="mkw-msg-form" onSubmit={create}>
          <div className="mkw-msg-form-row">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{TYPES.map(([v, l]) => (<option key={v} value={v}>{l}</option>))}</select>
            <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Draft</option><option>Published</option><option>Archived</option></select>
          </div>
          <input placeholder="URL (optional)" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          <textarea placeholder="Body / notes (optional)" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={3} />
          <div className="mkw-msg-form-actions">
            <button type="button" onClick={() => setCreating(false)}>Cancel</button>
            <button className="primary" disabled={busy || !form.title.trim()}>Create</button>
          </div>
        </form>
      )}

      {err ? <p style={{ color: "#b91c1c", fontSize: 13 }}>{err}</p> : null}
      <div className="mkw-table-wrap">
        <table>
          <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={CELL}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} style={CELL}>No content yet. Create your first asset.</td></tr>
            ) : rows.map((c) => (
              <tr key={c.id}>
                <td><b>{c.title || "Untitled"}</b>{c.url ? <small style={{ display: "block", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 320, whiteSpace: "nowrap" }}>{c.url}</small> : null}</td>
                <td>{typeLabel(c.type)}</td>
                <td><span className={`pill ${c.status === "Published" ? "green" : c.status === "Archived" ? "gray" : "amber"}`}>{c.status}</span></td>
                <td>{relativeTime(c.updatedAt)}</td>
                <td>
                  <div className="row-actions">
                    {c.status !== "Published" ? <button title="Publish" disabled={busy} onClick={() => setStatus(c.id, "Published")}><I name="check" size={14} /></button> : <button title="Unpublish" disabled={busy} onClick={() => setStatus(c.id, "Draft")}><I name="eye-off" size={14} /></button>}
                    <button title="Delete" disabled={busy} onClick={() => del(c.id)}><I name="trash-2" size={14} /></button>
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

const CELL = { textAlign: "center", padding: 20, color: "#64748b" };
