import React from "react";
import {
  ShieldCheck,
  ClipboardList,
  FileCheck2,
  CalendarClock,
  ArrowRight,
} from "lucide-react";

// Overview tab: a narrative summary of the book of business plus quick jumps into
// the working tabs. Reuses the live /insurance/stats payload already loaded by the
// workspace (passed as `stats`), so it adds no extra request. The KPI cards above
// and the Policies-by-Type / Activity / Renewals cards below round out the page.
function money(v) {
  if (v == null) return "$0";
  const n = Number(v);
  if (!isFinite(n)) return "$0";
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

const QUICK = [
  { tab: "Policies", label: "New policy", Icon: ShieldCheck },
  { tab: "Claims", label: "Log a claim", Icon: ClipboardList },
  { tab: "Quotes", label: "Build a quote", Icon: FileCheck2 },
  { tab: "Renewals", label: "Work renewals", Icon: CalendarClock },
];

export default function OverviewSection({ stats, onGoTo }) {
  const k = stats?.kpis || {};
  const activeCount = k.activePolicies?.count || 0;
  const inForce = k.activePolicies?.totalPremium || 0;
  const openClaims = k.openClaims?.count || 0;
  const renewals30 = k.expiring30?.count || 0;
  const commissionsDue = k.commissionsDue?.amount || 0;

  const summary =
    activeCount > 0
      ? `You have ${activeCount.toLocaleString("en-US")} active ${
          activeCount === 1 ? "policy" : "policies"
        } worth ${money(inForce)} in in-force premium.`
      : "No active policies yet. Add your first policy to start tracking your book of business.";

  return (
    <section className="insurance-ws-policies">
      <div className="insurance-ws-section-head">
        <div>
          <h2>Overview</h2>
          <p>{summary}</p>
        </div>
      </div>

      <div style={ST.grid}>
        <SummaryTile
          label="In-force premium"
          value={money(inForce)}
          note={`${activeCount.toLocaleString("en-US")} active`}
        />
        <SummaryTile
          label="Open claims"
          value={openClaims.toLocaleString("en-US")}
          note="Needs attention"
          tone={openClaims > 0 ? "amber" : "default"}
        />
        <SummaryTile
          label="Renewals (30 days)"
          value={renewals30.toLocaleString("en-US")}
          note="Coming due"
          tone={renewals30 > 0 ? "amber" : "default"}
        />
        <SummaryTile
          label="Commissions due"
          value={money(commissionsDue)}
          note="Unpaid"
        />
      </div>

      <div style={ST.quickWrap}>
        <span style={ST.quickLabel}>Quick actions</span>
        <div style={ST.quickRow}>
          {QUICK.map((q) => (
            <button
              key={q.tab}
              type="button"
              style={ST.quickBtn}
              onClick={() => onGoTo && onGoTo(q.tab)}
            >
              <q.Icon size={16} />
              <span>{q.label}</span>
              <ArrowRight size={14} style={{ opacity: 0.5 }} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function SummaryTile({ label, value, note, tone = "default" }) {
  return (
    <div style={{ ...ST.tile, ...(tone === "amber" ? ST.tileAmber : null) }}>
      <span style={ST.tileLabel}>{label}</span>
      <strong style={ST.tileValue}>{value}</strong>
      {note && <small style={ST.tileNote}>{note}</small>}
    </div>
  );
}

const ST = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
    marginBottom: 18,
  },
  tile: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "16px 18px",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  tileAmber: { borderColor: "#fcd9a5", background: "#fffbf3" },
  tileLabel: { fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".03em" },
  tileValue: { fontSize: 24, fontWeight: 700, color: "#0f172a", lineHeight: 1.1 },
  tileNote: { fontSize: 12, color: "#94a3b8" },
  quickWrap: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 6 },
  quickLabel: { fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".03em" },
  quickRow: { display: "flex", flexWrap: "wrap", gap: 10 },
  quickBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 14,
    fontWeight: 600,
    color: "#0f172a",
    cursor: "pointer",
  },
};
