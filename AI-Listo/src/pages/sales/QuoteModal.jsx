import React, { useEffect, useState } from "react";
import InsuranceWorkModal from "../insurance/InsuranceWorkModal";
import SalesContactPicker from "./SalesContactPicker";
import salesApi from "../../api/salesApi";

const STATUS_OPTIONS = [
  "Draft",
  "Sent",
  "Viewed",
  "Accepted",
  "Rejected",
  "Expired",
];

const EMPTY_FORM = {
  quoteNumber: "",
  contactId: "",
  contactName: "",
  customerName: "",
  segment: "",
  contactRole: "",
  dealName: "",
  stage: "",
  value: "",
  status: "Draft",
  validUntil: "",
  ownerName: "",
  notes: "",
};

function toDateInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatMoney(value) {
  const n = Number(value);
  if (!isFinite(n)) return "-";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

// Quote create / view / edit inside the shared work modal.
// mode: "create" | "view" | "edit". onSaved() tells the workspace to refresh.
export default function QuoteModal({ open, mode: initialMode, quoteId, onClose, onSaved }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState(EMPTY_FORM);
  const [quote, setQuote] = useState(null);
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
      setQuote(null);
      return undefined;
    }
    if (!quoteId) return undefined;
    let cancelled = false;
    setLoading(true);
    salesApi
      .getQuote(quoteId)
      .then((q) => {
        if (cancelled) return;
        setQuote(q);
        setForm({
          quoteNumber: q.quoteNumber || "",
          contactId: q.contactId || "",
          contactName: q.contactName || "",
          customerName: q.customerName || "",
          segment: q.segment || "",
          contactRole: q.contactRole || "",
          dealName: q.dealName || "",
          stage: q.stage || "",
          value: q.value != null ? String(q.value) : "",
          status: q.status || "Draft",
          validUntil: toDateInput(q.validUntil),
          ownerName: q.ownerName || "",
          notes: q.notes || "",
        });
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Failed to load quote");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, quoteId, initialMode]);

  const setField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleContactChange = (contact) =>
    setForm((f) => ({
      ...f,
      contactId: contact ? contact.id : "",
      contactName: contact ? contact.name || "" : "",
      // Fill the customer from the contact if still blank.
      customerName: f.customerName || (contact ? contact.name || "" : ""),
    }));

  function buildPayload() {
    const payload = {
      quoteNumber: form.quoteNumber.trim(),
      contactId: form.contactId || null,
      customerName: form.customerName.trim(),
      segment: form.segment.trim(),
      contactName: form.contactName.trim(),
      contactRole: form.contactRole.trim(),
      dealName: form.dealName.trim(),
      stage: form.stage.trim(),
      status: form.status,
      validUntil: form.validUntil || null,
      ownerName: form.ownerName.trim(),
      notes: form.notes.trim(),
    };
    payload.value =
      form.value !== "" && !isNaN(Number(form.value)) ? Number(form.value) : null;
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
      if (mode === "create") {
        await salesApi.createQuote(payload);
      } else {
        await salesApi.updateQuote(quoteId, payload);
      }
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to save quote");
    }
  }

  async function handleDelete() {
    if (!quoteId) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm("Delete this quote? This cannot be undone.")) return;
    setSaving(true);
    setError(null);
    try {
      await salesApi.deleteQuote(quoteId);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to delete quote");
    }
  }

  const isForm = mode === "create" || mode === "edit";
  const title =
    mode === "create"
      ? "New Quote"
      : mode === "edit"
        ? "Edit Quote"
        : quote?.quoteNumber || "Quote";
  const subtitle = mode === "view" ? quote?.customerName || "" : "Quote details";

  const footer = loading ? null : isForm ? (
    <>
      <button type="button" className="iw-btn" onClick={requestClose} disabled={saving}>
        Cancel
      </button>
      <button
        type="button"
        className="iw-btn primary"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving..." : mode === "create" ? "Create quote" : "Save changes"}
      </button>
    </>
  ) : (
    <>
      <button
        type="button"
        className="iw-btn danger iw-btn-spacer"
        onClick={handleDelete}
        disabled={saving}
      >
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
    <InsuranceWorkModal
      open={open}
      title={title}
      subtitle={subtitle}
      onClose={requestClose}
      footer={footer}
    >
      {loading ? (
        <div className="iw-loading">Loading...</div>
      ) : isForm ? (
        <>
          {error && <p className="iw-error">{error}</p>}
          <div className="iw-form">
            <div className="iw-field full">
              <label>Contact (existing customer)</label>
              <SalesContactPicker
                value={
                  form.contactId
                    ? { id: form.contactId, name: form.contactName }
                    : null
                }
                onChange={handleContactChange}
              />
            </div>
            <div className="iw-field">
              <label>Customer</label>
              <input
                value={form.customerName}
                onChange={setField("customerName")}
                placeholder="Company or person name"
              />
            </div>
            <div className="iw-field">
              <label>Segment</label>
              <input
                value={form.segment}
                onChange={setField("segment")}
                placeholder="e.g. Enterprise / SMB"
              />
            </div>
            <div className="iw-field">
              <label>Contact person</label>
              <input
                value={form.contactName}
                onChange={setField("contactName")}
                placeholder="Contact name"
              />
            </div>
            <div className="iw-field">
              <label>Contact role</label>
              <input
                value={form.contactRole}
                onChange={setField("contactRole")}
                placeholder="e.g. CTO"
              />
            </div>
            <div className="iw-field">
              <label>Deal</label>
              <input
                value={form.dealName}
                onChange={setField("dealName")}
                placeholder="Related deal / opportunity"
              />
            </div>
            <div className="iw-field">
              <label>Pipeline stage</label>
              <input
                value={form.stage}
                onChange={setField("stage")}
                placeholder="e.g. Proposal Sent"
              />
            </div>
            <div className="iw-field">
              <label>Quote number</label>
              <input
                value={form.quoteNumber}
                onChange={setField("quoteNumber")}
                placeholder="Auto-generated if blank"
              />
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
              <label>Value</label>
              <input
                type="number"
                step="0.01"
                value={form.value}
                onChange={setField("value")}
                placeholder="0.00"
              />
            </div>
            <div className="iw-field">
              <label>Valid until</label>
              <input
                type="date"
                value={form.validUntil}
                onChange={setField("validUntil")}
              />
            </div>
            <div className="iw-field">
              <label>Owner</label>
              <input
                value={form.ownerName}
                onChange={setField("ownerName")}
                placeholder="Sales rep"
              />
            </div>
            <div className="iw-field full">
              <label>Notes</label>
              <textarea
                value={form.notes}
                onChange={setField("notes")}
                placeholder="Internal notes"
              />
            </div>
          </div>
        </>
      ) : (
        <>
          {error && <p className="iw-error">{error}</p>}
          <dl className="iw-detail">
            <div>
              <dt>Quote number</dt>
              <dd>{quote?.quoteNumber || "-"}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{quote?.status || "-"}</dd>
            </div>
            <div>
              <dt>Customer</dt>
              <dd>{quote?.customerName || "-"}</dd>
            </div>
            <div>
              <dt>Segment</dt>
              <dd>{quote?.segment || "-"}</dd>
            </div>
            <div>
              <dt>Contact</dt>
              <dd>{quote?.contactName || "-"}</dd>
            </div>
            <div>
              <dt>Contact role</dt>
              <dd>{quote?.contactRole || "-"}</dd>
            </div>
            <div>
              <dt>Deal</dt>
              <dd>{quote?.dealName || "-"}</dd>
            </div>
            <div>
              <dt>Pipeline stage</dt>
              <dd>{quote?.stage || "-"}</dd>
            </div>
            <div>
              <dt>Value</dt>
              <dd>{quote?.value != null ? formatMoney(quote.value) : "-"}</dd>
            </div>
            <div>
              <dt>Valid until</dt>
              <dd>{formatDate(quote?.validUntil)}</dd>
            </div>
            <div>
              <dt>Owner</dt>
              <dd>{quote?.ownerName || "-"}</dd>
            </div>
            <div className="full">
              <dt>Notes</dt>
              <dd>{quote?.notes || "-"}</dd>
            </div>
          </dl>
        </>
      )}
    </InsuranceWorkModal>
  );
}
