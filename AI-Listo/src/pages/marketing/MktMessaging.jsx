import React, { useEffect, useState, useCallback } from "react";
import { icons as lucideIcons } from "lucide-react";
import marketingApi from "../../api/marketingApi";
import { formatDate, relativeTime } from "../sales/salesFormat";

// Email & SMS tab. Sending marks recipients as attempted; delivery/open/click are
// recorded as REAL events (as a provider webhook would post them) — never inferred.
// Suppression (unsubscribe/bounce/complaint) is enforced: suppressed addresses are
// skipped at add and at send. Open Rate / CTR come from delivered + distinct openers.

const toPascal = (name = "") => name.split("-").filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
function I({ name, size = 15 }) {
  const Ic = lucideIcons[toPascal(name)] || lucideIcons.Circle;
  return <Ic size={size} strokeWidth={1.8} aria-hidden="true" />;
}

const STATUS_TONE = { Draft: "gray", Scheduled: "amber", Sent: "green", Canceled: "rose" };
const rate = (num, den) => (den > 0 ? `${Math.round((num / den) * 1000) / 10}%` : "—");
const EVENTS = [["delivered", "Delivered"], ["open", "Open"], ["click", "Click"], ["bounce", "Bounce"], ["unsubscribe", "Unsub"]];

export default function MktMessaging() {
  const [tab, setTab] = useState("messages"); // messages | suppression
  const [channel, setChannel] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ channel: "Email", name: "", subject: "", fromName: "", fromAddress: "", body: "" });
  const [busy, setBusy] = useState(false);

  const [selected, setSelected] = useState(null); // message id in detail view

  useEffect(() => {
    if (tab !== "messages") return undefined;
    let alive = true;
    setLoading(true);
    marketingApi.listMessages({ channel: channel || undefined, status: status || undefined, search: search || undefined, limit: 50 })
      .then((res) => { if (!alive) return; setRows(res?.data || []); setErr(""); setLoading(false); })
      .catch(() => { if (!alive) return; setErr("Could not load messages."); setLoading(false); });
    return () => { alive = false; };
  }, [tab, channel, status, search, tick]);

  const create = async (e) => {
    e.preventDefault();
    if (!form.name && !form.subject) return;
    setBusy(true);
    try {
      const m = await marketingApi.createMessage({
        channel: form.channel,
        name: form.name || undefined,
        subject: form.subject || undefined,
        fromName: form.fromName || undefined,
        fromAddress: form.fromAddress || undefined,
        body: form.body || undefined,
      });
      setCreating(false);
      setForm({ channel: "Email", name: "", subject: "", fromName: "", fromAddress: "", body: "" });
      setSelected(m?.id || null);
      reload();
    } catch (_) {} finally { setBusy(false); }
  };

  const del = async (id) => { setBusy(true); try { await marketingApi.deleteMessage(id); if (selected === id) setSelected(null); reload(); } catch (_) {} finally { setBusy(false); } };

  return (
    <div className="mkw-msg">
      <div className="mkw-section-head">
        <div><h2>Email & SMS</h2><p>Build and send campaigns. Delivery, opens and clicks are recorded from real events, never estimated.</p></div>
        <div>
          <button className={tab === "messages" ? "primary" : ""} onClick={() => setTab("messages")}><I name="mail" size={14} />Messages</button>
          <button className={tab === "suppression" ? "primary" : ""} onClick={() => setTab("suppression")}><I name="shield-off" size={14} />Suppression</button>
        </div>
      </div>

      {tab === "suppression" ? (
        <SuppressionPanel />
      ) : selected ? (
        <MessageDetail id={selected} onBack={() => { setSelected(null); reload(); }} onChanged={reload} />
      ) : (
        <>
          <div className="mkw-filters">
            <label><I name="search" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search messages..." /></label>
            <select value={channel} onChange={(e) => setChannel(e.target.value)}><option value="">All Channels</option><option>Email</option><option>SMS</option></select>
            <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All Statuses</option><option>Draft</option><option>Scheduled</option><option>Sent</option></select>
            <button className="primary" onClick={() => setCreating((v) => !v)}><I name="plus" size={14} />New Message</button>
          </div>

          {creating && (
            <form className="mkw-msg-form" onSubmit={create}>
              <div className="mkw-msg-form-row">
                <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}><option>Email</option><option>SMS</option></select>
                <input placeholder="Internal name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                {form.channel === "Email" && <input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />}
              </div>
              {form.channel === "Email" && (
                <div className="mkw-msg-form-row">
                  <input placeholder="From name" value={form.fromName} onChange={(e) => setForm({ ...form, fromName: e.target.value })} />
                  <input placeholder="From address" value={form.fromAddress} onChange={(e) => setForm({ ...form, fromAddress: e.target.value })} />
                </div>
              )}
              <textarea placeholder="Message body" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={3} />
              <div className="mkw-msg-form-actions">
                <button type="button" onClick={() => setCreating(false)}>Cancel</button>
                <button className="primary" disabled={busy || (!form.name && !form.subject)}>Create draft</button>
              </div>
            </form>
          )}

          {err ? <p style={{ color: "#b91c1c", fontSize: 13 }}>{err}</p> : null}
          <div className="mkw-table-wrap">
            <table>
              <thead><tr><th>Message</th><th>Channel</th><th>Status</th><th>Recipients</th><th>Delivered</th><th>Open Rate</th><th>CTR</th><th>Sent</th><th>Actions</th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={CELL}>Loading…</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={9} style={CELL}>No messages yet. Create your first email or SMS.</td></tr>
                ) : rows.map((m) => (
                  <tr key={m.id}>
                    <td><b>{m.name || m.subject || "Untitled"}</b>{m.subject && m.name ? <small style={{ display: "block", color: "#94a3b8" }}>{m.subject}</small> : null}</td>
                    <td>{m.channel}</td>
                    <td><span className={`pill ${(STATUS_TONE[m.status] || "gray")}`}>{m.status}</span></td>
                    <td>{m.recipients}</td>
                    <td>{m.delivered}</td>
                    <td>{rate(m.opens, m.delivered)}</td>
                    <td>{rate(m.clicks, m.delivered)}</td>
                    <td>{m.sentAt ? formatDate(m.sentAt) : "—"}</td>
                    <td>
                      <div className="row-actions">
                        <button title="Open" onClick={() => setSelected(m.id)}><I name="eye" size={14} /></button>
                        <button title="Delete" disabled={busy} onClick={() => del(m.id)}><I name="trash-2" size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function MessageDetail({ id, onBack, onChanged }) {
  const [msg, setMsg] = useState(null);
  const [recips, setRecips] = useState([]);
  const [busy, setBusy] = useState(false);
  const [addr, setAddr] = useState("");
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    Promise.all([marketingApi.getMessage(id), marketingApi.listRecipients(id)])
      .then(([m, r]) => { if (!alive) return; setMsg(m); setRecips(r || []); })
      .catch(() => {});
    return () => { alive = false; };
  }, [id, tick]);

  const addRecipients = async () => {
    const list = addr.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean).map((address) => ({ address }));
    if (!list.length) return;
    setBusy(true);
    try { await marketingApi.addRecipients(id, list); setAddr(""); reload(); onChanged && onChanged(); } catch (_) {} finally { setBusy(false); }
  };
  const send = async () => { setBusy(true); try { await marketingApi.sendMessage(id); reload(); onChanged && onChanged(); } catch (_) {} finally { setBusy(false); } };
  const event = async (recipientId, eventType) => {
    setBusy(true);
    try {
      await marketingApi.recordEvent(id, { eventType, recipientId, dedupKey: `ui-${recipientId}-${eventType}` });
      reload(); onChanged && onChanged();
    } catch (_) {} finally { setBusy(false); }
  };

  if (!msg) return <p style={MUTED}>Loading…</p>;
  const isSent = msg.status === "Sent";
  return (
    <div className="mkw-msg-detail">
      <button className="mkw-back" onClick={onBack}><I name="arrow-left" size={14} />Back to messages</button>
      <div className="mkw-panel">
        <div className="mkw-panel-head">
          <b>{msg.name || msg.subject || "Message"}</b>
          <span className={`pill ${(STATUS_TONE[msg.status] || "gray")}`}>{msg.status}</span>
        </div>
        <div className="mkw-msg-stats">
          <div><span>Recipients</span><strong>{msg.recipients}</strong></div>
          <div><span>Delivered</span><strong>{msg.delivered}</strong></div>
          <div><span>Opens</span><strong>{msg.opens}</strong><small>{rate(msg.opens, msg.delivered)}</small></div>
          <div><span>Clicks</span><strong>{msg.clicks}</strong><small>{rate(msg.clicks, msg.delivered)}</small></div>
        </div>
        {msg.subject ? <p style={{ fontSize: 13, color: "#475569", margin: "4px 2px" }}><b>Subject:</b> {msg.subject}</p> : null}
        {msg.body ? <p style={{ fontSize: 13, color: "#64748b", margin: "2px 2px", whiteSpace: "pre-wrap" }}>{msg.body}</p> : null}
        {!isSent && (
          <div className="mkw-msg-send">
            <div className="mkw-add-recips">
              <textarea placeholder="Add recipients — one address per line (suppressed addresses are skipped)" value={addr} onChange={(e) => setAddr(e.target.value)} rows={2} />
              <button disabled={busy || !addr.trim()} onClick={addRecipients}><I name="user-plus" size={14} />Add</button>
            </div>
            <button className="primary" disabled={busy || !msg.recipients} onClick={send}><I name="send" size={14} />Send message</button>
          </div>
        )}
      </div>

      <div className="mkw-panel">
        <div className="mkw-panel-head"><b>Recipients</b><span style={{ fontSize: 12, color: "#94a3b8" }}>{recips.length} shown</span></div>
        <div className="mini-list">
          {recips.length === 0 ? (
            <p style={MUTED}>No recipients yet. Add addresses above.</p>
          ) : recips.map((r) => (
            <p key={r.id} className="mkw-recip-row">
              <span><b>{r.address}</b><small>{r.status}{r.deliveredAt ? ` · delivered ${relativeTime(r.deliveredAt)}` : ""}</small></span>
              {isSent && r.status !== "Suppressed" && (
                <span className="mkw-recip-events">
                  {EVENTS.map(([ev, label]) => (
                    <button key={ev} disabled={busy} title={`Record ${label}`} onClick={() => event(r.id, ev)}>{label}</button>
                  ))}
                </span>
              )}
              {r.status === "Suppressed" ? <span className="pill rose">Suppressed</span> : null}
            </p>
          ))}
        </div>
        {isSent ? <p style={{ ...MUTED, fontSize: 11 }}>Events mirror what an email/SMS provider webhook would post. They drive delivered/open/click and enforce suppression.</p> : null}
      </div>
    </div>
  );
}

function SuppressionPanel() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ address: "", channel: "Email", reason: "manual" });
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    marketingApi.listSuppression({ search: search || undefined, limit: 100 })
      .then((res) => { if (alive) setRows(res?.data || []); }).catch(() => {});
    return () => { alive = false; };
  }, [search, tick]);

  const add = async (e) => {
    e.preventDefault();
    if (!form.address.trim()) return;
    setBusy(true);
    try { await marketingApi.addSuppression(form); setForm({ address: "", channel: "Email", reason: "manual" }); reload(); } catch (_) {} finally { setBusy(false); }
  };
  const del = async (id) => { setBusy(true); try { await marketingApi.deleteSuppression(id); reload(); } catch (_) {} finally { setBusy(false); } };

  return (
    <div className="mkw-panel">
      <div className="mkw-panel-head"><b>Suppression List</b><span style={{ fontSize: 12, color: "#94a3b8" }}>Never contacted again</span></div>
      <form className="mkw-lead-form" onSubmit={add} style={{ gridTemplateColumns: "1fr 120px 130px auto" }}>
        <input placeholder="Address (email or phone)" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}><option>Email</option><option>SMS</option></select>
        <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}><option value="manual">Manual</option><option value="unsubscribe">Unsubscribe</option><option value="complaint">Complaint</option><option value="bounce">Bounce</option></select>
        <button className="primary" disabled={busy || !form.address.trim()}><I name="plus" size={14} />Suppress</button>
      </form>
      <label style={{ display: "flex", alignItems: "center", gap: 6, margin: "4px 2px 10px", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 10px", maxWidth: 320 }}>
        <I name="search" size={14} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search addresses..." style={{ border: "none", outline: "none", fontSize: 13, flex: 1 }} />
      </label>
      <div className="mini-list">
        {rows.length === 0 ? (
          <p style={MUTED}>No suppressed addresses. Unsubscribes, bounces and complaints land here automatically.</p>
        ) : rows.map((r) => (
          <p key={r.id} className="mkw-recip-row">
            <span><b>{r.address}</b><small>{r.channel} · {r.reason || "manual"} · {relativeTime(r.createdAt)}</small></span>
            <span className="mkw-lead-actions"><button disabled={busy} title="Remove" onClick={() => del(r.id)}><I name="trash-2" size={14} /></button></span>
          </p>
        ))}
      </div>
    </div>
  );
}

const CELL = { textAlign: "center", padding: 20, color: "#64748b" };
const MUTED = { color: "#94a3b8", fontSize: 13, padding: "8px 2px" };
