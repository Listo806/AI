import React, { useEffect, useState } from "react";
import InsuranceWorkModal from "./InsuranceWorkModal";
import PolicyPicker from "./PolicyPicker";
import insuranceApi from "../../api/insuranceApi";

const STATUS_OPTIONS = [
  "New",
  "Submitted",
  "In Review",
  "Approved",
  "Partially Paid",
  "Paid",
  "Denied",
  "Closed",
];

const EMPTY_FORM = {
  policyId: "",
  policyLabel: "",
  claimNumber: "",
  claimType: "",
  status: "New",
  incidentDate: "",
  filedDate: "",
  resolvedDate: "",
  amountClaimed: "",
  amountApproved: "",
  amountPaid: "",
  description: "",
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

function numOrNull(v) {
  return v !== "" && !isNaN(Number(v)) ? Number(v) : null;
}

function formatMoney(value) {
  if (value == null) return "-";
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

function policyLabel(p) {
  if (!p.policyNumber && !p.policyHolder) return "";
  return p.policyHolder
    ? `${p.policyNumber || "Policy"} — ${p.policyHolder}`
    : p.policyNumber || "Policy";
}

// Claim create / view / edit / delete inside the shared InsuranceWorkModal.
export default function ClaimModal({
  open,
  mode: initialMode,
  claimId,
  onClose,
  onSaved,
}) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState(EMPTY_FORM);
  const [claim, setClaim] = useState(null);
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
      setClaim(null);
      return undefined;
    }
    if (!claimId) return undefined;

    let cancelled = false;
    setLoading(true);
    insuranceApi
      .getClaim(claimId)
      .then((c) => {
        if (cancelled) return;
        setClaim(c);
        setForm({
          policyId: c.policyId || "",
          policyLabel: policyLabel(c),
          claimNumber: c.claimNumber || "",
          claimType: c.claimType || "",
          status: c.status || "New",
          incidentDate: toDateInput(c.incidentDate),
          filedDate: toDateInput(c.filedDate),
          resolvedDate: toDateInput(c.resolvedDate),
          amountClaimed: c.amountClaimed != null ? String(c.amountClaimed) : "",
          amountApproved:
            c.amountApproved != null ? String(c.amountApproved) : "",
          amountPaid: c.amountPaid != null ? String(c.amountPaid) : "",
          description: c.description || "",
        });
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Failed to load claim");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, claimId, initialMode]);

  const setField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handlePolicyChange = (policy) =>
    setForm((f) => ({
      ...f,
      policyId: policy ? policy.id : "",
      policyLabel: policy ? policy.label || "" : "",
    }));

  function buildPayload() {
    return {
      // Never send null: a claim must always keep a policy. Omitting on edit
      // leaves the existing link untouched.
      policyId: form.policyId || undefined,
      claimNumber: form.claimNumber.trim(),
      claimType: form.claimType.trim(),
      status: form.status,
      incidentDate: form.incidentDate || null,
      filedDate: form.filedDate || null,
      resolvedDate: form.resolvedDate || null,
      description: form.description.trim(),
      amountClaimed: numOrNull(form.amountClaimed),
      amountApproved: numOrNull(form.amountApproved),
      amountPaid: numOrNull(form.amountPaid),
    };
  }

  const requestClose = () => {
    if (saving) return;
    onClose?.();
  };

  async function handleSave() {
    if (!form.policyId) {
      setError("Select the policy this claim is for.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload();
      if (mode === "create") {
        await insuranceApi.createClaim(payload);
      } else {
        await insuranceApi.updateClaim(claimId, payload);
      }
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to save claim");
    }
  }

  async function handleDelete() {
    if (!claimId) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm("Delete this claim? This cannot be undone.")) return;
    setSaving(true);
    setError(null);
    try {
      await insuranceApi.deleteClaim(claimId);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to delete claim");
    }
  }

  const isForm = mode === "create" || mode === "edit";
  const title =
    mode === "create"
      ? "New Claim"
      : mode === "edit"
        ? "Edit Claim"
        : claim?.claimNumber || "Claim";
  const subtitle =
    mode === "view"
      ? claim?.policyNumber
        ? `Policy ${claim.policyNumber}`
        : ""
      : "Claim details";

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
            ? "Create claim"
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
              <label>Policy (required)</label>
              <PolicyPicker
                value={
                  form.policyId
                    ? { id: form.policyId, label: form.policyLabel }
                    : null
                }
                onChange={handlePolicyChange}
              />
            </div>
            <div className="iw-field">
              <label>Claim number</label>
              <input
                value={form.claimNumber}
                onChange={setField("claimNumber")}
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
              <label>Claim type</label>
              <input
                value={form.claimType}
                onChange={setField("claimType")}
                placeholder="e.g. Property damage"
              />
            </div>
            <div className="iw-field">
              <label>Incident date</label>
              <input
                type="date"
                value={form.incidentDate}
                onChange={setField("incidentDate")}
              />
            </div>
            <div className="iw-field">
              <label>Filed date</label>
              <input
                type="date"
                value={form.filedDate}
                onChange={setField("filedDate")}
              />
            </div>
            <div className="iw-field">
              <label>Resolved date</label>
              <input
                type="date"
                value={form.resolvedDate}
                onChange={setField("resolvedDate")}
              />
            </div>
            <div className="iw-field">
              <label>Amount claimed</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amountClaimed}
                onChange={setField("amountClaimed")}
                placeholder="0.00"
              />
            </div>
            <div className="iw-field">
              <label>Amount approved</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amountApproved}
                onChange={setField("amountApproved")}
                placeholder="0.00"
              />
            </div>
            <div className="iw-field">
              <label>Amount paid</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amountPaid}
                onChange={setField("amountPaid")}
                placeholder="0.00"
              />
            </div>
            <div className="iw-field full">
              <label>Description / notes</label>
              <textarea
                value={form.description}
                onChange={setField("description")}
                placeholder="What happened, adjuster notes, etc."
              />
            </div>
          </div>
        </>
      ) : (
        <>
          {error && <p className="iw-error">{error}</p>}
          <dl className="iw-detail">
            <div>
              <dt>Claim number</dt>
              <dd>{claim?.claimNumber || "-"}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{claim?.status || "-"}</dd>
            </div>
            <div>
              <dt>Policy</dt>
              <dd>{claim?.policyNumber || "-"}</dd>
            </div>
            <div>
              <dt>Customer</dt>
              <dd>{claim?.contactName || claim?.policyHolder || "-"}</dd>
            </div>
            <div>
              <dt>Claim type</dt>
              <dd>{claim?.claimType || "-"}</dd>
            </div>
            <div>
              <dt>Incident date</dt>
              <dd>{formatDate(claim?.incidentDate)}</dd>
            </div>
            <div>
              <dt>Filed date</dt>
              <dd>{formatDate(claim?.filedDate)}</dd>
            </div>
            <div>
              <dt>Resolved date</dt>
              <dd>{formatDate(claim?.resolvedDate)}</dd>
            </div>
            <div>
              <dt>Amount claimed</dt>
              <dd>{formatMoney(claim?.amountClaimed)}</dd>
            </div>
            <div>
              <dt>Amount approved</dt>
              <dd>{formatMoney(claim?.amountApproved)}</dd>
            </div>
            <div>
              <dt>Amount paid</dt>
              <dd>{formatMoney(claim?.amountPaid)}</dd>
            </div>
            <div>
              <dt>Assigned agent</dt>
              <dd>{claim?.agentName || "Unassigned"}</dd>
            </div>
            <div className="full">
              <dt>Description / notes</dt>
              <dd>{claim?.description || "-"}</dd>
            </div>
          </dl>
        </>
      )}
    </InsuranceWorkModal>
  );
}
