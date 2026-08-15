import React, { useEffect, useState } from "react";
import InsuranceWorkModal from "../insurance/InsuranceWorkModal";
import FinancialClientPicker from "./FinancialClientPicker";
import financialApi from "../../api/financialApi";
import { money, formatDate, toDateInput } from "../sales/salesFormat";

const STATUS_OPTIONS = ["Active", "Inactive", "Closed"];
const TYPE_HINT = "e.g. Investment Portfolio / Retirement / Business";

const EMPTY_FORM = {
  accountNumber: "",
  clientId: "",
  clientName: "",
  accountType: "",
  advisorName: "",
  status: "Active",
  balance: "",
  openedDate: "",
  notes: "",
};

export default function AccountModal({ open, mode: initialMode, recordId, onClose, onSaved }) {
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
      .getAccount(recordId)
      .then((a) => {
        if (cancelled) return;
        setRecord(a);
        setForm({
          accountNumber: a.accountNumber || "",
          clientId: a.clientId || "",
          clientName: a.clientName || "",
          accountType: a.accountType || "",
          advisorName: a.advisorName || "",
          status: a.status || "Active",
          balance: a.balance != null ? String(a.balance) : "",
          openedDate: toDateInput(a.openedDate),
          notes: a.notes || "",
        });
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Failed to load account");
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

  function buildPayload() {
    const payload = {
      accountNumber: form.accountNumber.trim(),
      clientId: form.clientId || null,
      clientName: form.clientName.trim(),
      accountType: form.accountType.trim(),
      advisorName: form.advisorName.trim(),
      status: form.status,
      openedDate: form.openedDate || null,
      notes: form.notes.trim(),
    };
    payload.balance =
      form.balance !== "" && !isNaN(Number(form.balance)) ? Number(form.balance) : null;
    return payload;
  }

  const requestClose = () => {
    if (saving) return;
    onClose?.();
  };

  async function handleSave() {
    if (!form.clientName.trim() && !form.clientId) {
      setError("A client is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload();
      if (mode === "create") await financialApi.createAccount(payload);
      else await financialApi.updateAccount(recordId, payload);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to save account");
    }
  }

  async function handleDelete() {
    if (!recordId) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm("Delete this account? This cannot be undone.")) return;
    setSaving(true);
    setError(null);
    try {
      await financialApi.deleteAccount(recordId);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to delete account");
    }
  }

  const isForm = mode === "create" || mode === "edit";
  const title =
    mode === "create" ? "New Account" : mode === "edit" ? "Edit Account" : record?.accountNumber || "Account";
  const subtitle = mode === "view" ? record?.clientName || "" : "Account details (CRM record)";

  const footer = loading ? null : isForm ? (
    <>
      <button type="button" className="iw-btn" onClick={requestClose} disabled={saving}>Cancel</button>
      <button type="button" className="iw-btn primary" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : mode === "create" ? "Create account" : "Save changes"}
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
          <p className="iw-hint">Balance is a recorded figure for tracking. This is not a bank or custodial account.</p>
          <div className="iw-form">
            <div className="iw-field full">
              <label>Client</label>
              <FinancialClientPicker
                value={form.clientId ? { id: form.clientId, name: form.clientName } : null}
                onChange={handleClientChange}
              />
            </div>
            <div className="iw-field">
              <label>Account type</label>
              <input value={form.accountType} onChange={setField("accountType")} placeholder={TYPE_HINT} />
            </div>
            <div className="iw-field">
              <label>Advisor</label>
              <input value={form.advisorName} onChange={setField("advisorName")} placeholder="Advisor name" />
            </div>
            <div className="iw-field">
              <label>Account number</label>
              <input value={form.accountNumber} onChange={setField("accountNumber")} placeholder="Auto-generated if blank" />
            </div>
            <div className="iw-field">
              <label>Status</label>
              <select value={form.status} onChange={setField("status")}>
                {STATUS_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div className="iw-field">
              <label>Balance (recorded)</label>
              <input type="number" step="0.01" value={form.balance} onChange={setField("balance")} placeholder="0.00" />
            </div>
            <div className="iw-field">
              <label>Opened date</label>
              <input type="date" value={form.openedDate} onChange={setField("openedDate")} />
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
            <div><dt>Account number</dt><dd>{record?.accountNumber || "-"}</dd></div>
            <div><dt>Status</dt><dd>{record?.status || "-"}</dd></div>
            <div><dt>Client</dt><dd>{record?.clientName || "-"}</dd></div>
            <div><dt>Account type</dt><dd>{record?.accountType || "-"}</dd></div>
            <div><dt>Advisor</dt><dd>{record?.advisorName || "-"}</dd></div>
            <div><dt>Balance</dt><dd>{record?.balance != null ? money(record.balance) : "-"}</dd></div>
            <div><dt>Opened date</dt><dd>{formatDate(record?.openedDate)}</dd></div>
            <div className="full"><dt>Notes</dt><dd>{record?.notes || "-"}</dd></div>
          </dl>
        </>
      )}
    </InsuranceWorkModal>
  );
}
