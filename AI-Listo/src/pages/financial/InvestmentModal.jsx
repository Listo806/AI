import React, { useEffect, useState } from "react";
import InsuranceWorkModal from "../insurance/InsuranceWorkModal";
import FinancialClientPicker from "./FinancialClientPicker";
import FinancialAccountPicker from "./FinancialAccountPicker";
import financialApi from "../../api/financialApi";
import { money, formatDate, toDateInput } from "../sales/salesFormat";

const CATEGORY_OPTIONS = [
  "Equities",
  "Fixed Income",
  "Cash",
  "Mutual Funds",
  "ETFs",
  "Real Estate",
  "Alternatives",
  "Other",
];
const STATUS_OPTIONS = ["Active", "Sold", "Closed"];

const EMPTY_FORM = {
  investmentNumber: "",
  clientId: "",
  clientName: "",
  accountId: "",
  accountName: "",
  name: "",
  category: "Equities",
  amount: "",
  units: "",
  status: "Active",
  asOfDate: "",
  notes: "",
};

export default function InvestmentModal({ open, mode: initialMode, recordId, onClose, onSaved }) {
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
      .getInvestment(recordId)
      .then((iv) => {
        if (cancelled) return;
        setRecord(iv);
        setForm({
          investmentNumber: iv.investmentNumber || "",
          clientId: iv.clientId || "",
          clientName: iv.clientName || "",
          accountId: iv.accountId || "",
          accountName: [iv.accountNumber, iv.clientName].filter(Boolean).join(" · "),
          name: iv.name || "",
          category: iv.category || "Equities",
          amount: iv.amount != null ? String(iv.amount) : "",
          units: iv.units != null ? String(iv.units) : "",
          status: iv.status || "Active",
          asOfDate: toDateInput(iv.asOfDate),
          notes: iv.notes || "",
        });
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Failed to load investment");
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
      investmentNumber: form.investmentNumber.trim(),
      clientId: form.clientId || null,
      accountId: form.accountId || null,
      name: form.name.trim(),
      category: form.category,
      status: form.status,
      asOfDate: form.asOfDate || null,
      notes: form.notes.trim(),
    };
    payload.amount =
      form.amount !== "" && !isNaN(Number(form.amount)) ? Number(form.amount) : null;
    payload.units =
      form.units !== "" && !isNaN(Number(form.units)) ? Number(form.units) : null;
    return payload;
  }

  const requestClose = () => {
    if (saving) return;
    onClose?.();
  };

  async function handleSave() {
    if (!form.name.trim()) {
      setError("A holding name is required.");
      return;
    }
    if (!form.clientId && !form.accountId) {
      setError("Link a client or an account.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload();
      if (mode === "create") await financialApi.createInvestment(payload);
      else await financialApi.updateInvestment(recordId, payload);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to save investment");
    }
  }

  async function handleDelete() {
    if (!recordId) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm("Delete this investment? This cannot be undone.")) return;
    setSaving(true);
    setError(null);
    try {
      await financialApi.deleteInvestment(recordId);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to delete investment");
    }
  }

  const isForm = mode === "create" || mode === "edit";
  const title =
    mode === "create" ? "New Investment" : mode === "edit" ? "Edit Investment" : record?.name || "Investment";
  const subtitle = mode === "view" ? record?.clientName || "" : "Holding details (recorded value)";

  const footer = loading ? null : isForm ? (
    <>
      <button type="button" className="iw-btn" onClick={requestClose} disabled={saving}>Cancel</button>
      <button type="button" className="iw-btn primary" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : mode === "create" ? "Create investment" : "Save changes"}
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
          <p className="iw-hint">Value is a recorded figure the advisor maintains. Cortexa never fetches live market prices.</p>
          <div className="iw-form">
            <div className="iw-field full">
              <label>Holding name</label>
              <input value={form.name} onChange={setField("name")} placeholder="e.g. S&P 500 Index Fund" />
            </div>
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
              <label>Category</label>
              <select value={form.category} onChange={setField("category")}>
                {CATEGORY_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div className="iw-field">
              <label>Status</label>
              <select value={form.status} onChange={setField("status")}>
                {STATUS_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div className="iw-field">
              <label>Value (recorded)</label>
              <input type="number" step="0.01" value={form.amount} onChange={setField("amount")} placeholder="0.00" />
            </div>
            <div className="iw-field">
              <label>Units</label>
              <input type="number" step="0.0001" value={form.units} onChange={setField("units")} placeholder="Optional" />
            </div>
            <div className="iw-field">
              <label>As of date</label>
              <input type="date" value={form.asOfDate} onChange={setField("asOfDate")} />
            </div>
            <div className="iw-field">
              <label>Investment number</label>
              <input value={form.investmentNumber} onChange={setField("investmentNumber")} placeholder="Auto-generated if blank" />
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
            <div><dt>Investment number</dt><dd>{record?.investmentNumber || "-"}</dd></div>
            <div><dt>Status</dt><dd>{record?.status || "-"}</dd></div>
            <div><dt>Holding name</dt><dd>{record?.name || "-"}</dd></div>
            <div><dt>Category</dt><dd>{record?.category || "-"}</dd></div>
            <div><dt>Client</dt><dd>{record?.clientName || "-"}</dd></div>
            <div><dt>Account</dt><dd>{record?.accountNumber || "-"}</dd></div>
            <div><dt>Value (recorded)</dt><dd>{record?.amount != null ? money(record.amount) : "-"}</dd></div>
            <div><dt>Units</dt><dd>{record?.units != null ? record.units : "-"}</dd></div>
            <div><dt>As of date</dt><dd>{formatDate(record?.asOfDate)}</dd></div>
            <div className="full"><dt>Notes</dt><dd>{record?.notes || "-"}</dd></div>
          </dl>
        </>
      )}
    </InsuranceWorkModal>
  );
}
