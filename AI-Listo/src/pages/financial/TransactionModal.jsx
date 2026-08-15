import React, { useEffect, useState } from "react";
import InsuranceWorkModal from "../insurance/InsuranceWorkModal";
import FinancialClientPicker from "./FinancialClientPicker";
import FinancialAccountPicker from "./FinancialAccountPicker";
import financialApi from "../../api/financialApi";
import { money, formatDate, toDateInput } from "../sales/salesFormat";

const TYPE_OPTIONS = [
  "Contribution",
  "Withdrawal",
  "Fee",
  "Dividend",
  "Interest",
  "Transfer",
  "Adjustment",
];
const STATUS_OPTIONS = ["Pending", "Completed", "Failed", "Cancelled"];

const EMPTY_FORM = {
  transactionNumber: "",
  clientId: "",
  clientName: "",
  accountId: "",
  accountName: "",
  transactionType: "Contribution",
  amount: "",
  status: "Completed",
  transactionDate: "",
  description: "",
  notes: "",
};

export default function TransactionModal({ open, mode: initialMode, recordId, onClose, onSaved }) {
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
      .getTransaction(recordId)
      .then((t) => {
        if (cancelled) return;
        setRecord(t);
        setForm({
          transactionNumber: t.transactionNumber || "",
          clientId: t.clientId || "",
          clientName: t.clientName || "",
          accountId: t.accountId || "",
          accountName: [t.accountNumber, t.clientName].filter(Boolean).join(" · "),
          transactionType: t.transactionType || "Contribution",
          amount: t.amount != null ? String(t.amount) : "",
          status: t.status || "Completed",
          transactionDate: toDateInput(t.transactionDate),
          description: t.description || "",
          notes: t.notes || "",
        });
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Failed to load transaction");
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
      transactionNumber: form.transactionNumber.trim(),
      clientId: form.clientId || null,
      accountId: form.accountId || null,
      transactionType: form.transactionType,
      status: form.status,
      transactionDate: form.transactionDate || null,
      description: form.description.trim(),
      notes: form.notes.trim(),
    };
    payload.amount =
      form.amount !== "" && !isNaN(Number(form.amount)) ? Number(form.amount) : null;
    return payload;
  }

  const requestClose = () => {
    if (saving) return;
    onClose?.();
  };

  async function handleSave() {
    if (!form.clientId && !form.accountId) {
      setError("Link a client or an account.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload();
      if (mode === "create") await financialApi.createTransaction(payload);
      else await financialApi.updateTransaction(recordId, payload);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to save transaction");
    }
  }

  async function handleDelete() {
    if (!recordId) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm("Delete this transaction? This cannot be undone.")) return;
    setSaving(true);
    setError(null);
    try {
      await financialApi.deleteTransaction(recordId);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to delete transaction");
    }
  }

  const isForm = mode === "create" || mode === "edit";
  const title =
    mode === "create" ? "New Transaction" : mode === "edit" ? "Edit Transaction" : record?.transactionNumber || "Transaction";
  const subtitle = mode === "view" ? record?.clientName || "" : "Transaction details (tracking record)";

  const footer = loading ? null : isForm ? (
    <>
      <button type="button" className="iw-btn" onClick={requestClose} disabled={saving}>Cancel</button>
      <button type="button" className="iw-btn primary" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : mode === "create" ? "Create transaction" : "Save changes"}
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
          <p className="iw-hint">This is a CRM record of money movement for tracking. Cortexa does not move, settle or hold any funds.</p>
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
              <label>Type</label>
              <select value={form.transactionType} onChange={setField("transactionType")}>
                {TYPE_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div className="iw-field">
              <label>Amount (recorded)</label>
              <input type="number" step="0.01" value={form.amount} onChange={setField("amount")} placeholder="0.00" />
            </div>
            <div className="iw-field">
              <label>Status</label>
              <select value={form.status} onChange={setField("status")}>
                {STATUS_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div className="iw-field">
              <label>Transaction date</label>
              <input type="date" value={form.transactionDate} onChange={setField("transactionDate")} />
            </div>
            <div className="iw-field">
              <label>Transaction number</label>
              <input value={form.transactionNumber} onChange={setField("transactionNumber")} placeholder="Auto-generated if blank" />
            </div>
            <div className="iw-field full">
              <label>Description</label>
              <input value={form.description} onChange={setField("description")} placeholder="Short description" />
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
            <div><dt>Transaction number</dt><dd>{record?.transactionNumber || "-"}</dd></div>
            <div><dt>Status</dt><dd>{record?.status || "-"}</dd></div>
            <div><dt>Client</dt><dd>{record?.clientName || "-"}</dd></div>
            <div><dt>Account</dt><dd>{record?.accountNumber || "-"}</dd></div>
            <div><dt>Type</dt><dd>{record?.transactionType || "-"}</dd></div>
            <div><dt>Amount</dt><dd>{record?.amount != null ? money(record.amount) : "-"}</dd></div>
            <div><dt>Transaction date</dt><dd>{formatDate(record?.transactionDate)}</dd></div>
            <div className="full"><dt>Description</dt><dd>{record?.description || "-"}</dd></div>
            <div className="full"><dt>Notes</dt><dd>{record?.notes || "-"}</dd></div>
          </dl>
        </>
      )}
    </InsuranceWorkModal>
  );
}
