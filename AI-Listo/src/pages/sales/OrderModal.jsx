import React, { useEffect, useState } from "react";
import InsuranceWorkModal from "../insurance/InsuranceWorkModal";
import SalesContactPicker from "./SalesContactPicker";
import salesApi from "../../api/salesApi";
import { money } from "./salesFormat";

const STATUS_OPTIONS = [
  "Pending",
  "Confirmed",
  "Processing",
  "Completed",
  "Cancelled",
  "Refunded",
];

const EMPTY_FORM = {
  orderNumber: "",
  contactId: "",
  contactName: "",
  customerName: "",
  segment: "",
  contactRole: "",
  dealName: "",
  value: "",
  status: "Pending",
  ownerName: "",
  notes: "",
};

export default function OrderModal({ open, mode: initialMode, recordId, onClose, onSaved }) {
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
      .getOrder(recordId)
      .then((o) => {
        if (cancelled) return;
        setRecord(o);
        setForm({
          orderNumber: o.orderNumber || "",
          contactId: o.contactId || "",
          contactName: o.contactName || "",
          customerName: o.customerName || "",
          segment: o.segment || "",
          contactRole: o.contactRole || "",
          dealName: o.dealName || "",
          value: o.value != null ? String(o.value) : "",
          status: o.status || "Pending",
          ownerName: o.ownerName || "",
          notes: o.notes || "",
        });
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Failed to load order");
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
      orderNumber: form.orderNumber.trim(),
      contactId: form.contactId || null,
      customerName: form.customerName.trim(),
      segment: form.segment.trim(),
      contactName: form.contactName.trim(),
      contactRole: form.contactRole.trim(),
      dealName: form.dealName.trim(),
      status: form.status,
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
      if (mode === "create") await salesApi.createOrder(payload);
      else await salesApi.updateOrder(recordId, payload);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to save order");
    }
  }

  async function handleDelete() {
    if (!recordId) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm("Delete this order? This cannot be undone.")) return;
    setSaving(true);
    setError(null);
    try {
      await salesApi.deleteOrder(recordId);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to delete order");
    }
  }

  const isForm = mode === "create" || mode === "edit";
  const title =
    mode === "create" ? "New Order" : mode === "edit" ? "Edit Order" : record?.orderNumber || "Order";
  const subtitle = mode === "view" ? record?.customerName || "" : "Order details";

  const footer = loading ? null : isForm ? (
    <>
      <button type="button" className="iw-btn" onClick={requestClose} disabled={saving}>
        Cancel
      </button>
      <button type="button" className="iw-btn primary" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : mode === "create" ? "Create order" : "Save changes"}
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
              <label>Deal</label>
              <input value={form.dealName} onChange={setField("dealName")} placeholder="Related deal" />
            </div>
            <div className="iw-field">
              <label>Order number</label>
              <input value={form.orderNumber} onChange={setField("orderNumber")} placeholder="Auto-generated if blank" />
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
              <input type="number" step="0.01" value={form.value} onChange={setField("value")} placeholder="0.00" />
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
            <div>
              <dt>Order number</dt>
              <dd>{record?.orderNumber || "-"}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{record?.status || "-"}</dd>
            </div>
            <div>
              <dt>Customer</dt>
              <dd>{record?.customerName || "-"}</dd>
            </div>
            <div>
              <dt>Contact</dt>
              <dd>{record?.contactName || "-"}</dd>
            </div>
            <div>
              <dt>Deal</dt>
              <dd>{record?.dealName || "-"}</dd>
            </div>
            <div>
              <dt>Value</dt>
              <dd>{record?.value != null ? money(record.value) : "-"}</dd>
            </div>
            <div>
              <dt>Owner</dt>
              <dd>{record?.ownerName || "-"}</dd>
            </div>
            <div className="full">
              <dt>Notes</dt>
              <dd>{record?.notes || "-"}</dd>
            </div>
          </dl>
        </>
      )}
    </InsuranceWorkModal>
  );
}
