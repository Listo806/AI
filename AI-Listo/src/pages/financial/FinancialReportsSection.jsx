import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const res = await financialApi.getReports();
      setData(res);
      setError("");
    } catch {
      setError(t("financialWorkspace.reports.loadError"));
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
        if (alive) setError(t("financialWorkspace.reports.loadError"));
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
            <h2>{t("financialWorkspace.tabs.reports")}</h2>
            <p>{t("financialWorkspace.reports.loading")}</p>
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
          <h2>{t("financialWorkspace.tabs.reports")}</h2>
          <p>{t("financialWorkspace.reports.subtitle")}</p>
        </div>
        <button className="fsw-reset" onClick={load} title={t("financialWorkspace.actions.refresh")}>
          <RefreshCw size={16} />
        </button>
      </div>

      {error && <div style={ST.error}>{error}</div>}

      {/* Headline metrics — each money figure keeps its own meaning */}
      <div className="fsw-report-mobile-tiles" style={ST.tiles}>
        <Tile label={t("financialWorkspace.reports.assetsUnderManagement")} value={money(d.totalAum)} note={t("financialWorkspace.reports.activeAccountsRecorded", { count: d.activeAccounts || 0 })} />
        <Tile label={t("financialWorkspace.reports.portfolioValue")} value={money(d.portfolioTotal)} note={t("financialWorkspace.reports.activeHoldingsRecorded")} />
        <Tile label={t("financialWorkspace.reports.revenueThisMonth")} value={money(comm.revenueThisMonth)} note={t("financialWorkspace.reports.approvedPaidCommissions")} />
        <Tile label={t("financialWorkspace.reports.netFlow")} value={money(txn.netFlow)} note={t("financialWorkspace.reports.contributionsMinusWithdrawals")} />
      </div>

      <div className="fsw-report-mobile-grid" style={ST.cols}>
        {/* Portfolio allocation */}
        <Card title={t("financialWorkspace.reports.portfolioAllocation")}>
          {portfolio.length === 0 ? (
            <Empty text={t("financialWorkspace.reports.noActiveHoldings")} />
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
        <Card title={t("financialWorkspace.reports.aumByAccountType")}>
          {accountsByType.length === 0 ? (
            <Empty text={t("financialWorkspace.reports.noActiveAccounts")} />
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
        <Card title={t("financialWorkspace.reports.clientsByStatus")}>
          {byClientStatus.length === 0 ? (
            <Empty text={t("financialWorkspace.reports.noClients")} />
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
        <Card title={t("financialWorkspace.reports.clientsByRisk")}>
          {byClientRisk.length === 0 ? (
            <Empty text={t("financialWorkspace.reports.noClients")} />
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
        <Card title={t("financialWorkspace.reports.applicationsByStatus")}>
          {byAppStatus.length === 0 ? (
            <Empty text={t("financialWorkspace.reports.noApplications")} />
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
        <Card title={t("financialWorkspace.reports.transactionsCompleted")}>
          <div className="fsw-report-mobile-mini-row" style={ST.miniRow}>
            <Mini label={t("financialWorkspace.reports.count")} value={txn.total || 0} />
            <Mini label={t("financialWorkspace.reports.in")} value={money(txn.contributions)} tone="green" />
            <Mini label={t("financialWorkspace.reports.out")} value={money(txn.withdrawals)} tone="amber" />
            <Mini label={t("financialWorkspace.reports.net")} value={money(txn.netFlow)} />
          </div>
        </Card>

        {/* Commissions */}
        <Card title={t("financialWorkspace.reports.commissionsRevenue")}>
          <Line label={t("common.pending")} value={`${money(comm.pendingAmount)} (${comm.pendingCount || 0})`} />
          <Line label={t("financialWorkspace.reports.approved")} value={money(comm.approvedAmount)} />
          <Line label={t("financialWorkspace.reports.paid")} value={`${money(comm.paidAmount)} (${comm.paidCount || 0})`} />
          <Line label={t("financialWorkspace.reports.totalBooked")} value={money(comm.totalAmount)} strong />
          <Line label={t("financialWorkspace.reports.thisMonthApprovedPaid")} value={money(comm.revenueThisMonth)} strong />
        </Card>
      </div>
    </section>
  );
}

function Card({ title, children }) {
  return (
    <div className="fsw-report-mobile-card" style={ST.card}>
      <div className="fsw-report-mobile-card-head" style={ST.cardHead}>{title}</div>
      <div className="fsw-report-mobile-card-body" style={ST.cardBody}>{children}</div>
    </div>
  );
}

function Tile({ label, value, note }) {
  return (
    <div className="fsw-report-mobile-tile" style={ST.tile}>
      <span className="fsw-report-mobile-tile-label" style={ST.tileLabel}>{label}</span>
      <strong className="fsw-report-mobile-tile-value" style={ST.tileValue}>{value}</strong>
      {note && <small className="fsw-report-mobile-tile-note" style={ST.tileNote}>{note}</small>}
    </div>
  );
}

function BarRow({ label, right, pct, color }) {
  return (
    <div className="fsw-report-mobile-bar-row" style={ST.barRow}>
      <div className="fsw-report-mobile-bar-top" style={ST.barTop}>
        <span className="fsw-report-mobile-bar-label" style={ST.barLabel}>{label}</span>
        <span className="fsw-report-mobile-bar-right" style={ST.barRight}>{right}</span>
      </div>
      <div className="fsw-report-mobile-bar-track" style={ST.barTrack}>
        <div style={{ ...ST.barFill, width: `${Math.max(2, Math.min(100, pct))}%`, background: color }} />
      </div>
    </div>
  );
}

function Mini({ label, value, tone = "default" }) {
  return (
    <div className="fsw-report-mobile-mini" style={ST.mini}>
      <strong style={{ ...ST.miniValue, ...(tone === "green" ? { color: "#059669" } : tone === "amber" ? { color: "#d97706" } : null) }}>
        {typeof value === "number" ? value.toLocaleString("en-US") : value}
      </strong>
      <small className="fsw-report-mobile-mini-label" style={ST.miniLabel}>{label}</small>
    </div>
  );
}

function Line({ label, value, strong }) {
  return (
    <div className="fsw-report-mobile-line" style={ST.line}>
      <span className="fsw-report-mobile-line-label" style={ST.lineLabel}>{label}</span>
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
