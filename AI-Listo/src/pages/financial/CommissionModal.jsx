import React, { useEffect, useState } from "react";
import InsuranceWorkModal from "../insurance/InsuranceWorkModal";
import FinancialClientPicker from "./FinancialClientPicker";
import FinancialAccountPicker from "./FinancialAccountPicker";
import financialApi from "../../api/financialApi";
import { money, formatDate, toDateInput } from "../sales/salesFormat";

const STATUS_OPTIONS = ["Pending", "Approved", "Paid", "Cancelled"];

const EMPTY_FORM = {
  commissionNumber: "",
  clientId: "",
  clientName: "",
  accountId: "",
  accountName: "",
  advisorName: "",
  amount: "",
  rate: "",
  status: "Pending",
  commissionDate: "",
  notes: "",
};

export default function CommissionModal({ open, mode: initialMode, recordId, onClose, onSaved }) {
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
      .getCommission(recordId)
      .then((cm) => {
        if (cancelled) return;
        setRecord(cm);
        setForm({
          commissionNumber: cm.commissionNumber || "",
          clientId: cm.clientId || "",
          clientName: cm.clientName || "",
          accountId: cm.accountId || "",
          accountName: [cm.accountNumber, cm.clientName].filter(Boolean).join(" · "),
          advisorName: cm.advisorName || "",
          amount: cm.amount != null ? String(cm.amount) : "",
          rate: cm.rate != null ? String(cm.rate) : "",
          status: cm.status || "Pending",
          commissionDate: toDateInput(cm.commissionDate),
          notes: cm.notes || "",
        });
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Failed to load commission");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, recordId, initialMode]);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleClientChange = (client) =>
    setForm((f) => ({
      ...f,
      clientId: client ? client.id : "",
      clientName: client ? client.name || "" : "",
    }));
  const handleAccountChange = (account) =>
    setForm((f) => ({
      ...f,
      accountId: account ? account.id : "",
      accountName: account ? account.name || "" : "",
    }));

  function buildPayload() {
    const payload = {
      commissionNumber: form.commissionNumber.trim(),
      clientId: form.clientId || null,
      accountId: form.accountId || null,
      advisorName: form.advisorName.trim(),
      status: form.status,
      commissionDate: form.commissionDate || null,
      notes: form.notes.trim(),
    };
    payload.amount =
      form.amount !== "" && !isNaN(Number(form.amount)) ? Number(form.amount) : null;
    payload.rate =
      form.rate !== "" && !isNaN(Number(form.rate)) ? Number(form.rate) : null;
    return payload;
  }

  const requestClose = () => {
    if (saving) return;
    onClose?.();
  };

  async function handleSave() {
    if (!form.clientId && !form.accountId && !form.advisorName.trim()) {
      setError("Link a client or account, or name the advisor.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload();
      if (mode === "create") await financialApi.createCommission(payload);
      else await financialApi.updateCommission(recordId, payload);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to save commission");
    }
  }

  async function handleDelete() {
    if (!recordId) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm("Delete this commission? This cannot be undone.")) return;
    setSaving(true);
    setError(null);
    try {
      await financialApi.deleteCommission(recordId);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to delete commission");
    }
  }

  const isForm = mode === "create" || mode === "edit";
  const title =
    mode === "create" ? "New Commission" : mode === "edit" ? "Edit Commission" : record?.commissionNumber || "Commission";
  const subtitle = mode === "view" ? record?.clientName || record?.advisorName || "" : "Fee revenue record";

  const footer = loading ? null : isForm ? (
    <>
      <button type="button" className="iw-btn" onClick={requestClose} disabled={saving}>Cancel</button>
      <button type="button" className="iw-btn primary" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : mode === "create" ? "Create commission" : "Save changes"}
      </button>
    </>
  ) : (
    <>
      <button type="button" className="iw-btn danger iw-btn-spacer" onClick={handleDelete} disabled={saving}>Delete</button>
      <button type="button" className="iw-btn" onClick={requestClose}>Close</button>
      <button type="button" className="iw-btn primary" onClick={() => setMode("edit")}>Edit</button>
    </>
  );

  return (
    <InsuranceWorkModal open={open} title={title} subtitle={subtitle} onClose={requestClose} footer={footer}>
      {loading ? (
        <div className="iw-loading">Loading...</div>
      ) : isForm ? (
        <>
          {error && <p className="iw-error">{error}</p>}
          <p className="iw-hint">Commission is recorded fee revenue. It is tracked separately from account balances and AUM.</p>
          <div className="iw-form">
            <div className="iw-field full">
              <label>Client</label>
              <FinancialClientPicker
                value={form.clientId ? { id: form.clientId, name: form.clientName } : null}
                onChange={handleClientChange}
              />
            </div>
            <div className="iw-field full">
              <label>Account</label>
              <FinancialAccountPicker
                value={form.accountId ? { id: form.accountId, name: form.accountName } : null}
                onChange={handleAccountChange}
              />
            </div>
            <div className="iw-field">
              <label>Advisor</label>
              <input value={form.advisorName} onChange={setField("advisorName")} placeholder="Advisor name" />
            </div>
            <div className="iw-field">
              <label>Amount</label>
              <input type="number" step="0.01" value={form.amount} onChange={setField("amount")} placeholder="0.00" />
            </div>
            <div className="iw-field">
              <label>Rate (%)</label>
              <input type="number" step="0.001" value={form.rate} onChange={setField("rate")} placeholder="Optional" />
            </div>
            <div className="iw-field">
              <label>Status</label>
              <select value={form.status} onChange={setField("status")}>
                {STATUS_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div className="iw-field">
              <label>Commission date</label>
              <input type="date" value={form.commissionDate} onChange={setField("commissionDate")} />
            </div>
            <div className="iw-field">
              <label>Commission number</label>
              <input value={form.commissionNumber} onChange={setField("commissionNumber")} placeholder="Auto-generated if blank" />
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
            <div><dt>Commission number</dt><dd>{record?.commissionNumber || "-"}</dd></div>
            <div><dt>Status</dt><dd>{record?.status || "-"}</dd></div>
            <div><dt>Client</dt><dd>{record?.clientName || "-"}</dd></div>
            <div><dt>Account</dt><dd>{record?.accountNumber || "-"}</dd></div>
            <div><dt>Advisor</dt><dd>{record?.advisorName || "-"}</dd></div>
            <div><dt>Amount</dt><dd>{record?.amount != null ? money(record.amount) : "-"}</dd></div>
            <div><dt>Rate</dt><dd>{record?.rate != null ? `${record.rate}%` : "-"}</dd></div>
            <div><dt>Commission date</dt><dd>{formatDate(record?.commissionDate)}</dd></div>
            <div className="full"><dt>Notes</dt><dd>{record?.notes || "-"}</dd></div>
          </dl>
        </>
      )}
    </InsuranceWorkModal>
  );
}
