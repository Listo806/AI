import React, { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import insuranceApi from "../../api/insuranceApi";

// Reports tab: team-scoped analytics from /insurance/reports. All figures are
// computed server-side; this only renders them. Keeps the last good payload on a
// transient refresh error.
function money(v, max = 0) {
  const n = Number(v) || 0;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: max })}`;
}

const TONES = ["#2563eb", "#7c3aed", "#059669", "#0891b2", "#d97706", "#db2777", "#64748b"];

export default function ReportsSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const res = await insuranceApi.getReports();
      setData(res);
      setError("");
    } catch {
      setError("Could not load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await insuranceApi.getReports();
        if (alive) setData(res);
      } catch {
        if (alive) setError("Could not load reports.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="insurance-ws-policies">
        <div className="insurance-ws-section-head">
          <div>
            <h2>Reports</h2>
            <p>Loading analytics…</p>
          </div>
        </div>
      </section>
    );
  }

  const d = data || {};
  const claims = d.claims || {};
  const comm = d.commissions || {};
  const ren = d.renewals || {};
  const premiumByType = d.premiumByType || [];
  const byStatus = d.policiesByStatus || [];
  const newBiz = d.newBusiness || [];

  const maxTypePremium = Math.max(1, ...premiumByType.map((r) => Number(r.premium) || 0));
  const maxStatus = Math.max(1, ...byStatus.map((r) => Number(r.count) || 0));
  const maxBizPremium = Math.max(1, ...newBiz.map((r) => Number(r.premium) || 0));

  return (
    <section className="insurance-ws-policies">
      <div className="insurance-ws-section-head">
        <div>
          <h2>Reports</h2>
          <p>Premium, claims, commissions and renewals across your book.</p>
        </div>
        <button className="insurance-ws-icon-btn" onClick={load} title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      {error && <div className="insurance-report-mobile-error" style={ST.error}>{error}</div>}

      {/* Headline metrics */}
      <div className="insurance-report insurance-report-mobile-tiles" style={ST.tiles}>
        <Tile label="In-force premium" value={money(d.totalActivePremium)} />
        <Tile label="Loss ratio" value={`${claims.lossRatio || 0}%`} note="Paid claims / in-force premium" />
        <Tile label="Renewal rate" value={`${ren.rate || 0}%`} note="Renewed vs closed" />
        <Tile label="Commissions paid" value={money(comm.paidAmount)} note={`${comm.paidCount || 0} paid`} />
      </div>

      <div className="insurance-report-mobile-grid" style={ST.cols}>
        {/* Premium by type */}
        <Card title="Premium by policy type">
          {premiumByType.length === 0 ? (
            <Empty text="No active policies yet" />
          ) : (
            premiumByType.map((r, i) => (
              <BarRow
                key={r.type}
                label={r.type}
                right={`${money(r.premium)} (${r.count})`}
                pct={((Number(r.premium) || 0) / maxTypePremium) * 100}
                color={TONES[i % TONES.length]}
              />
            ))
          )}
        </Card>

        {/* Policies by status */}
        <Card title="Policies by status">
          {byStatus.length === 0 ? (
            <Empty text="No policies yet" />
          ) : (
            byStatus.map((r, i) => (
              <BarRow
                key={r.status}
                label={r.status}
                right={`${r.count}`}
                pct={((Number(r.count) || 0) / maxStatus) * 100}
                color={TONES[i % TONES.length]}
              />
            ))
          )}
        </Card>

        {/* Claims */}
        <Card title="Claims">
          <div className="insurance-report-mobile-mini-row" style={ST.miniRow}>
            <Mini label="Open" value={claims.open || 0} />
            <Mini label="Paid" value={claims.paid || 0} />
            <Mini label="Denied" value={claims.denied || 0} />
            <Mini label="Closed" value={claims.closed || 0} />
          </div>
          <Line label="Total claimed" value={money(claims.totalClaimed)} />
          <Line label="Total paid" value={money(claims.totalPaid)} />
        </Card>

        {/* Commissions */}
        <Card title="Commissions">
          <Line label="Pending" value={`${money(comm.pendingAmount)} (${comm.pendingCount || 0})`} />
          <Line label="Paid" value={`${money(comm.paidAmount)} (${comm.paidCount || 0})`} />
          <Line label="Total booked" value={money(comm.totalAmount)} strong />
        </Card>

        {/* Renewals funnel */}
        <Card title="Renewals">
          <div className="insurance-report-mobile-mini-row" style={ST.miniRow}>
            <Mini label="Pending" value={ren.pending || 0} />
            <Mini label="Renewed" value={ren.renewed || 0} tone="green" />
            <Mini label="Lapsed" value={ren.lapsed || 0} tone="amber" />
            <Mini label="Declined" value={ren.declined || 0} />
          </div>
          <Line label="Renewal rate" value={`${ren.rate || 0}%`} strong />
        </Card>

        {/* New business */}
        <Card title="New business (last 6 months)">
          {newBiz.length === 0 ? (
            <Empty text="No new policies in this window" />
          ) : (
            newBiz.map((r, i) => (
              <BarRow
                key={r.month}
                label={r.month}
                right={`${money(r.premium)} (${r.count})`}
                pct={((Number(r.premium) || 0) / maxBizPremium) * 100}
                color={TONES[i % TONES.length]}
              />
            ))
          )}
        </Card>
      </div>
    </section>
  );
}

function Card({ title, children }) {
  return (
    <div className="insurance-report-mobile-card" style={ST.card}>
      <div className="insurance-report-mobile-card-head" style={ST.cardHead}>{title}</div>
      <div className="insurance-report-mobile-card-body" style={ST.cardBody}>{children}</div>
    </div>
  );
}

function Tile({ label, value, note }) {
  return (
    <div className="insurance-report-item insurance-report-mobile-tile" style={ST.tile}>
      <span className="insurance-report-mobile-tile-label" style={ST.tileLabel}>{label}</span>
      <strong className="insurance-report-mobile-tile-value" style={ST.tileValue}>{value}</strong>
      {note && <small className="insurance-report-mobile-tile-note" style={ST.tileNote}>{note}</small>}
    </div>
  );
}

function BarRow({ label, right, pct, color }) {
  return (
    <div className="insurance-report-mobile-bar-row" style={ST.barRow}>
      <div className="insurance-report-mobile-bar-top" style={ST.barTop}>
        <span className="insurance-report-mobile-bar-label" style={ST.barLabel}>{label}</span>
        <span className="insurance-report-mobile-bar-right" style={ST.barRight}>{right}</span>
      </div>
      <div className="insurance-report-mobile-bar-track" style={ST.barTrack}>
        <div style={{ ...ST.barFill, width: `${Math.max(2, Math.min(100, pct))}%`, background: color }} />
      </div>
    </div>
  );
}

function Mini({ label, value, tone = "default" }) {
  return (
    <div className="insurance-report-mobile-mini" style={ST.mini}>
      <strong className={`insurance-report-mobile-mini-value tone-${tone}`} style={{ ...ST.miniValue, ...(tone === "green" ? { color: "#059669" } : tone === "amber" ? { color: "#d97706" } : null) }}>
        {Number(value).toLocaleString("en-US")}
      </strong>
      <small className="insurance-report-mobile-mini-label" style={ST.miniLabel}>{label}</small>
    </div>
  );
}

function Line({ label, value, strong }) {
  return (
    <div className="insurance-report-mobile-line" style={ST.line}>
      <span className="insurance-report-mobile-line-label" style={ST.lineLabel}>{label}</span>
      <span className="insurance-report-mobile-line-value" style={{ ...ST.lineValue, ...(strong ? { fontWeight: 700, color: "#0f172a" } : null) }}>{value}</span>
    </div>
  );
}

function Empty({ text }) {
  return <p className="insurance-report-mobile-empty" style={{ color: "#94a3b8", fontSize: 13, margin: "8px 0" }}>{text}</p>;
}

const ST = {
  error: { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px", fontSize: 13, marginBottom: 12 },
  tiles: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 18 },
  tile: { border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px", background: "#fff", display: "flex", flexDirection: "column", gap: 4 },
  tileLabel: { fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".03em" },
  tileValue: { fontSize: 24, fontWeight: 700, color: "#0f172a", lineHeight: 1.1 },
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
  miniRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 },
  mini: { border: "1px solid #eef2f7", borderRadius: 10, padding: "10px 6px", textAlign: "center", background: "#fafcff" },
  miniValue: { display: "block", fontSize: 20, fontWeight: 700, color: "#0f172a" },
  miniLabel: { fontSize: 11, color: "#94a3b8" },
  line: { display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13, paddingTop: 4, borderTop: "1px solid #f1f5f9" },
  lineLabel: { color: "#64748b" },
  lineValue: { color: "#334155", fontWeight: 600, fontVariantNumeric: "tabular-nums" },
};
