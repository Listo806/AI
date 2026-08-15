import React, { useEffect, useState } from "react";
import InsuranceWorkModal from "../insurance/InsuranceWorkModal";
import SalesContactPicker from "./SalesContactPicker";
import salesApi from "../../api/salesApi";
import { money, formatDate, toDateInput } from "./salesFormat";

const STATUS_OPTIONS = ["Draft", "Active", "Completed", "Expired", "Cancelled"];

const EMPTY_FORM = {
  contractNumber: "",
  contactId: "",
  contactName: "",
  customerName: "",
  segment: "",
  contactRole: "",
  dealName: "",
  value: "",
  status: "Draft",
  startDate: "",
  endDate: "",
  ownerName: "",
  notes: "",
};

export default function ContractModal({ open, mode: initialMode, recordId, onClose, onSaved }) {
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
      .getContract(recordId)
      .then((c) => {
        if (cancelled) return;
        setRecord(c);
        setForm({
          contractNumber: c.contractNumber || "",
          contactId: c.contactId || "",
          contactName: c.contactName || "",
          customerName: c.customerName || "",
          segment: c.segment || "",
          contactRole: c.contactRole || "",
          dealName: c.dealName || "",
          value: c.value != null ? String(c.value) : "",
          status: c.status || "Draft",
          startDate: toDateInput(c.startDate),
          endDate: toDateInput(c.endDate),
          ownerName: c.ownerName || "",
          notes: c.notes || "",
        });
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Failed to load contract");
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
      contractNumber: form.contractNumber.trim(),
      contactId: form.contactId || null,
      customerName: form.customerName.trim(),
      segment: form.segment.trim(),
      contactName: form.contactName.trim(),
      contactRole: form.contactRole.trim(),
      dealName: form.dealName.trim(),
      status: form.status,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
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
      if (mode === "create") await salesApi.createContract(payload);
      else await salesApi.updateContract(recordId, payload);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to save contract");
    }
  }

  async function handleDelete() {
    if (!recordId) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm("Delete this contract? This cannot be undone.")) return;
    setSaving(true);
    setError(null);
    try {
      await salesApi.deleteContract(recordId);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to delete contract");
    }
  }

  const isForm = mode === "create" || mode === "edit";
  const title =
    mode === "create" ? "New Contract" : mode === "edit" ? "Edit Contract" : record?.contractNumber || "Contract";
  const subtitle = mode === "view" ? record?.customerName || "" : "Contract details";

  const footer = loading ? null : isForm ? (
    <>
      <button type="button" className="iw-btn" onClick={requestClose} disabled={saving}>
        Cancel
      </button>
      <button type="button" className="iw-btn primary" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : mode === "create" ? "Create contract" : "Save changes"}
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
              <label>Contract number</label>
              <input value={form.contractNumber} onChange={setField("contractNumber")} placeholder="Auto-generated if blank" />
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
              <label>Start date</label>
              <input type="date" value={form.startDate} onChange={setField("startDate")} />
            </div>
            <div className="iw-field">
              <label>End date</label>
              <input type="date" value={form.endDate} onChange={setField("endDate")} />
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
            <div><dt>Contract number</dt><dd>{record?.contractNumber || "-"}</dd></div>
            <div><dt>Status</dt><dd>{record?.status || "-"}</dd></div>
            <div><dt>Customer</dt><dd>{record?.customerName || "-"}</dd></div>
            <div><dt>Contact</dt><dd>{record?.contactName || "-"}</dd></div>
            <div><dt>Deal</dt><dd>{record?.dealName || "-"}</dd></div>
            <div><dt>Value</dt><dd>{record?.value != null ? money(record.value) : "-"}</dd></div>
            <div><dt>Start date</dt><dd>{formatDate(record?.startDate)}</dd></div>
            <div><dt>End date</dt><dd>{formatDate(record?.endDate)}</dd></div>
            <div><dt>Owner</dt><dd>{record?.ownerName || "-"}</dd></div>
            <div className="full"><dt>Notes</dt><dd>{record?.notes || "-"}</dd></div>
          </dl>
        </>
      )}
    </InsuranceWorkModal>
  );
}
