import React, { useEffect, useState } from "react";
import InsuranceWorkModal from "../insurance/InsuranceWorkModal";

// Generic config-rule modal for SLA policies, escalation rules and automation rules.
// Driven by a `fields` config so the three entities share one reviewed form. `api`
// provides { get, create, update, remove }. All authorization is server-side.
export default function CsRuleModal({ open, mode: initialMode, recordId, onClose, onSaved, entity, fields, api }) {
  const blank = () => {
    const f = {};
    fields.forEach((fld) => {
      f[fld.key] = fld.type === "checkbox" ? (fld.default ?? true) : (fld.default ?? "");
    });
    return f;
  };
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { if (open) setMode(initialMode); }, [open, initialMode]);

  useEffect(() => {
    if (!open) return undefined;
    setError(null);
    if (initialMode === "create") { setForm(blank()); return undefined; }
    if (!recordId) return undefined;
    let cancelled = false;
    setLoading(true);
    api.get(recordId)
      .then((r) => {
        if (cancelled) return;
        const f = {};
        fields.forEach((fld) => {
          const v = r[fld.key];
          f[fld.key] = fld.type === "checkbox" ? !!v : (v ?? "");
        });
        setForm(f);
        setLoading(false);
      })
      .catch((e) => { if (!cancelled) { setError(e?.message || "Failed to load"); setLoading(false); } });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, recordId, initialMode]);

  const setField = (key, type) => (e) =>
    setForm((f) => ({ ...f, [key]: type === "checkbox" ? e.target.checked : e.target.value }));

  function buildPayload() {
    const payload = {};
    fields.forEach((fld) => {
      let v = form[fld.key];
      if (fld.type === "number") {
        v = v === "" || v === null || isNaN(Number(v)) ? null : Number(v);
      } else if (fld.type === "checkbox") {
        v = !!v;
      } else if (typeof v === "string") {
        v = v.trim();
      }
      payload[fld.key] = v;
    });
    return payload;
  }

  async function handleSave() {
    const nameField = fields.find((f) => f.key === "name");
    if (nameField && !String(form.name || "").trim()) { setError("A name is required."); return; }
    setSaving(true); setError(null);
    try {
      if (mode === "create") await api.create(buildPayload());
      else await api.update(recordId, buildPayload());
      setSaving(false); onSaved?.(); onClose?.();
    } catch (e) { setSaving(false); setError(e?.message || "Failed to save"); }
  }

  async function handleDelete() {
    if (!recordId) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete this ${entity}? This cannot be undone.`)) return;
    setSaving(true); setError(null);
    try {
      await api.remove(recordId);
      setSaving(false); onSaved?.(); onClose?.();
    } catch (e) { setSaving(false); setError(e?.message || "Failed to delete"); }
  }

  const isForm = mode === "create" || mode === "edit";
  const title = mode === "create" ? `New ${entity}` : mode === "edit" ? `Edit ${entity}` : entity;

  const footer = loading ? null : isForm ? (
    <>
      <button type="button" className="iw-btn" onClick={onClose} disabled={saving}>Cancel</button>
      <button type="button" className="iw-btn primary" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : mode === "create" ? `Create ${entity}` : "Save changes"}
      </button>
    </>
  ) : (
    <>
      <button type="button" className="iw-btn danger iw-btn-spacer" onClick={handleDelete} disabled={saving}>Delete</button>
      <button type="button" className="iw-btn" onClick={onClose}>Close</button>
      <button type="button" className="iw-btn primary" onClick={() => setMode("edit")}>Edit</button>
    </>
  );

  return (
    <InsuranceWorkModal open={open} title={title} subtitle="" onClose={onClose} footer={footer}>
      {loading ? (
        <div className="iw-loading">Loading...</div>
      ) : (
        <>
          {error && <p className="iw-error">{error}</p>}
          <div className="iw-form">
            {fields.map((fld) => (
              <div className={`iw-field ${fld.full ? "full" : ""}`} key={fld.key}>
                <label>{fld.label}</label>
                {!isForm ? (
                  <div style={{ fontSize: 14, color: "#334155", padding: "4px 0" }}>
                    {fld.type === "checkbox" ? (form[fld.key] ? "Yes" : "No") : (form[fld.key] || "-")}
                  </div>
                ) : fld.type === "select" ? (
                  <select value={form[fld.key]} onChange={setField(fld.key, fld.type)}>
                    <option value="">{fld.placeholder || "Select"}</option>
                    {(fld.options || []).map((o) => (<option key={o} value={o}>{o}</option>))}
                  </select>
                ) : fld.type === "checkbox" ? (
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                    <input type="checkbox" checked={!!form[fld.key]} onChange={setField(fld.key, fld.type)} />
                    {fld.checkboxLabel || "Active"}
                  </label>
                ) : fld.type === "textarea" ? (
                  <textarea value={form[fld.key]} onChange={setField(fld.key, fld.type)} rows={3} placeholder={fld.placeholder || ""} />
                ) : (
                  <input
                    type={fld.type === "number" ? "number" : "text"}
                    value={form[fld.key]}
                    onChange={setField(fld.key, fld.type)}
                    placeholder={fld.placeholder || ""}
                  />
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </InsuranceWorkModal>
  );
}
