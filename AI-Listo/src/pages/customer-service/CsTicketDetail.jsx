import React, { useEffect, useRef, useState } from "react";
import { Send, Paperclip, Download, Trash2, StickyNote, MessageSquare } from "lucide-react";
import InsuranceWorkModal from "../insurance/InsuranceWorkModal";
import customerServiceApi from "../../api/customerServiceApi";
import { relativeTime } from "../sales/salesFormat";

// Ticket conversation view: real messages, internal notes, activity trail and
// private attachments for one ticket, all account-isolated on the server. Internal
// notes are visually distinct and labelled; a customer-facing channel would filter
// them out (this is the agent workspace, so agents see them).

function fmtSize(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
function fmtTime(v) {
  if (!v) return "";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "" : d.toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const TYPE_LABEL = {
  customer: "Customer",
  agent: "Agent",
  internal_note: "Internal note",
  system: "System",
};

export default function CsTicketDetail({ open, ticketId, onClose, onEdit, onChanged }) {
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activity, setActivity] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [composer, setComposer] = useState("");
  const [composeType, setComposeType] = useState("agent"); // 'agent' | 'internal_note'
  const [sending, setSending] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const loadAll = async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      const [t, m, a, at] = await Promise.all([
        customerServiceApi.getTicket(ticketId),
        customerServiceApi.listMessages(ticketId),
        customerServiceApi.listActivity(ticketId),
        customerServiceApi.listAttachments(ticketId),
      ]);
      setTicket(t);
      setMessages(Array.isArray(m) ? m : []);
      setActivity(Array.isArray(a) ? a : []);
      setAttachments(Array.isArray(at) ? at : []);
      setError("");
    } catch (e) {
      setError(e?.message || "Could not load ticket.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && ticketId) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ticketId]);

  const send = async () => {
    const body = composer.trim();
    if (!body) return;
    setSending(true);
    setError("");
    try {
      await customerServiceApi.createMessage(ticketId, { body, messageType: composeType });
      setComposer("");
      await loadAll();
      onChanged?.();
    } catch (e) {
      setError(e?.message || "Could not send.");
    } finally {
      setSending(false);
    }
  };

  const removeMsg = async (m) => {
    if (!window.confirm("Delete this message?")) return;
    setBusyId(m.id);
    try {
      await customerServiceApi.deleteMessage(ticketId, m.id);
      await loadAll();
    } catch (e) {
      setError(e?.message || "Could not delete.");
    } finally {
      setBusyId(null);
    }
  };

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      await customerServiceApi.uploadAttachment(ticketId, fd);
      if (fileRef.current) fileRef.current.value = "";
      await loadAll();
      onChanged?.();
    } catch (err) {
      setError(err?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const download = async (att) => {
    setBusyId(att.id);
    const win = window.open("about:blank", "_blank");
    try {
      const res = await customerServiceApi.getAttachmentLink(ticketId, att.id);
      if (res?.url) {
        if (win) win.location.href = res.url;
        else window.open(res.url, "_blank", "noopener");
      } else if (win) win.close();
    } catch (e) {
      if (win) win.close();
      setError(e?.message || "Could not open attachment.");
    } finally {
      setBusyId(null);
    }
  };

  const removeAtt = async (att) => {
    if (!window.confirm(`Delete "${att.title || att.fileName}"?`)) return;
    setBusyId(att.id);
    try {
      await customerServiceApi.deleteAttachment(ticketId, att.id);
      await loadAll();
      onChanged?.();
    } catch (e) {
      setError(e?.message || "Delete failed.");
    } finally {
      setBusyId(null);
    }
  };

  const title = ticket?.ticketNumber || "Ticket";
  const subtitle = ticket?.subject || "";

  const footer = (
    <>
      <button type="button" className="iw-btn" onClick={onClose}>Close</button>
      <button type="button" className="iw-btn primary" onClick={() => onEdit?.(ticketId)}>Edit ticket</button>
    </>
  );

  return (
    <InsuranceWorkModal open={open} title={title} subtitle={subtitle} onClose={onClose} footer={footer}>
      {loading ? (
        <div className="iw-loading">Loading…</div>
      ) : !ticket ? (
        <p className="iw-error">{error || "Ticket not found."}</p>
      ) : (
        <div style={ST.wrap}>
          {error && <p className="iw-error">{error}</p>}

          {/* Meta row */}
          <div style={ST.meta}>
            <Chip label="Status" value={ticket.status} />
            <Chip label="Priority" value={ticket.priority} />
            <Chip label="SLA" value={ticket.slaStatus || "-"} />
            <Chip label="Channel" value={ticket.channel || "-"} />
            <Chip label="Agent" value={ticket.assignedAgentName || "Unassigned"} />
            <Chip label="Customer" value={ticket.customerName || "-"} />
          </div>

          {/* Conversation */}
          <div style={ST.sectionTitle}>Conversation</div>
          <div style={ST.thread}>
            {messages.length === 0 ? (
              <p style={ST.empty}>No messages yet. Start the conversation below.</p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    ...ST.msg,
                    ...(m.isInternal ? ST.msgInternal : m.messageType === "agent" ? ST.msgAgent : ST.msgCustomer),
                  }}
                >
                  <div style={ST.msgHead}>
                    <span style={ST.msgWho}>
                      {m.isInternal && <StickyNote size={12} style={{ marginRight: 4, verticalAlign: "-1px" }} />}
                      {m.authorName || TYPE_LABEL[m.messageType] || "Message"}
                      <span style={ST.msgBadge}>{TYPE_LABEL[m.messageType] || m.messageType}</span>
                    </span>
                    <span style={ST.msgTime}>
                      {fmtTime(m.createdAt)}
                      <button style={ST.msgDel} title="Delete" disabled={busyId === m.id} onClick={() => removeMsg(m)}>
                        <Trash2 size={12} />
                      </button>
                    </span>
                  </div>
                  <div style={ST.msgBody}>{m.body}</div>
                </div>
              ))
            )}
          </div>

          {/* Composer */}
          <div style={ST.composer}>
            <div style={ST.composerTabs}>
              <button
                type="button"
                style={{ ...ST.ctab, ...(composeType === "agent" ? ST.ctabActive : {}) }}
                onClick={() => setComposeType("agent")}
              >
                <MessageSquare size={13} /> Reply
              </button>
              <button
                type="button"
                style={{ ...ST.ctab, ...(composeType === "internal_note" ? ST.ctabActiveNote : {}) }}
                onClick={() => setComposeType("internal_note")}
              >
                <StickyNote size={13} /> Internal note
              </button>
            </div>
            <textarea
              style={ST.textarea}
              rows={3}
              value={composer}
              onChange={(e) => setComposer(e.target.value)}
              placeholder={composeType === "internal_note" ? "Internal note (not visible to the customer)…" : "Write a reply…"}
            />
            <div style={ST.composerActions}>
              <label style={ST.attachBtn}>
                <Paperclip size={14} />
                {uploading ? "Uploading…" : "Attach file"}
                <input ref={fileRef} type="file" style={{ display: "none" }} onChange={upload} disabled={uploading} />
              </label>
              <button style={ST.sendBtn} disabled={sending || !composer.trim()} onClick={send}>
                <Send size={14} /> {sending ? "Sending…" : composeType === "internal_note" ? "Add note" : "Send reply"}
              </button>
            </div>
          </div>

          {/* Attachments */}
          <div style={ST.sectionTitle}>Attachments</div>
          {attachments.length === 0 ? (
            <p style={ST.empty}>No attachments. Files are private and opened via secure expiring links.</p>
          ) : (
            <div style={ST.attList}>
              {attachments.map((att) => (
                <div key={att.id} style={ST.attRow}>
                  <Paperclip size={14} style={{ color: "#64748b", flexShrink: 0 }} />
                  <span style={ST.attName}>{att.title || att.fileName}</span>
                  <span style={ST.attSize}>{fmtSize(att.size)}</span>
                  <button style={ST.attAction} title="Download" disabled={busyId === att.id} onClick={() => download(att)}>
                    <Download size={14} />
                  </button>
                  <button style={{ ...ST.attAction, color: "#dc2626" }} title="Delete" disabled={busyId === att.id} onClick={() => removeAtt(att)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Activity */}
          <div style={ST.sectionTitle}>Activity</div>
          {activity.length === 0 ? (
            <p style={ST.empty}>No activity yet.</p>
          ) : (
            <div style={ST.actList}>
              {activity.map((a) => (
                <div key={a.id} style={ST.actRow}>
                  <span style={ST.actDot} />
                  <span style={ST.actText}>
                    <b>{a.action}</b>
                    {a.detail ? <span style={ST.actDetail}> — {a.detail}</span> : null}
                  </span>
                  <time style={ST.actTime}>{relativeTime(a.createdAt)}</time>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </InsuranceWorkModal>
  );
}

function Chip({ label, value }) {
  return (
    <span style={ST.chip}>
      <span style={ST.chipLabel}>{label}</span>
      <b style={ST.chipValue}>{value || "-"}</b>
    </span>
  );
}

const ST = {
  wrap: { display: "flex", flexDirection: "column", gap: 14 },
  meta: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: { display: "inline-flex", flexDirection: "column", gap: 2, border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 10px", background: "#f8fafc", minWidth: 78 },
  chipLabel: { fontSize: 10, textTransform: "uppercase", letterSpacing: ".04em", color: "#94a3b8", fontWeight: 600 },
  chipValue: { fontSize: 13, color: "#0f172a" },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: "#0f172a", marginTop: 4 },
  thread: { display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto", padding: 2 },
  empty: { color: "#94a3b8", fontSize: 13, margin: "4px 0" },
  msg: { border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 12px", background: "#fff" },
  msgAgent: { background: "#eff6ff", borderColor: "#dbeafe" },
  msgCustomer: { background: "#fff", borderColor: "#e5e7eb" },
  msgInternal: { background: "#fffbeb", borderColor: "#fde68a" },
  msgHead: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 4 },
  msgWho: { fontSize: 12, fontWeight: 700, color: "#0f172a" },
  msgBadge: { marginLeft: 8, fontSize: 10, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: ".03em" },
  msgTime: { fontSize: 11, color: "#94a3b8", display: "inline-flex", alignItems: "center", gap: 6 },
  msgDel: { border: "none", background: "transparent", color: "#cbd5e1", cursor: "pointer", padding: 2 },
  msgBody: { fontSize: 13.5, color: "#334155", whiteSpace: "pre-wrap", lineHeight: 1.5 },
  composer: { border: "1px solid #e5e7eb", borderRadius: 12, padding: 10, background: "#fff", display: "flex", flexDirection: "column", gap: 8 },
  composerTabs: { display: "flex", gap: 6 },
  ctab: { display: "inline-flex", alignItems: "center", gap: 5, border: "1px solid #e5e7eb", background: "#f8fafc", borderRadius: 8, padding: "5px 10px", fontSize: 12.5, fontWeight: 600, color: "#475569", cursor: "pointer" },
  ctabActive: { background: "#2563eb", color: "#fff", borderColor: "#2563eb" },
  ctabActiveNote: { background: "#d97706", color: "#fff", borderColor: "#d97706" },
  textarea: { border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", fontSize: 13.5, resize: "vertical", fontFamily: "inherit" },
  composerActions: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 },
  attachBtn: { display: "inline-flex", alignItems: "center", gap: 6, border: "1px dashed #cbd5e1", borderRadius: 8, padding: "7px 12px", fontSize: 13, color: "#334155", cursor: "pointer" },
  sendBtn: { display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: "#0f172a", color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  attList: { display: "flex", flexDirection: "column", gap: 6 },
  attRow: { display: "flex", alignItems: "center", gap: 8, border: "1px solid #eef2f7", borderRadius: 8, padding: "8px 10px", background: "#fff" },
  attName: { flex: 1, fontSize: 13, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  attSize: { fontSize: 12, color: "#94a3b8" },
  attAction: { border: "1px solid #e5e7eb", background: "#fff", borderRadius: 8, padding: 6, cursor: "pointer", color: "#475569" },
  actList: { display: "flex", flexDirection: "column", gap: 6 },
  actRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 },
  actDot: { width: 7, height: 7, borderRadius: "50%", background: "#2563eb", flexShrink: 0 },
  actText: { flex: 1, color: "#334155" },
  actDetail: { color: "#64748b" },
  actTime: { color: "#94a3b8", fontSize: 11 },
};
