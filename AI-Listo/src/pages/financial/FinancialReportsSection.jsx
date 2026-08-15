import React, { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import financialApi from "../../api/financialApi";

// Reports tab: team-scoped analytics from /financial/reports. All figures are
// computed server-side; this only renders them. The three money meanings stay
// separate and are never blended: AUM (recorded account balances), Portfolio
// (recorded holding values), Revenue (commission fees). Net flow = contributions
// minus withdrawals.
function money(v, max = 0) {
  const n = Number(v) || 0;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: max })}`;
}

const TONES = ["#2563eb", "#7c3aed", "#059669", "#0891b2", "#d97706", "#db2777", "#64748b"];

export default function FinancialReportsSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const res = await financialApi.getReports();
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
        const res = await financialApi.getReports();
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
      <section className="fsw-reports">
        <div className="fsw-section-title">
          <div>
            <h2>Reports</h2>
            <p>Loading analytics…</p>
          </div>
        </div>
      </section>
    );
  }

  const d = data || {};
  const txn = d.transactions || {};
  const comm = d.commissions || {};
  const byClientStatus = d.clientsByStatus || [];
  const byClientRisk = d.clientsByRisk || [];
  const byAppStatus = d.applicationsByStatus || [];
  const accountsByType = d.accountsByType || [];
  const portfolio = d.portfolioByCategory || [];

  const maxClientStatus = Math.max(1, ...byClientStatus.map((r) => Number(r.count) || 0));
  const maxRisk = Math.max(1, ...byClientRisk.map((r) => Number(r.count) || 0));
  const maxAppStatus = Math.max(1, ...byAppStatus.map((r) => Number(r.count) || 0));
  const maxAcctAmount = Math.max(1, ...accountsByType.map((r) => Number(r.amount) || 0));
  const maxPortfolio = Math.max(1, ...portfolio.map((r) => Number(r.amount) || 0));

  return (
    <section className="fsw-reports">
      <div className="fsw-section-title">
        <div>
          <h2>Reports</h2>
          <p>Clients, applications, assets, portfolio, flows and revenue across your book.</p>
        </div>
        <button className="fsw-reset" onClick={load} title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      {error && <div style={ST.error}>{error}</div>}

      {/* Headline metrics — each money figure keeps its own meaning */}
      <div style={ST.tiles}>
        <Tile label="Assets under management" value={money(d.totalAum)} note={`${d.activeAccounts || 0} active accounts (recorded)`} />
        <Tile label="Portfolio value" value={money(d.portfolioTotal)} note="Active holdings (recorded)" />
        <Tile label="Revenue this month" value={money(comm.revenueThisMonth)} note="Approved + paid commissions" />
        <Tile label="Net flow" value={money(txn.netFlow)} note="Contributions minus withdrawals" />
      </div>

      <div style={ST.cols}>
        {/* Portfolio allocation */}
        <Card title="Portfolio allocation (recorded)">
          {portfolio.length === 0 ? (
            <Empty text="No active holdings yet" />
          ) : (
            portfolio.map((r, i) => (
              <BarRow
                key={r.label}
                label={r.label}
                right={`${money(r.amount)} (${r.count})`}
                pct={((Number(r.amount) || 0) / maxPortfolio) * 100}
                color={TONES[i % TONES.length]}
              />
            ))
          )}
        </Card>

        {/* Accounts by type */}
        <Card title="AUM by account type (recorded)">
          {accountsByType.length === 0 ? (
            <Empty text="No active accounts yet" />
          ) : (
            accountsByType.map((r, i) => (
              <BarRow
                key={r.label}
                label={r.label}
                right={`${money(r.amount)} (${r.count})`}
                pct={((Number(r.amount) || 0) / maxAcctAmount) * 100}
                color={TONES[i % TONES.length]}
              />
            ))
          )}
        </Card>

        {/* Clients by status */}
        <Card title="Clients by status">
          {byClientStatus.length === 0 ? (
            <Empty text="No clients yet" />
          ) : (
            byClientStatus.map((r, i) => (
              <BarRow
                key={r.label}
                label={r.label}
                right={`${r.count}`}
                pct={((Number(r.count) || 0) / maxClientStatus) * 100}
                color={TONES[i % TONES.length]}
              />
            ))
          )}
        </Card>

        {/* Clients by risk */}
        <Card title="Clients by risk level">
          {byClientRisk.length === 0 ? (
            <Empty text="No clients yet" />
          ) : (
            byClientRisk.map((r, i) => (
              <BarRow
                key={r.label}
                label={r.label}
                right={`${r.count}`}
                pct={((Number(r.count) || 0) / maxRisk) * 100}
                color={TONES[i % TONES.length]}
              />
            ))
          )}
        </Card>

        {/* Applications by status */}
        <Card title="Applications by status">
          {byAppStatus.length === 0 ? (
            <Empty text="No applications yet" />
          ) : (
            byAppStatus.map((r, i) => (
              <BarRow
                key={r.label}
                label={r.label}
                right={`${r.count}`}
                pct={((Number(r.count) || 0) / maxAppStatus) * 100}
                color={TONES[i % TONES.length]}
              />
            ))
          )}
        </Card>

        {/* Transactions */}
        <Card title="Transactions (completed)">
          <div style={ST.miniRow}>
            <Mini label="Count" value={txn.total || 0} />
            <Mini label="In" value={money(txn.contributions)} tone="green" />
            <Mini label="Out" value={money(txn.withdrawals)} tone="amber" />
            <Mini label="Net" value={money(txn.netFlow)} />
          </div>
        </Card>

        {/* Commissions */}
        <Card title="Commissions (revenue)">
          <Line label="Pending" value={`${money(comm.pendingAmount)} (${comm.pendingCount || 0})`} />
          <Line label="Approved" value={money(comm.approvedAmount)} />
          <Line label="Paid" value={`${money(comm.paidAmount)} (${comm.paidCount || 0})`} />
          <Line label="Total booked" value={money(comm.totalAmount)} strong />
          <Line label="This month (approved + paid)" value={money(comm.revenueThisMonth)} strong />
        </Card>
      </div>
    </section>
  );
}

function Card({ title, children }) {
  return (
    <div style={ST.card}>
      <div style={ST.cardHead}>{title}</div>
      <div style={ST.cardBody}>{children}</div>
    </div>
  );
}

function Tile({ label, value, note }) {
  return (
    <div style={ST.tile}>
      <span style={ST.tileLabel}>{label}</span>
      <strong style={ST.tileValue}>{value}</strong>
      {note && <small style={ST.tileNote}>{note}</small>}
    </div>
  );
}

function BarRow({ label, right, pct, color }) {
  return (
    <div style={ST.barRow}>
      <div style={ST.barTop}>
        <span style={ST.barLabel}>{label}</span>
        <span style={ST.barRight}>{right}</span>
      </div>
      <div style={ST.barTrack}>
        <div style={{ ...ST.barFill, width: `${Math.max(2, Math.min(100, pct))}%`, background: color }} />
      </div>
    </div>
  );
}

function Mini({ label, value, tone = "default" }) {
  return (
    <div style={ST.mini}>
      <strong style={{ ...ST.miniValue, ...(tone === "green" ? { color: "#059669" } : tone === "amber" ? { color: "#d97706" } : null) }}>
        {typeof value === "number" ? value.toLocaleString("en-US") : value}
      </strong>
      <small style={ST.miniLabel}>{label}</small>
    </div>
  );
}

function Line({ label, value, strong }) {
  return (
    <div style={ST.line}>
      <span style={ST.lineLabel}>{label}</span>
      <span style={{ ...ST.lineValue, ...(strong ? { fontWeight: 700, color: "#0f172a" } : null) }}>{value}</span>
    </div>
  );
}

function Empty({ text }) {
  return <p style={{ color: "#94a3b8", fontSize: 13, margin: "8px 0" }}>{text}</p>;
}

const ST = {
  error: { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px", fontSize: 13, marginBottom: 12 },
  tiles: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 18 },
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
  miniValue: { display: "block", fontSize: 18, fontWeight: 700, color: "#0f172a" },
  miniLabel: { fontSize: 11, color: "#94a3b8" },
  line: { display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13, paddingTop: 4, borderTop: "1px solid #f1f5f9" },
  lineLabel: { color: "#64748b" },
  lineValue: { color: "#334155", fontWeight: 600, fontVariantNumeric: "tabular-nums" },
};
