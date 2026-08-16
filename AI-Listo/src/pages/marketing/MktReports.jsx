import React, { useEffect, useState } from "react";
import { icons as lucideIcons } from "lucide-react";
import marketingApi from "../../api/marketingApi";
import { money } from "../sales/salesFormat";

// Reports tab. Every figure is a real, team-scoped aggregate of the account's own
// marketing data. Exports stream the same real rows as CSV. Nothing is fabricated and
// no external ad-platform metric is invented.

const toPascal = (name = "") => name.split("-").filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
function I({ name, size = 15 }) {
  const Ic = lucideIcons[toPascal(name)] || lucideIcons.Circle;
  return <Ic size={size} strokeWidth={1.8} aria-hidden="true" />;
}

const RANGES = [["month", "This Month"], ["quarter", "Last 3 Months"], ["year", "Last 12 Months"], ["all", "All Time"]];
const pct = (v) => (v == null ? "—" : `${v}%`);

export default function MktReports() {
  const [range, setRange] = useState("month");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [downloading, setDownloading] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    marketingApi.getReports(range)
      .then((d) => { if (!alive) return; setData(d); setErr(""); setLoading(false); })
      .catch(() => { if (!alive) return; setErr("Could not load reports."); setLoading(false); });
    return () => { alive = false; };
  }, [range]);

  const exportCsv = async (type) => {
    setDownloading(type);
    try {
      const text = await marketingApi.exportCsv(type, range);
      const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `marketing-${type}-${range}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (_) {} finally { setDownloading(""); }
  };

  const s = data?.summary || {};
  const funnel = data?.funnel || {};
  const channels = data?.byChannel || [];
  const chMax = Math.max(1, ...channels.map((c) => c.leads || 0));

  return (
    <div className="mkw-attr">
      <div className="mkw-section-head">
        <div><h2>Reports</h2><p>Performance across your account, computed from real records only.</p></div>
        <div>
          <select value={range} onChange={(e) => setRange(e.target.value)}>{RANGES.map(([v, l]) => (<option key={v} value={v}>{l}</option>))}</select>
        </div>
      </div>

      {err ? <p style={{ color: "#b91c1c", fontSize: 13 }}>{err}</p> : null}

      <div className="mkw-attr-kpis" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="mkw-attr-kpi"><span>Campaigns</span><strong>{loading ? "…" : (s.campaigns ?? 0)}</strong><small>{s.activeCampaigns ?? 0} active</small></div>
        <div className="mkw-attr-kpi"><span>Spend</span><strong>{money(s.spend || 0)}</strong><small>Recorded cost</small></div>
        <div className="mkw-attr-kpi"><span>Leads</span><strong>{loading ? "…" : (s.leads ?? 0)}</strong><small>{s.uniqueLeads ?? 0} unique</small></div>
        <div className="mkw-attr-kpi"><span>Conversions</span><strong>{loading ? "…" : (s.conversions ?? 0)}</strong><small>{money(s.revenue || 0)} revenue</small></div>
        <div className="mkw-attr-kpi"><span>ROI</span><strong>{pct(s.roi)}</strong><small>{s.spend > 0 ? "Revenue vs spend" : "No spend"}</small></div>
        <div className="mkw-attr-kpi"><span>Cost / Lead</span><strong>{s.costPerLead != null ? money(s.costPerLead) : "—"}</strong><small>{s.leads ? "Spend / leads" : "No leads"}</small></div>
        <div className="mkw-attr-kpi"><span>Email Open Rate</span><strong>{pct(s.openRate)}</strong><small>{s.delivered ? `${s.delivered} delivered` : "No email data"}</small></div>
        <div className="mkw-attr-kpi"><span>Email CTR</span><strong>{pct(s.ctr)}</strong><small>{s.delivered ? "Clicks / delivered" : "No email data"}</small></div>
      </div>

      <div className="mkw-attr-grid">
        <div className="mkw-panel">
          <div className="mkw-panel-head"><b>Funnel</b><span style={{ fontSize: 12, color: "#94a3b8" }}>Real counts</span></div>
          <div className="mkw-funnel">
            {[["Leads", funnel.leads || 0], ["Engaged (opened/clicked)", funnel.engaged || 0], ["Converted", funnel.converted || 0]].map(([label, val], i) => {
              const top = funnel.leads || 0;
              const width = top > 0 ? Math.max(6, (val / top) * 100) : 6;
              return (
                <div key={label} className="mkw-funnel-row">
                  <span className="mkw-funnel-label">{label}</span>
                  <span className="mkw-funnel-track"><i style={{ width: `${width}%` }} className={`b${i}`} /></span>
                  <span className="mkw-funnel-val">{val.toLocaleString("en-US")}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mkw-panel">
          <div className="mkw-panel-head"><b>Leads by Channel</b><span style={{ fontSize: 12, color: "#94a3b8" }}>Real</span></div>
          <div className="mkw-attr-bars">
            {channels.length === 0 ? (
              <p style={MUTED}>No lead data yet</p>
            ) : channels.map((c, i) => (
              <div key={c.channel} className="mkw-attr-bar">
                <span className="mkw-attr-bar-label">{c.channel}</span>
                <span className="mkw-attr-bar-track"><i style={{ width: `${Math.max(4, ((c.leads || 0) / chMax) * 100)}%` }} className={`b${i % 6}`} /></span>
                <span className="mkw-attr-bar-val">{c.leads} · {c.conversions} conv</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mkw-panel">
        <div className="mkw-panel-head"><b>Export</b><span style={{ fontSize: 12, color: "#94a3b8" }}>Your data, as CSV</span></div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "4px 2px" }}>
          {[["leads", "Leads"], ["campaigns", "Campaigns"], ["conversions", "Conversions"]].map(([type, label]) => (
            <button key={type} className="mkw-export-btn" disabled={!!downloading} onClick={() => exportCsv(type)}>
              <I name="download" size={14} />{downloading === type ? "Preparing…" : `Export ${label}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const MUTED = { color: "#94a3b8", fontSize: 13, padding: "8px 2px" };
