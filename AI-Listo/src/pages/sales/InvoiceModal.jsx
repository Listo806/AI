import React, { useEffect, useState } from "react";
import InsuranceWorkModal from "../insurance/InsuranceWorkModal";
import SalesContactPicker from "./SalesContactPicker";
import salesApi from "../../api/salesApi";
import { money, formatDate, toDateInput } from "./salesFormat";

const STATUS_OPTIONS = ["Draft", "Open", "Paid", "Overdue", "Cancelled", "Refunded"];

const EMPTY_FORM = {
  invoiceNumber: "",
  contactId: "",
  contactName: "",
  customerName: "",
  segment: "",
  contactRole: "",
  dealName: "",
  amount: "",
  status: "Open",
  dueDate: "",
  paidDate: "",
  paymentReference: "",
  ownerName: "",
  notes: "",
};

export default function InvoiceModal({ open, mode: initialMode, recordId, onClose, onSaved }) {
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
      .getInvoice(recordId)
      .then((v) => {
        if (cancelled) return;
        setRecord(v);
        setForm({
          invoiceNumber: v.invoiceNumber || "",
          contactId: v.contactId || "",
          contactName: v.contactName || "",
          customerName: v.customerName || "",
          segment: v.segment || "",
          contactRole: v.contactRole || "",
          dealName: v.dealName || "",
          amount: v.amount != null ? String(v.amount) : "",
          status: v.status || "Open",
          dueDate: toDateInput(v.dueDate),
          paidDate: toDateInput(v.paidDate),
          paymentReference: v.paymentReference || "",
          ownerName: v.ownerName || "",
          notes: v.notes || "",
        });
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Failed to load invoice");
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
      invoiceNumber: form.invoiceNumber.trim(),
      contactId: form.contactId || null,
      customerName: form.customerName.trim(),
      segment: form.segment.trim(),
      contactName: form.contactName.trim(),
      contactRole: form.contactRole.trim(),
      dealName: form.dealName.trim(),
      status: form.status,
      dueDate: form.dueDate || null,
      paidDate: form.paidDate || null,
      paymentReference: form.paymentReference.trim(),
      ownerName: form.ownerName.trim(),
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
    if (!form.customerName.trim() && !form.contactId) {
      setError("A customer name or a linked contact is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload();
      if (mode === "create") await salesApi.createInvoice(payload);
      else await salesApi.updateInvoice(recordId, payload);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to save invoice");
    }
  }

  async function handleDelete() {
    if (!recordId) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm("Delete this invoice? This cannot be undone.")) return;
    setSaving(true);
    setError(null);
    try {
      await salesApi.deleteInvoice(recordId);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to delete invoice");
    }
  }

  const isForm = mode === "create" || mode === "edit";
  const title =
    mode === "create" ? "New Invoice" : mode === "edit" ? "Edit Invoice" : record?.invoiceNumber || "Invoice";
  const subtitle = mode === "view" ? record?.customerName || "" : "Invoice details";
  const paddleSourced = !!(record?.paymentReference && String(record.paymentReference).trim());

  const footer = loading ? null : isForm ? (
    <>
      <button type="button" className="iw-btn" onClick={requestClose} disabled={saving}>
        Cancel
      </button>
      <button type="button" className="iw-btn primary" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : mode === "create" ? "Create invoice" : "Save changes"}
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
          {paddleSourced && (
            <p className="iw-hint">
              This invoice is linked to a Paddle payment. Paddle is the source of truth for its paid status.
            </p>
          )}
          <div className="iw-form">
            <div className="iw-field full">
              <label>Contact (existing customer)</label>
              <SalesContactPicker
                value={form.contactId ? { id: form.contactId, name: form.contactName } : null}
                onChange={handleContactChange}
              />
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
              <label>Invoice number</label>
              <input value={form.invoiceNumber} onChange={setField("invoiceNumber")} placeholder="Auto-generated if blank" />
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
              <label>Amount</label>
              <input type="number" step="0.01" value={form.amount} onChange={setField("amount")} placeholder="0.00" />
            </div>
            <div className="iw-field">
              <label>Due date</label>
              <input type="date" value={form.dueDate} onChange={setField("dueDate")} />
            </div>
            <div className="iw-field">
              <label>Paid date</label>
              <input type="date" value={form.paidDate} onChange={setField("paidDate")} />
            </div>
            <div className="iw-field">
              <label>Payment reference</label>
              <input value={form.paymentReference} onChange={setField("paymentReference")} placeholder="Paddle transaction id, if any" />
            </div>
            <div className="iw-field">
              <label>Owner</label>
              <input value={form.ownerName} onChange={setField("ownerName")} placeholder="Sales rep" />
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
            <div><dt>Invoice number</dt><dd>{record?.invoiceNumber || "-"}</dd></div>
            <div><dt>Status</dt><dd>{record?.status || "-"}</dd></div>
            <div><dt>Customer</dt><dd>{record?.customerName || "-"}</dd></div>
            <div><dt>Order</dt><dd>{record?.orderNumber || "-"}</dd></div>
            <div><dt>Amount</dt><dd>{record?.amount != null ? money(record.amount) : "-"}</dd></div>
            <div><dt>Due date</dt><dd>{formatDate(record?.dueDate)}</dd></div>
            <div><dt>Paid date</dt><dd>{formatDate(record?.paidDate)}</dd></div>
            <div><dt>Payment reference</dt><dd>{record?.paymentReference || "-"}</dd></div>
            <div><dt>Owner</dt><dd>{record?.ownerName || "-"}</dd></div>
            <div className="full"><dt>Notes</dt><dd>{record?.notes || "-"}</dd></div>
          </dl>
        </>
      )}
    </InsuranceWorkModal>
  );
}
