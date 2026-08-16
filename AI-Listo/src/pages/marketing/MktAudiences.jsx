import React, { useEffect, useState, useCallback } from "react";
import { icons as lucideIcons } from "lucide-react";
import marketingApi from "../../api/marketingApi";
import { relativeTime } from "../sales/salesFormat";

// Audiences tab. Segments of real people (static member lists). Member counts are
// computed from actual members, never estimated. Everything is team-scoped.

const toPascal = (name = "") => name.split("-").filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
function I({ name, size = 15 }) {
  const Ic = lucideIcons[toPascal(name)] || lucideIcons.Circle;
  return <Ic size={size} strokeWidth={1.8} aria-hidden="true" />;
}

export default function MktAudiences() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    marketingApi.listAudiences({ limit: 100 })
      .then((res) => { if (!alive) return; setRows(res?.data || []); setErr(""); setLoading(false); })
      .catch(() => { if (!alive) return; setErr("Could not load audiences."); setLoading(false); });
    return () => { alive = false; };
  }, [tick]);

  const create = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      const a = await marketingApi.createAudience({ name: form.name, description: form.description || undefined, type: "static" });
      setCreating(false); setForm({ name: "", description: "" }); setSelected(a?.id || null); reload();
    } catch (_) {} finally { setBusy(false); }
  };
  const del = async (id) => { setBusy(true); try { await marketingApi.deleteAudience(id); if (selected === id) setSelected(null); reload(); } catch (_) {} finally { setBusy(false); } };

  if (selected) return <AudienceDetail id={selected} onBack={() => { setSelected(null); reload(); }} />;

  return (
    <div className="mkw-msg">
      <div className="mkw-section-head">
        <div><h2>Audiences</h2><p>Group real contacts and leads into segments. Counts reflect actual members.</p></div>
        <div><button className="primary" onClick={() => setCreating((v) => !v)}><I name="plus" size={14} />New Audience</button></div>
      </div>

      {creating && (
        <form className="mkw-msg-form" onSubmit={create}>
          <div className="mkw-msg-form-row">
            <input placeholder="Audience name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="mkw-msg-form-actions">
            <button type="button" onClick={() => setCreating(false)}>Cancel</button>
            <button className="primary" disabled={busy || !form.name.trim()}>Create</button>
          </div>
        </form>
      )}

      {err ? <p style={{ color: "#b91c1c", fontSize: 13 }}>{err}</p> : null}
      <div className="mkw-table-wrap">
        <table>
          <thead><tr><th>Audience</th><th>Type</th><th>Members</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={CELL}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} style={CELL}>No audiences yet. Create your first segment.</td></tr>
            ) : rows.map((a) => (
              <tr key={a.id}>
                <td><b>{a.name || "Untitled"}</b>{a.description ? <small style={{ display: "block", color: "#94a3b8" }}>{a.description}</small> : null}</td>
                <td>{a.type === "dynamic" ? "Dynamic" : "Static"}</td>
                <td>{a.memberCount}</td>
                <td><span className={`pill ${a.status === "Active" ? "green" : "gray"}`}>{a.status}</span></td>
                <td>{relativeTime(a.updatedAt)}</td>
                <td>
                  <div className="row-actions">
                    <button title="Open" onClick={() => setSelected(a.id)}><I name="eye" size={14} /></button>
                    <button title="Delete" disabled={busy} onClick={() => del(a.id)}><I name="trash-2" size={14} /></button>
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

function AudienceDetail({ id, onBack }) {
  const [aud, setAud] = useState(null);
  const [members, setMembers] = useState([]);
  const [addr, setAddr] = useState("");
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    Promise.all([marketingApi.getAudience(id), marketingApi.listAudienceMembers(id)])
      .then(([a, m]) => { if (!alive) return; setAud(a); setMembers(m || []); })
      .catch(() => {});
    return () => { alive = false; };
  }, [id, tick]);

  const add = async () => {
    const list = addr.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean).map((email) => ({ email }));
    if (!list.length) return;
    setBusy(true);
    try { await marketingApi.addAudienceMembers(id, list); setAddr(""); reload(); } catch (_) {} finally { setBusy(false); }
  };
  const remove = async (memberId) => { setBusy(true); try { await marketingApi.removeAudienceMember(id, memberId); reload(); } catch (_) {} finally { setBusy(false); } };

  if (!aud) return <p style={MUTED}>Loading…</p>;
  return (
    <div className="mkw-msg-detail">
      <button className="mkw-back" onClick={onBack}><I name="arrow-left" size={14} />Back to audiences</button>
      <div className="mkw-panel">
        <div className="mkw-panel-head"><b>{aud.name}</b><span className={`pill ${aud.status === "Active" ? "green" : "gray"}`}>{aud.status}</span></div>
        <div className="mkw-msg-stats">
          <div><span>Members</span><strong>{aud.memberCount}</strong></div>
          <div><span>Type</span><strong style={{ fontSize: 15 }}>{aud.type === "dynamic" ? "Dynamic" : "Static"}</strong></div>
        </div>
        <div className="mkw-add-recips">
          <textarea placeholder="Add members — one email per line" value={addr} onChange={(e) => setAddr(e.target.value)} rows={2} />
          <button disabled={busy || !addr.trim()} onClick={add}><I name="user-plus" size={14} />Add</button>
        </div>
      </div>
      <div className="mkw-panel">
        <div className="mkw-panel-head"><b>Members</b><span style={{ fontSize: 12, color: "#94a3b8" }}>{members.length} shown</span></div>
        <div className="mini-list">
          {members.length === 0 ? (
            <p style={MUTED}>No members yet. Add emails above.</p>
          ) : members.map((m) => (
            <p key={m.id} className="mkw-recip-row">
              <span><b>{m.email || m.name || "Member"}</b>{m.name && m.email ? <small>{m.name}</small> : null}</span>
              <span className="mkw-lead-actions"><button disabled={busy} title="Remove" onClick={() => remove(m.id)}><I name="trash-2" size={14} /></button></span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

const CELL = { textAlign: "center", padding: 20, color: "#64748b" };
const MUTED = { color: "#94a3b8", fontSize: 13, padding: "8px 2px" };
