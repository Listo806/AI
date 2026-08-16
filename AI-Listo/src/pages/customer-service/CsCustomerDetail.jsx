import React, { useEffect, useState } from "react";
import InsuranceWorkModal from "../insurance/InsuranceWorkModal";
import customerServiceApi from "../../api/customerServiceApi";
import { formatDate } from "../sales/salesFormat";

// Customer profile: contact details + real support rollups + ticket history, all
// team-scoped on the server. Satisfaction history stays empty until the Surveys
// slice records responses (never fabricated).
export default function CsCustomerDetail({ open, customerId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !customerId) return undefined;
    let alive = true;
    setLoading(true);
    setError("");
    customerServiceApi
      .getCustomer(customerId)
      .then((d) => { if (alive) { setData(d); setLoading(false); } })
      .catch((e) => { if (alive) { setError(e?.message || "Could not load customer."); setLoading(false); } });
    return () => { alive = false; };
  }, [open, customerId]);

  const footer = <button type="button" className="iw-btn" onClick={onClose}>Close</button>;
  const title = data?.name || "Customer";
  const subtitle = data?.email || "";

  return (
    <InsuranceWorkModal open={open} title={title} subtitle={subtitle} onClose={onClose} footer={footer}>
      {loading ? (
        <div className="iw-loading">Loading…</div>
      ) : error ? (
        <p className="iw-error">{error}</p>
      ) : !data ? null : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={ST.stats}>
            <Stat label="Total tickets" value={data.totalTickets ?? 0} />
            <Stat label="Open" value={data.openTickets ?? 0} />
            <Stat label="Resolved" value={data.resolvedTickets ?? 0} />
            <Stat
              label="Satisfaction"
              value={data.satisfaction?.average != null ? `${data.satisfaction.average}/5` : "—"}
              note={data.satisfaction?.count ? `${data.satisfaction.count} ratings` : "No ratings yet"}
            />
          </div>

          <dl className="iw-detail">
            <div><dt>Email</dt><dd>{data.email || "-"}</dd></div>
            <div><dt>Phone</dt><dd>{data.phone || "-"}</dd></div>
            <div className="full"><dt>Notes</dt><dd>{data.notes || "-"}</dd></div>
          </dl>

          <div style={ST.sectionTitle}>Ticket history</div>
          {(!data.tickets || data.tickets.length === 0) ? (
            <p style={{ color: "#94a3b8", fontSize: 13 }}>No tickets for this customer yet.</p>
          ) : (
            <div style={ST.list}>
              {data.tickets.map((t) => (
                <div key={t.id} style={ST.row}>
                  <span style={ST.tkt}>{t.ticketNumber}</span>
                  <span style={ST.subj}>{t.subject || "-"}</span>
                  <span style={ST.pill}>{t.status}</span>
                  <time style={ST.time}>{formatDate(t.createdAt)}</time>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </InsuranceWorkModal>
  );
}

function Stat({ label, value, note }) {
  return (
    <div style={ST.stat}>
      <span style={ST.statLabel}>{label}</span>
      <strong style={ST.statValue}>{value}</strong>
      {note && <small style={ST.statNote}>{note}</small>}
    </div>
  );
}

const ST = {
  stats: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 },
  stat: { border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px", background: "#f8fafc", display: "flex", flexDirection: "column", gap: 2 },
  statLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em", color: "#94a3b8", fontWeight: 600 },
  statValue: { fontSize: 20, fontWeight: 700, color: "#0f172a" },
  statNote: { fontSize: 11, color: "#94a3b8" },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: "#0f172a" },
  list: { display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: "auto" },
  row: { display: "flex", alignItems: "center", gap: 10, border: "1px solid #eef2f7", borderRadius: 8, padding: "8px 10px" },
  tkt: { fontSize: 12, fontWeight: 700, color: "#2563eb", flexShrink: 0 },
  subj: { flex: 1, fontSize: 13, color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  pill: { fontSize: 11, fontWeight: 600, color: "#475569", background: "#f1f5f9", borderRadius: 999, padding: "2px 8px" },
  time: { fontSize: 11, color: "#94a3b8", flexShrink: 0 },
};
