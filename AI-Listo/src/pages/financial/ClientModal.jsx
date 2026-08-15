import React, { useEffect, useState } from "react";
import InsuranceWorkModal from "../insurance/InsuranceWorkModal";
import FinancialContactPicker from "./FinancialContactPicker";
import financialApi from "../../api/financialApi";
import { money, formatDate, toDateInput } from "../sales/salesFormat";

const KIND_OPTIONS = ["Individual", "Business"];
const TYPE_OPTIONS = ["Retail Client", "Corporate Client"];
const RISK_OPTIONS = ["Conservative", "Moderate Low", "Moderate", "Moderate High", "High"];
const STATUS_OPTIONS = ["Active", "Inactive"];

const EMPTY_FORM = {
  clientNumber: "",
  contactId: "",
  contactName: "",
  clientName: "",
  kind: "Individual",
  clientType: "Retail Client",
  advisorName: "",
  accountType: "",
  aum: "",
  riskLevel: "Moderate",
  status: "Active",
  nextReviewDate: "",
  notes: "",
};

export default function ClientModal({ open, mode: initialMode, recordId, onClose, onSaved }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState(EMPTY_FORM);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  useEffect(() => {
    if (!open) return undefined;
    setError(null);
    if (initialMode === "create") {
      setForm(EMPTY_FORM);
      setRecord(null);
      return undefined;
    }
    if (!recordId) return undefined;
    let cancelled = false;
    setLoading(true);
    financialApi
      .getClient(recordId)
      .then((c) => {
        if (cancelled) return;
        setRecord(c);
        setForm({
          clientNumber: c.clientNumber || "",
          contactId: c.contactId || "",
          contactName: c.clientName || "",
          clientName: c.clientName || "",
          kind: c.kind || "Individual",
          clientType: c.clientType || "Retail Client",
          advisorName: c.advisorName || "",
          accountType: c.accountType || "",
          aum: c.aum != null ? String(c.aum) : "",
          riskLevel: c.riskLevel || "Moderate",
          status: c.status || "Active",
          nextReviewDate: toDateInput(c.nextReviewDate),
          notes: c.notes || "",
        });
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Failed to load client");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, recordId, initialMode]);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleContactChange = (contact) =>
    setForm((f) => ({
      ...f,
      contactId: contact ? contact.id : "",
      contactName: contact ? contact.name || "" : "",
      clientName: f.clientName || (contact ? contact.name || "" : ""),
    }));

  function buildPayload() {
    const payload = {
      clientNumber: form.clientNumber.trim(),
      contactId: form.contactId || null,
      clientName: form.clientName.trim(),
      kind: form.kind,
      clientType: form.clientType,
      advisorName: form.advisorName.trim(),
      accountType: form.accountType.trim(),
      riskLevel: form.riskLevel,
      status: form.status,
      nextReviewDate: form.nextReviewDate || null,
      notes: form.notes.trim(),
    };
    payload.aum =
      form.aum !== "" && !isNaN(Number(form.aum)) ? Number(form.aum) : null;
    return payload;
  }

  const requestClose = () => {
    if (saving) return;
    onClose?.();
  };

  async function handleSave() {
    if (!form.clientName.trim() && !form.contactId) {
      setError("A client name or a linked contact is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload();
      if (mode === "create") await financialApi.createClient(payload);
      else await financialApi.updateClient(recordId, payload);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to save client");
    }
  }

  async function handleDelete() {
    if (!recordId) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm("Delete this client? This cannot be undone.")) return;
    setSaving(true);
    setError(null);
    try {
      await financialApi.deleteClient(recordId);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to delete client");
    }
  }

  const isForm = mode === "create" || mode === "edit";
  const title =
    mode === "create" ? "New Client" : mode === "edit" ? "Edit Client" : record?.clientName || record?.clientNumber || "Client";
  const subtitle = mode === "view" ? record?.clientNumber || "" : "Client details";

  const footer = loading ? null : isForm ? (
    <>
      <button type="button" className="iw-btn" onClick={requestClose} disabled={saving}>
        Cancel
      </button>
      <button type="button" className="iw-btn primary" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : mode === "create" ? "Create client" : "Save changes"}
      </button>
    </>
  ) : (
    <>
      <button type="button" className="iw-btn danger iw-btn-spacer" onClick={handleDelete} disabled={saving}>
        Delete
      </button>
      <button type="button" className="iw-btn" onClick={requestClose}>
        Close
      </button>
      <button type="button" className="iw-btn primary" onClick={() => setMode("edit")}>
        Edit
      </button>
    </>
  );

  return (
    <InsuranceWorkModal open={open} title={title} subtitle={subtitle} onClose={requestClose} footer={footer}>
      {loading ? (
        <div className="iw-loading">Loading...</div>
      ) : isForm ? (
        <>
          {error && <p className="iw-error">{error}</p>}
          <div className="iw-form">
            <div className="iw-field full">
              <label>Contact (existing customer)</label>
              <FinancialContactPicker
                value={form.contactId ? { id: form.contactId, name: form.contactName } : null}
                onChange={handleContactChange}
              />
            </div>
            <div className="iw-field">
              <label>Client name</label>
              <input value={form.clientName} onChange={setField("clientName")} placeholder="Person or business name" />
            </div>
            <div className="iw-field">
              <label>Kind</label>
              <select value={form.kind} onChange={setField("kind")}>
                {KIND_OPTIONS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div className="iw-field">
              <label>Client type</label>
              <select value={form.clientType} onChange={setField("clientType")}>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="iw-field">
              <label>Primary advisor</label>
              <input value={form.advisorName} onChange={setField("advisorName")} placeholder="Advisor name" />
            </div>
            <div className="iw-field">
              <label>Account type</label>
              <input value={form.accountType} onChange={setField("accountType")} placeholder="e.g. Investment Portfolio" />
            </div>
            <div className="iw-field">
              <label>AUM / Balance (recorded)</label>
              <input type="number" step="0.01" value={form.aum} onChange={setField("aum")} placeholder="0.00" />
            </div>
            <div className="iw-field">
              <label>Risk level</label>
              <select value={form.riskLevel} onChange={setField("riskLevel")}>
                {RISK_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="iw-field">
              <label>Status</label>
              <select value={form.status} onChange={setField("status")}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="iw-field">
              <label>Client number</label>
              <input value={form.clientNumber} onChange={setField("clientNumber")} placeholder="Auto-generated if blank" />
            </div>
            <div className="iw-field">
              <label>Next review</label>
              <input type="date" value={form.nextReviewDate} onChange={setField("nextReviewDate")} />
            </div>
            <div className="iw-field full">
              <label>Notes</label>
              <textarea value={form.notes} onChange={setField("notes")} placeholder="Internal notes" />
            </div>
          </div>
        </>
      ) : (
        <>
          {error && <p className="iw-error">{error}</p>}
          <dl className="iw-detail">
            <div><dt>Client number</dt><dd>{record?.clientNumber || "-"}</dd></div>
            <div><dt>Status</dt><dd>{record?.status || "-"}</dd></div>
            <div><dt>Client name</dt><dd>{record?.clientName || "-"}</dd></div>
            <div><dt>Kind</dt><dd>{record?.kind || "-"}</dd></div>
            <div><dt>Client type</dt><dd>{record?.clientType || "-"}</dd></div>
            <div><dt>Primary advisor</dt><dd>{record?.advisorName || "-"}</dd></div>
            <div><dt>Account type</dt><dd>{record?.accountType || "-"}</dd></div>
            <div><dt>AUM / Balance</dt><dd>{record?.aum != null ? money(record.aum) : "-"}</dd></div>
            <div><dt>Risk level</dt><dd>{record?.riskLevel || "-"}</dd></div>
            <div><dt>Next review</dt><dd>{formatDate(record?.nextReviewDate)}</dd></div>
            <div className="full"><dt>Notes</dt><dd>{record?.notes || "-"}</dd></div>
          </dl>
        </>
      )}
    </InsuranceWorkModal>
  );
}
