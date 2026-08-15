import React, { useEffect, useState } from "react";
import InsuranceWorkModal from "../insurance/InsuranceWorkModal";
import SalesContactPicker from "./SalesContactPicker";
import salesApi from "../../api/salesApi";
import { money, formatDate, toDateInput } from "./salesFormat";

const STATUS_OPTIONS = [
  "Requested",
  "Approved",
  "Processing",
  "Completed",
  "Rejected",
  "Cancelled",
];

const EMPTY_FORM = {
  returnNumber: "",
  contactId: "",
  contactName: "",
  customerName: "",
  segment: "",
  contactRole: "",
  reason: "",
  value: "",
  status: "Requested",
  completedDate: "",
  ownerName: "",
  notes: "",
};

export default function ReturnModal({ open, mode: initialMode, recordId, onClose, onSaved }) {
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
      .getReturn(recordId)
      .then((r) => {
        if (cancelled) return;
        setRecord(r);
        setForm({
          returnNumber: r.returnNumber || "",
          contactId: r.contactId || "",
          contactName: r.contactName || "",
          customerName: r.customerName || "",
          segment: r.segment || "",
          contactRole: r.contactRole || "",
          reason: r.reason || "",
          value: r.value != null ? String(r.value) : "",
          status: r.status || "Requested",
          completedDate: toDateInput(r.completedDate),
          ownerName: r.ownerName || "",
          notes: r.notes || "",
        });
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Failed to load return");
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
      returnNumber: form.returnNumber.trim(),
      contactId: form.contactId || null,
      customerName: form.customerName.trim(),
      segment: form.segment.trim(),
      contactName: form.contactName.trim(),
      contactRole: form.contactRole.trim(),
      reason: form.reason.trim(),
      status: form.status,
      completedDate: form.completedDate || null,
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
      if (mode === "create") await salesApi.createReturn(payload);
      else await salesApi.updateReturn(recordId, payload);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to save return");
    }
  }

  async function handleDelete() {
    if (!recordId) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm("Delete this return? This cannot be undone.")) return;
    setSaving(true);
    setError(null);
    try {
      await salesApi.deleteReturn(recordId);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to delete return");
    }
  }

  const isForm = mode === "create" || mode === "edit";
  const title =
    mode === "create" ? "New Return" : mode === "edit" ? "Edit Return" : record?.returnNumber || "Return";
  const subtitle = mode === "view" ? record?.customerName || "" : "Return details";

  const footer = loading ? null : isForm ? (
    <>
      <button type="button" className="iw-btn" onClick={requestClose} disabled={saving}>
        Cancel
      </button>
      <button type="button" className="iw-btn primary" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : mode === "create" ? "Create return" : "Save changes"}
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
              <label>Customer</label>
              <input value={form.customerName} onChange={setField("customerName")} placeholder="Company or person name" />
            </div>
            <div className="iw-field">
              <label>Segment</label>
              <input value={form.segment} onChange={setField("segment")} placeholder="e.g. Enterprise / SMB" />
            </div>
            <div className="iw-field">
              <label>Contact person</label>
              <input value={form.contactName} onChange={setField("contactName")} placeholder="Contact name" />
            </div>
            <div className="iw-field">
              <label>Contact role</label>
              <input value={form.contactRole} onChange={setField("contactRole")} placeholder="e.g. CTO" />
            </div>
            <div className="iw-field">
              <label>Return number</label>
              <input value={form.returnNumber} onChange={setField("returnNumber")} placeholder="Auto-generated if blank" />
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
              <input type="number" step="0.01" value={form.value} onChange={setField("value")} placeholder="0.00" />
            </div>
            <div className="iw-field">
              <label>Completed date</label>
              <input type="date" value={form.completedDate} onChange={setField("completedDate")} />
            </div>
            <div className="iw-field">
              <label>Owner</label>
              <input value={form.ownerName} onChange={setField("ownerName")} placeholder="Sales rep" />
            </div>
            <div className="iw-field full">
              <label>Reason</label>
              <input value={form.reason} onChange={setField("reason")} placeholder="Reason for return" />
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
            <div><dt>Return number</dt><dd>{record?.returnNumber || "-"}</dd></div>
            <div><dt>Original order</dt><dd>{record?.orderNumber || "-"}</dd></div>
            <div><dt>Status</dt><dd>{record?.status || "-"}</dd></div>
            <div><dt>Customer</dt><dd>{record?.customerName || "-"}</dd></div>
            <div><dt>Contact</dt><dd>{record?.contactName || "-"}</dd></div>
            <div><dt>Amount</dt><dd>{record?.value != null ? money(record.value) : "-"}</dd></div>
            <div><dt>Completed date</dt><dd>{formatDate(record?.completedDate)}</dd></div>
            <div><dt>Owner</dt><dd>{record?.ownerName || "-"}</dd></div>
            <div className="full"><dt>Reason</dt><dd>{record?.reason || "-"}</dd></div>
            <div className="full"><dt>Notes</dt><dd>{record?.notes || "-"}</dd></div>
          </dl>
        </>
      )}
    </InsuranceWorkModal>
  );
}
