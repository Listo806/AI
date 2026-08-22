import React, { useEffect, useState } from "react";
import { RefreshCw, Download } from "lucide-react";
import customerServiceApi from "../../api/customerServiceApi";

// Reports tab: team-scoped analytics from /customer-service/reports. Every figure is
// computed server-side; the optional date range actually changes the calculation.
// Export downloads only the account-scoped, currently-filtered report as CSV.
const TONES = ["#2563eb", "#7c3aed", "#059669", "#0891b2", "#d97706", "#db2777", "#64748b"];

function toCsv(rows) {
  return rows
    .map((r) => r.map((c) => {
      const s = c == null ? "" : String(c);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(","))
    .join("\n");
}
function download(name, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function CsReportsSection() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await customerServiceApi.getReports({ from: from || undefined, to: to || undefined });
      setData(res);
      setError("");
    } catch {
      setError("Could not load reports.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const exportCsv = () => {
    if (!data) return;
    const rows = [["Section", "Label", "Value"]];
    rows.push(["Summary", "Tickets created", data.ticketsCreated]);
    rows.push(["Summary", "Tickets resolved", data.ticketsResolved]);
    rows.push(["Summary", "Open volume", data.openVolume]);
    rows.push(["Summary", "Avg response", data.avgResponseLabel || "-"]);
    rows.push(["Summary", "Avg resolution", data.avgResolutionLabel || "-"]);
    rows.push(["Summary", "SLA compliance %", data.slaCompliance ?? "-"]);
    rows.push(["Summary", "CSAT", data.csat?.average != null ? `${data.csat.average}/5 (${data.csat.count})` : "No ratings"]);
    (data.byStatus || []).forEach((r) => rows.push(["By status", r.label, r.count]));
    (data.byChannel || []).forEach((r) => rows.push(["By channel", r.label, r.count]));
    (data.byPriority || []).forEach((r) => rows.push(["By priority", r.label, r.count]));
    (data.byCategory || []).forEach((r) => rows.push(["By category", r.label, r.count]));
    (data.agentPerformance || []).forEach((r) => rows.push(["Agent", r.name, `${r.resolved} resolved / ${r.assigned} assigned`]));
    const range = [data.range?.from, data.range?.to].filter(Boolean).join("_to_") || "all";
    download(`customer-service-report_${range}.csv`, toCsv(rows));
  };

  const d = data || {};
  const maxOf = (arr) => Math.max(1, ...(arr || []).map((r) => Number(r.count) || 0));

  return (
    <section>
      <section className="csw-mobile-only csw-mobile-feature-panel tone-blue">
        <div className="csw-mobile-feature-head">
          <span className="csw-mobile-feature-title"><i data-lucide="chart-no-axes-column" />Reports</span>
          <button type="button" onClick={load}>View All <i data-lucide="chevron-right" /></button>
        </div>
        <div className="csw-mobile-report-list">
          {[
            ["chart-no-axes-combined", "Ticket Volume Report", "Track ticket trends and volume over time", "blue"],
            ["clock-3", "Response Time Report", "Analyze agent response performance", "purple"],
            ["circle-check-big", "Resolution Time Report", "Track ticket resolution efficiency", "green"],
            ["star", "Customer Satisfaction Report", "Review CSAT scores and feedback", "amber"],
            ["user-round", "Agent Performance Report", "Evaluate agent productivity and quality", "pink"],
          ].map(([icon, title, sub, tone]) => (
            <button type="button" key={title} className="csw-mobile-report-row" onClick={load}>
              <span className={`row-icon ${tone}`}><i data-lucide={icon} /></span>
              <span><b>{title}</b><small>{sub}</small></span>
              <i data-lucide="chevron-right" />
            </button>
          ))}
        </div>
        <button type="button" className="csw-mobile-outline-action" onClick={exportCsv} disabled={!data}>
          <i data-lucide="file-text" />Explore All Reports
        </button>
      </section>

      <div className="csw-desktop-only">
      <div className="csw-section-head">
        <div>
          <h2>Reports</h2>
          <p>Volumes, response and resolution times, SLA, satisfaction and trends</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label style={ST.dateLabel}>From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label style={ST.dateLabel}>To<input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
          <button onClick={load}><RefreshCw size={15} /> Apply</button>
          <button onClick={exportCsv} disabled={!data}><Download size={15} /> Export CSV</button>
        </div>
      </div>

      {error && <div style={ST.error}>{error}</div>}
      {loading ? (
        <p style={{ color: "#64748b", fontSize: 14 }}>Loading analytics…</p>
      ) : (
        <>
          <div style={ST.tiles}>
            <Tile label="Tickets created" value={(d.ticketsCreated ?? 0).toLocaleString("en-US")} />
            <Tile label="Tickets resolved" value={(d.ticketsResolved ?? 0).toLocaleString("en-US")} />
            <Tile label="Open volume" value={(d.openVolume ?? 0).toLocaleString("en-US")} />
            <Tile label="Avg response" value={d.avgResponseLabel || "—"} />
            <Tile label="Avg resolution" value={d.avgResolutionLabel || "—"} />
            <Tile label="SLA compliance" value={d.slaCompliance != null ? `${d.slaCompliance}%` : "—"} />
            <Tile label="Satisfaction" value={d.csat?.average != null ? `${d.csat.average}/5` : "—"} note={d.csat?.count ? `${d.csat.count} ratings` : "No ratings yet"} />
          </div>

          <div style={ST.cols}>
            <Card title="Tickets by status"><Bars rows={d.byStatus} max={maxOf(d.byStatus)} empty="No tickets in range" /></Card>
            <Card title="Tickets by channel"><Bars rows={d.byChannel} max={maxOf(d.byChannel)} empty="No tickets in range" /></Card>
            <Card title="Tickets by priority"><Bars rows={d.byPriority} max={maxOf(d.byPriority)} empty="No tickets in range" /></Card>
            <Card title="Tickets by category"><Bars rows={d.byCategory} max={maxOf(d.byCategory)} empty="No tickets in range" /></Card>
            <Card title="Agent performance">
              {(d.agentPerformance || []).length === 0 ? (
                <Empty text="No agent activity yet" />
              ) : (
                d.agentPerformance.map((a) => (
                  <div key={a.name} style={ST.line}>
                    <span style={ST.lineLabel}>{a.name}</span>
                    <span style={ST.lineValue}>{a.resolved} resolved · {a.avgResponseLabel || "—"}</span>
                  </div>
                ))
              )}
            </Card>
            <Card title="Trend (last 6 months)">
              {(d.trend || []).length === 0 ? (
                <Empty text="No history yet" />
              ) : (
                d.trend.map((r, i) => (
                  <BarRow key={r.month} label={r.month} right={`${r.created} created / ${r.resolved} resolved`}
                    pct={(Number(r.created) || 0) / Math.max(1, ...(d.trend || []).map((x) => Number(x.created) || 0)) * 100}
                    color={TONES[i % TONES.length]} />
                ))
              )}
            </Card>
          </div>
        </>
      )}
      </div>
    </section>
  );
}

function Card({ title, children }) {
  return <div style={ST.card}><div style={ST.cardHead}>{title}</div><div style={ST.cardBody}>{children}</div></div>;
}
function Tile({ label, value, note }) {
  return <div style={ST.tile}><span style={ST.tileLabel}>{label}</span><strong style={ST.tileValue}>{value}</strong>{note && <small style={ST.tileNote}>{note}</small>}</div>;
}
function Bars({ rows, max, empty }) {
  if (!rows || rows.length === 0) return <Empty text={empty} />;
  return rows.map((r, i) => (
    <BarRow key={r.label} label={r.label} right={`${r.count}`} pct={((Number(r.count) || 0) / max) * 100} color={TONES[i % TONES.length]} />
  ));
}
function BarRow({ label, right, pct, color }) {
  return (
    <div style={ST.barRow}>
      <div style={ST.barTop}><span style={ST.barLabel}>{label}</span><span style={ST.barRight}>{right}</span></div>
      <div style={ST.barTrack}><div style={{ ...ST.barFill, width: `${Math.max(2, Math.min(100, pct))}%`, background: color }} /></div>
    </div>
  );
}
function Empty({ text }) { return <p style={{ color: "#94a3b8", fontSize: 13, margin: "8px 0" }}>{text}</p>; }

const ST = {
  dateLabel: { display: "inline-flex", flexDirection: "column", fontSize: 11, color: "#64748b", gap: 2 },
  error: { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px", fontSize: 13, marginBottom: 12 },
  tiles: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 18 },
  tile: { border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px", background: "#fff", display: "flex", flexDirection: "column", gap: 4 },
  tileLabel: { fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".03em" },
  tileValue: { fontSize: 22, fontWeight: 700, color: "#0f172a", lineHeight: 1.1 },
  tileNote: { fontSize: 12, color: "#94a3b8" },
  cols: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 },
  card: { border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", padding: 18, display: "flex", flexDirection: "column" },
  cardHead: { fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 14 },
  cardBody: { display: "flex", flexDirection: "column", gap: 12 },
  barRow: { display: "flex", flexDirection: "column", gap: 6 },
  barTop: { display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 },
  barLabel: { color: "#334155", fontWeight: 600 },
  barRight: { color: "#64748b", fontVariantNumeric: "tabular-nums" },
  barTrack: { height: 8, borderRadius: 999, background: "#f1f5f9", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 999 },
  line: { display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13, paddingTop: 4, borderTop: "1px solid #f1f5f9" },
  lineLabel: { color: "#334155", fontWeight: 600 },
  lineValue: { color: "#64748b", fontVariantNumeric: "tabular-nums" },
};
