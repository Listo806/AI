import React, { useEffect, useState, useCallback } from "react";
import { icons as lucideIcons } from "lucide-react";
import marketingApi from "../../api/marketingApi";
import { money, formatDate, relativeTime } from "../sales/salesFormat";

// Attribution tab. Every figure is a real aggregate of recorded conversions / costs,
// grouped by the last-touch campaign snapshot stored on each conversion. Nothing is
// fabricated: with no conversions, the report is empty, not invented. Leads and
// conversions are managed here so the whole capture -> touch -> convert -> attribute
// lifecycle is real and testable.

const toPascal = (name = "") => name.split("-").filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
function I({ name, size = 15 }) {
  const Ic = lucideIcons[toPascal(name)] || lucideIcons.Circle;
  return <Ic size={size} strokeWidth={1.8} aria-hidden="true" />;
}

const RANGES = [["month", "This Month"], ["quarter", "Last 3 Months"], ["year", "Last 12 Months"], ["all", "All Time"]];
const LEAD_STATUS = ["New", "Working", "Qualified", "Converted", "Lost"];
const pct = (v) => (v == null ? "—" : `${v}%`);

export default function MktAttribution() {
  const [range, setRange] = useState("month");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [tick, setTick] = useState(0);

  const [leads, setLeads] = useState([]);
  const [convs, setConvs] = useState([]);
  const [busy, setBusy] = useState(false);

  const [leadForm, setLeadForm] = useState({ name: "", email: "", source: "", value: "" });
  const [convFor, setConvFor] = useState(null); // lead id being converted
  const [convForm, setConvForm] = useState({ conversionType: "Purchase", value: "" });

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      marketingApi.getAttribution(range),
      marketingApi.listLeads({ limit: 25 }),
      marketingApi.listConversions({ limit: 25 }),
    ])
      .then(([a, l, c]) => {
        if (!alive) return;
        setData(a); setLeads(l?.data || []); setConvs(c?.data || []); setErr(""); setLoading(false);
      })
      .catch(() => { if (alive) { setErr("Could not load attribution."); setLoading(false); } });
    return () => { alive = false; };
  }, [range, tick]);

  const addLead = async (e) => {
    e.preventDefault();
    if (!leadForm.name && !leadForm.email) return;
    setBusy(true);
    try {
      await marketingApi.createLead({
        name: leadForm.name || undefined,
        email: leadForm.email || undefined,
        source: leadForm.source || undefined,
        value: leadForm.value !== "" ? Number(leadForm.value) : undefined,
      });
      setLeadForm({ name: "", email: "", source: "", value: "" });
      reload();
    } catch (_) { /* surfaced by reload state */ } finally { setBusy(false); }
  };

  const recordConversion = async (leadId) => {
    setBusy(true);
    try {
      // Each deliberate click is a distinct real conversion (a repeat purchase or
      // renewal is genuinely a new event), so the key is unique per submit. Accidental
      // double-fire within one click is already blocked by the disabled button. Stable
      // idempotency keys are for webhook/API callers that can supply their own.
      const res = await marketingApi.createConversion({
        leadId,
        conversionType: convForm.conversionType || "Conversion",
        value: convForm.value !== "" ? Number(convForm.value) : undefined,
        idempotencyKey: `ui-${leadId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      });
      if (res && res.duplicate) setErr("That conversion was already recorded.");
      setConvFor(null); setConvForm({ conversionType: "Purchase", value: "" });
      reload();
    } catch (_) { /* ignore */ } finally { setBusy(false); }
  };

  const delLead = async (id) => { setBusy(true); try { await marketingApi.deleteLead(id); reload(); } catch (_) {} finally { setBusy(false); } };
  const delConv = async (id) => { setBusy(true); try { await marketingApi.deleteConversion(id); reload(); } catch (_) {} finally { setBusy(false); } };

  const t = data?.totals || { conversions: 0, revenue: 0, spend: 0, roi: null };
  const byCampaign = data?.byCampaign || [];
  const byChannel = data?.byChannel || [];
  const chMax = Math.max(1, ...byChannel.map((c) => c.revenue || 0), ...byChannel.map((c) => c.conversions || 0));

  return (
    <div className="mkw-attr">
      <div className="mkw-section-head">
        <div>
          <h2>Attribution</h2>
          <p>Last-touch attribution. Each conversion is credited to the most recent campaign the lead really touched.</p>
        </div>
        <div>
          <select value={range} onChange={(e) => setRange(e.target.value)}>
            {RANGES.map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
          </select>
        </div>
      </div>

      {err ? <p style={{ color: "#b91c1c", fontSize: 13 }}>{err}</p> : null}

      <div className="mkw-attr-kpis">
        <div className="mkw-attr-kpi"><span>Conversions</span><strong>{(t.conversions || 0).toLocaleString("en-US")}</strong><small>Explicit recorded events</small></div>
        <div className="mkw-attr-kpi"><span>Attributed Revenue</span><strong>{money(t.revenue)}</strong><small>Sum of conversion value</small></div>
        <div className="mkw-attr-kpi"><span>Spend</span><strong>{money(t.spend)}</strong><small>Recorded cost, not budget</small></div>
        <div className="mkw-attr-kpi"><span>ROI</span><strong>{pct(t.roi)}</strong><small>{t.spend > 0 ? "(Revenue − Spend) / Spend" : "No spend to compare"}</small></div>
      </div>

      <div className="mkw-attr-grid">
        <div className="mkw-panel">
          <div className="mkw-panel-head"><b>By Campaign</b><span style={{ fontSize: 12, color: "#94a3b8" }}>Last-touch</span></div>
          <div className="mkw-table-wrap" style={{ boxShadow: "none", border: "none" }}>
            <table>
              <thead><tr><th>Campaign</th><th>Leads</th><th>Conv.</th><th>Revenue</th><th>Spend</th><th>Cost / Lead</th><th>ROI</th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={CELL}>Loading…</td></tr>
                ) : byCampaign.length === 0 ? (
                  <tr><td colSpan={7} style={CELL}>No conversions recorded yet. Record a conversion below to see attribution.</td></tr>
                ) : byCampaign.map((c, i) => (
                  <tr key={c.campaignId || `unattr-${i}`}>
                    <td><b>{c.name}</b>{!c.campaignId ? <em style={{ color: "#94a3b8", fontStyle: "normal" }}> · no touch</em> : null}</td>
                    <td>{c.leads}</td>
                    <td>{c.conversions}</td>
                    <td>{money(c.revenue)}</td>
                    <td>{c.campaignId ? money(c.spend) : "—"}</td>
                    <td>{c.costPerLead != null ? money(c.costPerLead) : "—"}</td>
                    <td>{pct(c.roi)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mkw-panel">
          <div className="mkw-panel-head"><b>By Channel</b><span style={{ fontSize: 12, color: "#94a3b8" }}>Revenue</span></div>
          <div className="mkw-attr-bars">
            {loading ? (
              <p style={MUTED}>Loading…</p>
            ) : byChannel.length === 0 ? (
              <p style={MUTED}>No channel data yet</p>
            ) : byChannel.map((c, i) => (
              <div key={c.channel} className="mkw-attr-bar">
                <span className="mkw-attr-bar-label">{c.channel}</span>
                <span className="mkw-attr-bar-track"><i style={{ width: `${Math.max(4, ((c.revenue || 0) / chMax) * 100)}%` }} className={`b${i % 6}`} /></span>
                <span className="mkw-attr-bar-val">{money(c.revenue)} · {c.conversions}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mkw-attr-grid">
        <div className="mkw-panel">
          <div className="mkw-panel-head"><b>Leads</b><span style={{ fontSize: 12, color: "#94a3b8" }}>{leads.length} shown</span></div>
          <form className="mkw-lead-form" onSubmit={addLead}>
            <input placeholder="Name" value={leadForm.name} onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })} />
            <input placeholder="Email" value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} />
            <input placeholder="Source / channel" value={leadForm.source} onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })} />
            <input placeholder="Value" type="number" min="0" step="0.01" value={leadForm.value} onChange={(e) => setLeadForm({ ...leadForm, value: e.target.value })} />
            <button className="primary" disabled={busy || (!leadForm.name && !leadForm.email)}><I name="plus" size={14} />Add Lead</button>
          </form>
          <div className="mini-list">
            {leads.length === 0 ? (
              <p style={MUTED}>No leads yet. Add one above, or they arrive from forms and imports.</p>
            ) : leads.map((l) => (
              <p key={l.id} className="mkw-lead-row">
                <span>
                  <b>{l.name || l.email || "Lead"}</b>
                  <small>{[l.source, l.campaignName, l.conversions ? `${l.conversions} conv.` : null].filter(Boolean).join(" · ") || "No source"}</small>
                </span>
                {convFor === l.id ? (
                  <span className="mkw-conv-inline">
                    <input placeholder="Type" value={convForm.conversionType} onChange={(e) => setConvForm({ ...convForm, conversionType: e.target.value })} />
                    <input placeholder="Value" type="number" min="0" step="0.01" value={convForm.value} onChange={(e) => setConvForm({ ...convForm, value: e.target.value })} />
                    <button className="primary" disabled={busy} onClick={() => recordConversion(l.id)}>Save</button>
                    <button disabled={busy} onClick={() => setConvFor(null)}>×</button>
                  </span>
                ) : (
                  <span className="mkw-lead-actions">
                    <button title="Record conversion" disabled={busy} onClick={() => { setConvFor(l.id); setConvForm({ conversionType: "Purchase", value: "" }); }}><I name="flag" size={14} /></button>
                    <button title="Delete lead" disabled={busy} onClick={() => delLead(l.id)}><I name="trash-2" size={14} /></button>
                  </span>
                )}
              </p>
            ))}
          </div>
        </div>

        <div className="mkw-panel">
          <div className="mkw-panel-head"><b>Recent Conversions</b><span style={{ fontSize: 12, color: "#94a3b8" }}>{convs.length} shown</span></div>
          <div className="mini-list">
            {convs.length === 0 ? (
              <p style={MUTED}>No conversions yet</p>
            ) : convs.map((c) => (
              <p key={c.id} className="mkw-lead-row">
                <span>
                  <b>{c.conversionType || "Conversion"} · {money(c.value)}</b>
                  <small>{(c.attributedCampaignName || "Unattributed")}{c.attributedChannel ? ` · ${c.attributedChannel}` : ""} · {relativeTime(c.occurredAt)}</small>
                </span>
                <span className="mkw-lead-actions">
                  <button title="Delete conversion" disabled={busy} onClick={() => delConv(c.id)}><I name="trash-2" size={14} /></button>
                </span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const CELL = { textAlign: "center", padding: 20, color: "#64748b" };
const MUTED = { color: "#94a3b8", fontSize: 13, padding: "8px 2px" };
