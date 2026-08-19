import React from "react";
import { FileText, ClipboardList, PackageCheck, BadgeDollarSign, ArrowRight } from "lucide-react";
import { money } from "./salesFormat";

// Overview tab: a short narrative summary of the sales cycle plus quick jumps into
// the working tabs. Reuses the live /sales/stats payload already loaded by the
// workspace (the KPI cards above and the pipeline/activity/reps cards below round
// out the page).
const QUICK = [
  { tab: "Quotes", label: "New quote", Icon: FileText },
  { tab: "Proposals", label: "Proposals", Icon: ClipboardList },
  { tab: "Orders", label: "Orders", Icon: PackageCheck },
  { tab: "Invoices", label: "Invoices", Icon: BadgeDollarSign },
];

export default function SalesOverviewSection({ stats, onGoTo }) {
  const openQuotes = stats?.openQuotes?.count || 0;
  const inQuotes = stats?.openQuotes?.value || 0;
  const ordersM = stats?.ordersThisMonth?.count || 0;
  const outstanding = stats?.outstandingInvoices?.value || 0;

  const summary =
    openQuotes > 0
      ? `You have ${openQuotes.toLocaleString("en-US")} open ${openQuotes === 1 ? "quote" : "quotes"} worth ${money(inQuotes)}, ${ordersM.toLocaleString("en-US")} ${ordersM === 1 ? "order" : "orders"} this month, and ${money(outstanding)} in outstanding invoices.`
      : "No open quotes yet. Create your first quote to start the sales cycle.";

  return (
    <section className="sales-ws-quotes">
      <div className="sales-ws-section-head">
        <div>
          <h2>Overview</h2>
          <p>{summary}</p>
        </div>
      </div>

      <div className="sales-ws-quickrow" style={ST.quickRow}>
        {QUICK.map((q) => (
          <button key={q.tab} type="button" style={ST.quickBtn} onClick={() => onGoTo && onGoTo(q.tab)}>
            <q.Icon size={16} />
            <span>{q.label}</span>
            <ArrowRight size={14} style={{ opacity: 0.5 }} />
          </button>
        ))}
      </div>
    </section>
  );
}

const ST = {
  quickRow: { display: "flex", gap: 6, padding: "4px 0 8px" },
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
