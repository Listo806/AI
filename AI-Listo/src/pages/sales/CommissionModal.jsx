import React, { useEffect, useState } from "react";
import InsuranceWorkModal from "../insurance/InsuranceWorkModal";
import SalesContactPicker from "./SalesContactPicker";
import salesApi from "../../api/salesApi";
import { money, formatDate, toDateInput } from "./salesFormat";

const STATUS_OPTIONS = ["Pending", "Earned", "Approved", "Paid", "Cancelled"];

const EMPTY_FORM = {
  commissionNumber: "",
  contactId: "",
  contactName: "",
  customerName: "",
  dealName: "",
  repName: "",
  source: "",
  rate: "",
  amount: "",
  status: "Pending",
  earnedDate: "",
  paidDate: "",
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
    salesApi
      .getCommission(recordId)
      .then((c) => {
        if (cancelled) return;
        setRecord(c);
        setForm({
          commissionNumber: c.commissionNumber || "",
          contactId: c.contactId || "",
          contactName: c.contactName || "",
          customerName: c.customerName || "",
          dealName: c.dealName || "",
          repName: c.repName || "",
          source: c.source || "",
          rate: c.rate != null ? String(c.rate) : "",
          amount: c.amount != null ? String(c.amount) : "",
          status: c.status || "Pending",
          earnedDate: toDateInput(c.earnedDate),
          paidDate: toDateInput(c.paidDate),
          notes: c.notes || "",
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

  const handleContactChange = (contact) =>
    setForm((f) => ({
      ...f,
      contactId: contact ? contact.id : "",
      contactName: contact ? contact.name || "" : "",
      customerName: f.customerName || (contact ? contact.name || "" : ""),
    }));

  function buildPayload() {
    const payload = {
      commissionNumber: form.commissionNumber.trim(),
      contactId: form.contactId || null,
      customerName: form.customerName.trim(),
      dealName: form.dealName.trim(),
      repName: form.repName.trim(),
      source: form.source.trim(),
      status: form.status,
      earnedDate: form.earnedDate || null,
      paidDate: form.paidDate || null,
      notes: form.notes.trim(),
    };
    payload.rate =
      form.rate !== "" && !isNaN(Number(form.rate)) ? Number(form.rate) : null;
    payload.amount =
      form.amount !== "" && !isNaN(Number(form.amount)) ? Number(form.amount) : null;
    return payload;
  }

  const requestClose = () => {
    if (saving) return;
    onClose?.();
  };

  async function handleSave() {
    if (!form.repName.trim() && !form.customerName.trim() && !form.contactId) {
      setError("A rep, customer, or linked contact is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload();
      if (mode === "create") await salesApi.createCommission(payload);
      else await salesApi.updateCommission(recordId, payload);
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
      await salesApi.deleteCommission(recordId);
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
  const subtitle = mode === "view" ? record?.repName || record?.customerName || "" : "Commission details";

  const footer = loading ? null : isForm ? (
    <>
      <button type="button" className="iw-btn" onClick={requestClose} disabled={saving}>
        Cancel
      </button>
      <button type="button" className="iw-btn primary" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : mode === "create" ? "Create commission" : "Save changes"}
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
              <SalesContactPicker
                value={form.contactId ? { id: form.contactId, name: form.contactName } : null}
                onChange={handleContactChange}
              />
            </div>
            <div className="iw-field">
              <label>Sales rep</label>
              <input value={form.repName} onChange={setField("repName")} placeholder="Rep name" />
            </div>
            <div className="iw-field">
              <label>Customer</label>
              <input value={form.customerName} onChange={setField("customerName")} placeholder="Company or person name" />
            </div>
            <div className="iw-field">
              <label>Deal</label>
              <input value={form.dealName} onChange={setField("dealName")} placeholder="Related deal" />
            </div>
            <div className="iw-field">
              <label>Source</label>
              <input value={form.source} onChange={setField("source")} placeholder="e.g. Order / Invoice" />
            </div>
            <div className="iw-field">
              <label>Commission number</label>
              <input value={form.commissionNumber} onChange={setField("commissionNumber")} placeholder="Auto-generated if blank" />
            </div>
            <div className="iw-field">
              <label>Status</label>
              <select value={form.status} onChange={setField("status")}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="iw-field">
              <label>Rate (%)</label>
              <input type="number" step="0.001" value={form.rate} onChange={setField("rate")} placeholder="e.g. 10" />
            </div>
            <div className="iw-field">
              <label>Amount</label>
              <input type="number" step="0.01" value={form.amount} onChange={setField("amount")} placeholder="0.00" />
            </div>
            <div className="iw-field">
              <label>Earned date</label>
              <input type="date" value={form.earnedDate} onChange={setField("earnedDate")} />
            </div>
            <div className="iw-field">
              <label>Paid date</label>
              <input type="date" value={form.paidDate} onChange={setField("paidDate")} />
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
            <div><dt>Sales rep</dt><dd>{record?.repName || "-"}</dd></div>
            <div><dt>Customer</dt><dd>{record?.customerName || "-"}</dd></div>
            <div><dt>Order</dt><dd>{record?.orderNumber || "-"}</dd></div>
            <div><dt>Invoice</dt><dd>{record?.invoiceNumber || "-"}</dd></div>
            <div><dt>Rate</dt><dd>{record?.rate != null ? `${record.rate}%` : "-"}</dd></div>
            <div><dt>Amount</dt><dd>{record?.amount != null ? money(record.amount) : "-"}</dd></div>
            <div><dt>Earned date</dt><dd>{formatDate(record?.earnedDate)}</dd></div>
            <div><dt>Paid date</dt><dd>{formatDate(record?.paidDate)}</dd></div>
            <div className="full"><dt>Notes</dt><dd>{record?.notes || "-"}</dd></div>
          </dl>
        </>
      )}
    </InsuranceWorkModal>
  );
}
