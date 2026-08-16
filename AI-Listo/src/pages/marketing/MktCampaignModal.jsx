import React, { useEffect, useState } from "react";
import InsuranceWorkModal from "../insurance/InsuranceWorkModal";
import marketingApi from "../../api/marketingApi";
import { money, formatDate, toDateInput } from "../sales/salesFormat";

const TYPE_OPTIONS = [
  "Product Launch", "Webinar", "Nurture", "Paid Search", "Brand Awareness",
  "Promotion", "Traffic", "Content Offer", "Event", "Other",
];
const STATUS_OPTIONS = ["Draft", "Scheduled", "Active", "Paused", "Completed", "Canceled", "Archived"];

const EMPTY = {
  name: "", campaignType: "", channel: "", audienceName: "", status: "Draft",
  budget: "", ownerName: "", startDate: "", endDate: "", goals: "", tags: "", notes: "", tracking: "",
};

export default function MktCampaignModal({ open, mode: initialMode, recordId, onClose, onSaved }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState(EMPTY);
  const [record, setRecord] = useState(null);
  const [costs, setCosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [newCost, setNewCost] = useState({ amount: "", costDate: "", source: "Manual", description: "" });

  useEffect(() => { if (open) setMode(initialMode); }, [open, initialMode]);

  const loadCosts = (id) => marketingApi.listCosts(id).then((r) => setCosts(Array.isArray(r) ? r : [])).catch(() => {});

  useEffect(() => {
    if (!open) return undefined;
    setError(null); setCosts([]);
    if (initialMode === "create") { setForm(EMPTY); setRecord(null); return undefined; }
    if (!recordId) return undefined;
    let cancelled = false;
    setLoading(true);
    marketingApi.getCampaign(recordId)
      .then((c) => {
        if (cancelled) return;
        setRecord(c);
        setForm({
          name: c.name || "", campaignType: c.campaignType || "", channel: c.channel || "",
          audienceName: c.audienceName || "", status: c.status || "Draft",
          budget: c.budget != null ? String(c.budget) : "", ownerName: c.ownerName || "",
          startDate: toDateInput(c.startDate), endDate: toDateInput(c.endDate),
          goals: c.goals || "", tags: Array.isArray(c.tags) ? c.tags.join(", ") : "",
          notes: c.notes || "", tracking: c.tracking || "",
        });
        setLoading(false);
        loadCosts(recordId);
      })
      .catch((e) => { if (!cancelled) { setError(e?.message || "Failed to load campaign"); setLoading(false); } });
    return () => { cancelled = true; };
  }, [open, recordId, initialMode]);

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function buildPayload() {
    const payload = {
      name: form.name.trim(), campaignType: form.campaignType.trim(), channel: form.channel.trim(),
      audienceName: form.audienceName.trim(), status: form.status, ownerName: form.ownerName.trim(),
      startDate: form.startDate || null, endDate: form.endDate || null,
      goals: form.goals.trim(), notes: form.notes.trim(), tracking: form.tracking.trim(),
      tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
    };
    payload.budget = form.budget !== "" && !isNaN(Number(form.budget)) ? Number(form.budget) : null;
    return payload;
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("A campaign name is required."); return; }
    setSaving(true); setError(null);
    try {
      if (mode === "create") await marketingApi.createCampaign(buildPayload());
      else await marketingApi.updateCampaign(recordId, buildPayload());
      setSaving(false); onSaved?.(); onClose?.();
    } catch (e) { setSaving(false); setError(e?.message || "Failed to save campaign"); }
  }

  async function quickStatus(status) {
    setSaving(true); setError(null);
    try { await marketingApi.updateCampaign(recordId, { status }); setSaving(false); onSaved?.(); onClose?.(); }
    catch (e) { setSaving(false); setError(e?.message || "Failed to update status"); }
  }

  async function handleDuplicate() {
    setSaving(true); setError(null);
    try { await marketingApi.duplicateCampaign(recordId); setSaving(false); onSaved?.(); onClose?.(); }
    catch (e) { setSaving(false); setError(e?.message || "Failed to duplicate"); }
  }

  async function handleDelete() {
    if (!recordId) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm("Delete this campaign? This cannot be undone.")) return;
    setSaving(true); setError(null);
    try { await marketingApi.deleteCampaign(recordId); setSaving(false); onSaved?.(); onClose?.(); }
    catch (e) { setSaving(false); setError(e?.message || "Failed to delete"); }
  }

  async function addCost() {
    if (newCost.amount === "" || isNaN(Number(newCost.amount))) { setError("Enter a cost amount."); return; }
    try {
      await marketingApi.createCost(recordId, {
        amount: Number(newCost.amount), costDate: newCost.costDate || null,
        source: newCost.source || "Manual", description: newCost.description || null,
      });
      setNewCost({ amount: "", costDate: "", source: "Manual", description: "" });
      await loadCosts(recordId);
      onSaved?.();
    } catch (e) { setError(e?.message || "Failed to record cost"); }
  }
  async function delCost(costId) {
    try { await marketingApi.deleteCost(recordId, costId); await loadCosts(recordId); onSaved?.(); }
    catch (e) { setError(e?.message || "Failed to delete cost"); }
  }

  const isForm = mode === "create" || mode === "edit";
  const spend = costs.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const title = mode === "create" ? "New Campaign" : mode === "edit" ? "Edit Campaign" : record?.name || "Campaign";
  const subtitle = mode === "view" ? record?.campaignType || "" : "Campaign details";

  const footer = loading ? null : isForm ? (
    <>
      <button type="button" className="iw-btn" onClick={onClose} disabled={saving}>Cancel</button>
      <button type="button" className="iw-btn primary" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : mode === "create" ? "Create campaign" : "Save changes"}
      </button>
    </>
  ) : (
    <>
      <button type="button" className="iw-btn danger iw-btn-spacer" onClick={handleDelete} disabled={saving}>Delete</button>
      <button type="button" className="iw-btn" onClick={handleDuplicate} disabled={saving}>Duplicate</button>
      {record?.status !== "Active" && <button type="button" className="iw-btn" onClick={() => quickStatus("Active")} disabled={saving}>Activate</button>}
      {record?.status === "Active" && <button type="button" className="iw-btn" onClick={() => quickStatus("Paused")} disabled={saving}>Pause</button>}
      <button type="button" className="iw-btn" onClick={onClose}>Close</button>
      <button type="button" className="iw-btn primary" onClick={() => setMode("edit")}>Edit</button>
    </>
  );

  return (
    <InsuranceWorkModal open={open} title={title} subtitle={subtitle} onClose={onClose} footer={footer}>
      {loading ? (
        <div className="iw-loading">Loading...</div>
      ) : isForm ? (
        <>
          {error && <p className="iw-error">{error}</p>}
          <p className="iw-hint">Budget is the plan. Actual spend is recorded separately from real costs, in the campaign view.</p>
          <div className="iw-form">
            <div className="iw-field full"><label>Campaign name</label><input value={form.name} onChange={setField("name")} placeholder="Campaign name" /></div>
            <div className="iw-field"><label>Type</label>
              <select value={form.campaignType} onChange={setField("campaignType")}>
                <option value="">Select type</option>
                {TYPE_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div className="iw-field"><label>Status</label>
              <select value={form.status} onChange={setField("status")}>
                {STATUS_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div className="iw-field"><label>Channels (comma separated)</label><input value={form.channel} onChange={setField("channel")} placeholder="email, search, linkedin" /></div>
            <div className="iw-field"><label>Audience</label><input value={form.audienceName} onChange={setField("audienceName")} placeholder="Audience name" /></div>
            <div className="iw-field"><label>Budget (plan)</label><input type="number" step="0.01" value={form.budget} onChange={setField("budget")} placeholder="0.00" /></div>
            <div className="iw-field"><label>Owner</label><input value={form.ownerName} onChange={setField("ownerName")} placeholder="Owner name" /></div>
            <div className="iw-field"><label>Start date</label><input type="date" value={form.startDate} onChange={setField("startDate")} /></div>
            <div className="iw-field"><label>End date</label><input type="date" value={form.endDate} onChange={setField("endDate")} /></div>
            <div className="iw-field full"><label>Tags (comma separated)</label><input value={form.tags} onChange={setField("tags")} placeholder="e.g. q2, launch" /></div>
            <div className="iw-field full"><label>Goals</label><input value={form.goals} onChange={setField("goals")} placeholder="Campaign goal" /></div>
            <div className="iw-field full"><label>Tracking</label><input value={form.tracking} onChange={setField("tracking")} placeholder="UTM / tracking notes" /></div>
            <div className="iw-field full"><label>Notes</label><textarea value={form.notes} onChange={setField("notes")} placeholder="Internal notes" /></div>
          </div>
        </>
      ) : (
        <>
          {error && <p className="iw-error">{error}</p>}
          <dl className="iw-detail">
            <div><dt>Campaign</dt><dd>{record?.campaignNumber || "-"}</dd></div>
            <div><dt>Status</dt><dd>{record?.status || "-"}</dd></div>
            <div><dt>Type</dt><dd>{record?.campaignType || "-"}</dd></div>
            <div><dt>Channels</dt><dd>{record?.channel || "-"}</dd></div>
            <div><dt>Audience</dt><dd>{record?.audienceName || "-"}</dd></div>
            <div><dt>Owner</dt><dd>{record?.ownerName || "-"}</dd></div>
            <div><dt>Budget (plan)</dt><dd>{record?.budget != null ? money(record.budget) : "-"}</dd></div>
            <div><dt>Spend (recorded)</dt><dd>{money(spend)}</dd></div>
            <div><dt>Start</dt><dd>{formatDate(record?.startDate)}</dd></div>
            <div><dt>End</dt><dd>{formatDate(record?.endDate)}</dd></div>
            <div className="full"><dt>Goals</dt><dd>{record?.goals || "-"}</dd></div>
            <div className="full"><dt>Notes</dt><dd>{record?.notes || "-"}</dd></div>
          </dl>

          <div style={{ marginTop: 14, fontWeight: 700, fontSize: 13, color: "#0f172a" }}>Recorded spend</div>
          <p className="iw-hint">Actual costs, kept separate from the plan budget. Ad-platform spend appears here only from a real connected integration.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 8 }}>
            <input style={ST.mini} type="number" step="0.01" placeholder="Amount" value={newCost.amount} onChange={(e) => setNewCost((c) => ({ ...c, amount: e.target.value }))} />
            <input style={ST.mini} type="date" value={newCost.costDate} onChange={(e) => setNewCost((c) => ({ ...c, costDate: e.target.value }))} />
            <input style={{ ...ST.mini, flex: 1 }} placeholder="Source (Manual)" value={newCost.source} onChange={(e) => setNewCost((c) => ({ ...c, source: e.target.value }))} />
            <button type="button" className="iw-btn" onClick={addCost}>Add cost</button>
          </div>
          {costs.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 13 }}>No recorded spend yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {costs.map((c) => (
                <div key={c.id} style={ST.costRow}>
                  <b>{money(c.amount)}</b>
                  <span style={{ color: "#64748b" }}>{c.source || "Manual"}</span>
                  <span style={{ flex: 1, color: "#94a3b8" }}>{formatDate(c.costDate)}</span>
                  <button type="button" style={ST.del} onClick={() => delCost(c.id)}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </InsuranceWorkModal>
  );
}

const ST = {
  mini: { border: "1px solid #e5e7eb", borderRadius: 8, padding: "7px 10px", fontSize: 13, minWidth: 90 },
  costRow: { display: "flex", alignItems: "center", gap: 10, border: "1px solid #eef2f7", borderRadius: 8, padding: "7px 10px", fontSize: 13 },
  del: { border: "none", background: "transparent", color: "#dc2626", cursor: "pointer", fontSize: 12 },
};
