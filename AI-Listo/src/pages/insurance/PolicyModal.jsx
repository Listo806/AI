import React, { useEffect, useState } from "react";
import InsuranceWorkModal from "./InsuranceWorkModal";
import ContactPicker from "./ContactPicker";
import insuranceApi from "../../api/insuranceApi";

const STATUS_OPTIONS = [
  "Pending",
  "Active",
  "Expiring",
  "Renewed",
  "Cancelled",
  "Lapsed",
  "Expired",
];
const BILLING_OPTIONS = ["Annual", "Semi-Annual", "Quarterly", "Monthly"];

const EMPTY_FORM = {
  policyNumber: "",
  holderName: "",
  contactId: "",
  contactName: "",
  policyType: "",
  premium: "",
  status: "Pending",
  billingFrequency: "Annual",
  coverageStart: "",
  coverageEnd: "",
  nextBilling: "",
  notes: "",
};

// <input type="date"> needs YYYY-MM-DD; the API may return a full timestamp.
// Use local date parts (not toISOString, which shifts to UTC and can render a
// date one day early in positive-UTC timezones).
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

// Policy create / view / edit, rendered inside the shared InsuranceWorkModal.
// mode: "create" | "view" | "edit". onSaved() tells the workspace to refresh.
export default function PolicyModal({
  open,
  mode: initialMode,
  policyId,
  onClose,
  onSaved,
}) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState(EMPTY_FORM);
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Reset to the requested mode whenever the modal (re)opens.
  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  // Load the policy for view/edit; reset the form for create.
  useEffect(() => {
    if (!open) return undefined;
    setError(null);

    if (initialMode === "create") {
      setForm(EMPTY_FORM);
      setPolicy(null);
      return undefined;
    }
    if (!policyId) return undefined;

    let cancelled = false;
    setLoading(true);
    insuranceApi
      .getPolicy(policyId)
      .then((p) => {
        if (cancelled) return;
        setPolicy(p);
        setForm({
          policyNumber: p.policyNumber || "",
          holderName: p.holderName || "",
          contactId: p.contactId || "",
          contactName: p.contactName || "",
          policyType: p.policyType || "",
          premium: p.premium != null ? String(p.premium) : "",
          status: p.status || "Pending",
          billingFrequency: p.billingFrequency || "Annual",
          coverageStart: toDateInput(p.coverageStart),
          coverageEnd: toDateInput(p.coverageEnd),
          nextBilling: toDateInput(p.nextBilling),
          notes: p.notes || "",
        });
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Failed to load policy");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, policyId, initialMode]);

  const setField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleContactChange = (contact) =>
    setForm((f) => ({
      ...f,
      contactId: contact ? contact.id : "",
      contactName: contact ? contact.name || "" : "",
      // Convenience: fill the policyholder from the contact if it is still blank.
      holderName: f.holderName || (contact ? contact.name || "" : ""),
    }));

  function buildPayload() {
    // Send null (not "") for blank optional fields so clearing a value on edit
    // actually writes NULL. The backend skips only `undefined`, and '' on a date
    // field is transformed to undefined server-side (which would silently no-op).
    const payload = {
      policyNumber: form.policyNumber.trim(),
      holderName: form.holderName.trim(),
      contactId: form.contactId || null,
      policyType: form.policyType.trim(),
      status: form.status,
      billingFrequency: form.billingFrequency,
      coverageStart: form.coverageStart || null,
      coverageEnd: form.coverageEnd || null,
      nextBilling: form.nextBilling || null,
      notes: form.notes.trim(),
    };
    payload.premium =
      form.premium !== "" && !isNaN(Number(form.premium))
        ? Number(form.premium)
        : null;
    return payload;
  }

  // Don't allow Escape / overlay / Close to dismiss while a save or delete is in
  // flight.
  const requestClose = () => {
    if (saving) return;
    onClose?.();
  };

  async function handleSave() {
    if (!form.holderName.trim()) {
      setError("Policyholder name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload();
      if (mode === "create") {
        await insuranceApi.createPolicy(payload);
      } else {
        await insuranceApi.updatePolicy(policyId, payload);
      }
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to save policy");
    }
  }

  async function handleDelete() {
    if (!policyId) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm("Delete this policy? This cannot be undone.")) return;
    setSaving(true);
    setError(null);
    try {
      await insuranceApi.deletePolicy(policyId);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to delete policy");
    }
  }

  const isForm = mode === "create" || mode === "edit";
  const title =
    mode === "create"
      ? "New Policy"
      : mode === "edit"
        ? "Edit Policy"
        : policy?.policyNumber || "Policy";
  const subtitle =
    mode === "view" ? policy?.holderName || "" : "Policy details";

  const footer = loading ? null : isForm ? (
    <>
      <button
        type="button"
        className="iw-btn"
        onClick={requestClose}
        disabled={saving}
      >
        Cancel
      </button>
      <button
        type="button"
        className="iw-btn primary"
        onClick={handleSave}
        disabled={saving}
      >
        {saving
          ? "Saving..."
          : mode === "create"
            ? "Create policy"
            : "Save changes"}
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
      <button
        type="button"
        className="iw-btn primary"
        onClick={() => setMode("edit")}
      >
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
              <ContactPicker
                value={
                  form.contactId
                    ? { id: form.contactId, name: form.contactName }
                    : null
                }
                onChange={handleContactChange}
              />
            </div>
            <div className="iw-field">
              <label>Policyholder</label>
              <input
                value={form.holderName}
                onChange={setField("holderName")}
                placeholder="Business or person name"
              />
            </div>
            <div className="iw-field">
              <label>Policy number</label>
              <input
                value={form.policyNumber}
                onChange={setField("policyNumber")}
                placeholder="Auto-generated if blank"
              />
            </div>
            <div className="iw-field">
              <label>Policy type</label>
              <input
                value={form.policyType}
                onChange={setField("policyType")}
                placeholder="e.g. Commercial General Liability"
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
              <label>Premium</label>
              <input
                type="number"
                step="0.01"
                value={form.premium}
                onChange={setField("premium")}
                placeholder="0.00"
              />
            </div>
            <div className="iw-field">
              <label>Billing frequency</label>
              <select
                value={form.billingFrequency}
                onChange={setField("billingFrequency")}
              >
                {BILLING_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div className="iw-field">
              <label>Coverage start</label>
              <input
                type="date"
                value={form.coverageStart}
                onChange={setField("coverageStart")}
              />
            </div>
            <div className="iw-field">
              <label>Coverage end</label>
              <input
                type="date"
                value={form.coverageEnd}
                onChange={setField("coverageEnd")}
              />
            </div>
            <div className="iw-field">
              <label>Next billing</label>
              <input
                type="date"
                value={form.nextBilling}
                onChange={setField("nextBilling")}
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
              <dt>Policy number</dt>
              <dd>{policy?.policyNumber || "-"}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{policy?.status || "-"}</dd>
            </div>
            <div>
              <dt>Policyholder</dt>
              <dd>{policy?.holderName || "-"}</dd>
            </div>
            <div>
              <dt>Contact</dt>
              <dd>{policy?.contactName || "-"}</dd>
            </div>
            <div>
              <dt>Policy type</dt>
              <dd>{policy?.policyType || "-"}</dd>
            </div>
            <div>
              <dt>Carrier</dt>
              <dd>{policy?.carrierName || "-"}</dd>
            </div>
            <div>
              <dt>Premium</dt>
              <dd>{policy?.premium != null ? formatMoney(policy.premium) : "-"}</dd>
            </div>
            <div>
              <dt>Billing frequency</dt>
              <dd>{policy?.billingFrequency || "-"}</dd>
            </div>
            <div>
              <dt>Coverage start</dt>
              <dd>{formatDate(policy?.coverageStart)}</dd>
            </div>
            <div>
              <dt>Coverage end</dt>
              <dd>{formatDate(policy?.coverageEnd)}</dd>
            </div>
            <div>
              <dt>Next billing</dt>
              <dd>{formatDate(policy?.nextBilling)}</dd>
            </div>
            <div>
              <dt>Assigned agent</dt>
              <dd>{policy?.agentName || "Unassigned"}</dd>
            </div>
            <div className="full">
              <dt>Notes</dt>
              <dd>{policy?.notes || "-"}</dd>
            </div>
          </dl>
        </>
      )}
    </InsuranceWorkModal>
  );
}
