import React, { useEffect, useState } from "react";
import InsuranceWorkModal from "../insurance/InsuranceWorkModal";
import FinancialClientPicker from "./FinancialClientPicker";
import financialApi from "../../api/financialApi";
import { formatDate, toDateInput } from "../sales/salesFormat";

const STATUS_OPTIONS = [
  "Draft",
  "In Progress",
  "Under Review",
  "Pending Documents",
  "Approved",
  "Declined",
  "Cancelled",
];

const EMPTY_FORM = {
  applicationNumber: "",
  clientId: "",
  clientName: "",
  applicationType: "",
  advisorName: "",
  status: "Draft",
  submittedDate: "",
  notes: "",
};

export default function ApplicationModal({ open, mode: initialMode, recordId, onClose, onSaved }) {
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
      .getApplication(recordId)
      .then((a) => {
        if (cancelled) return;
        setRecord(a);
        setForm({
          applicationNumber: a.applicationNumber || "",
          clientId: a.clientId || "",
          clientName: a.clientName || "",
          applicationType: a.applicationType || "",
          advisorName: a.advisorName || "",
          status: a.status || "Draft",
          submittedDate: toDateInput(a.submittedDate),
          notes: a.notes || "",
        });
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Failed to load application");
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
    return {
      applicationNumber: form.applicationNumber.trim(),
      clientId: form.clientId || null,
      clientName: form.clientName.trim(),
      applicationType: form.applicationType.trim(),
      advisorName: form.advisorName.trim(),
      status: form.status,
      submittedDate: form.submittedDate || null,
      notes: form.notes.trim(),
    };
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
      if (mode === "create") await financialApi.createApplication(payload);
      else await financialApi.updateApplication(recordId, payload);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to save application");
    }
  }

  async function handleDelete() {
    if (!recordId) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm("Delete this application? This cannot be undone.")) return;
    setSaving(true);
    setError(null);
    try {
      await financialApi.deleteApplication(recordId);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to delete application");
    }
  }

  const isForm = mode === "create" || mode === "edit";
  const title =
    mode === "create" ? "New Application" : mode === "edit" ? "Edit Application" : record?.applicationNumber || "Application";
  const subtitle = mode === "view" ? record?.clientName || "" : "Application details";

  const footer = loading ? null : isForm ? (
    <>
      <button type="button" className="iw-btn" onClick={requestClose} disabled={saving}>Cancel</button>
      <button type="button" className="iw-btn primary" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : mode === "create" ? "Create application" : "Save changes"}
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
          <div className="iw-form">
            <div className="iw-field full">
              <label>Client</label>
              <FinancialClientPicker
                value={form.clientId ? { id: form.clientId, name: form.clientName } : null}
                onChange={handleClientChange}
              />
            </div>
            <div className="iw-field">
              <label>Application type</label>
              <input value={form.applicationType} onChange={setField("applicationType")} placeholder="e.g. New Account / Onboarding" />
            </div>
            <div className="iw-field">
              <label>Advisor</label>
              <input value={form.advisorName} onChange={setField("advisorName")} placeholder="Advisor name" />
            </div>
            <div className="iw-field">
              <label>Application number</label>
              <input value={form.applicationNumber} onChange={setField("applicationNumber")} placeholder="Auto-generated if blank" />
            </div>
            <div className="iw-field">
              <label>Status</label>
              <select value={form.status} onChange={setField("status")}>
                {STATUS_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div className="iw-field">
              <label>Submitted date</label>
              <input type="date" value={form.submittedDate} onChange={setField("submittedDate")} />
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
            <div><dt>Application number</dt><dd>{record?.applicationNumber || "-"}</dd></div>
            <div><dt>Status</dt><dd>{record?.status || "-"}</dd></div>
            <div><dt>Client</dt><dd>{record?.clientName || "-"}</dd></div>
            <div><dt>Application type</dt><dd>{record?.applicationType || "-"}</dd></div>
            <div><dt>Advisor</dt><dd>{record?.advisorName || "-"}</dd></div>
            <div><dt>Submitted date</dt><dd>{formatDate(record?.submittedDate)}</dd></div>
            <div className="full"><dt>Notes</dt><dd>{record?.notes || "-"}</dd></div>
          </dl>
        </>
      )}
    </InsuranceWorkModal>
  );
}
