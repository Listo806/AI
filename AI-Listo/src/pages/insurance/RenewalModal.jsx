import React, { useEffect, useState } from "react";
import InsuranceWorkModal from "./InsuranceWorkModal";
import PolicyPicker from "./PolicyPicker";
import insuranceApi from "../../api/insuranceApi";

const STATUS_OPTIONS = [
  "Upcoming",
  "Contacted",
  "Quoted",
  "Accepted",
  "Renewed",
  "Declined",
  "Lapsed",
];

const EMPTY_FORM = {
  policyId: "",
  policyLabel: "",
  renewalDate: "",
  renewalPremium: "",
  status: "Upcoming",
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

function policyLabel(r) {
  if (!r.policyNumber && !r.policyHolder) return "";
  return r.policyHolder
    ? `${r.policyNumber || "Policy"} — ${r.policyHolder}`
    : r.policyNumber || "Policy";
}

// Renewal create / view / edit / delete, plus "Create renewed policy".
export default function RenewalModal({
  open,
  mode: initialMode,
  renewalId,
  onClose,
  onSaved,
}) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState(EMPTY_FORM);
  const [renewal, setRenewal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [renewedNow, setRenewedNow] = useState(false);

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  useEffect(() => {
    if (!open) return undefined;
    setError(null);
    setNotice(null);

    if (initialMode === "create") {
      setForm(EMPTY_FORM);
      setRenewal(null);
      return undefined;
    }
    if (!renewalId) return undefined;

    let cancelled = false;
    setLoading(true);
    insuranceApi
      .getRenewal(renewalId)
      .then((r) => {
        if (cancelled) return;
        setRenewal(r);
        setForm({
          policyId: r.policyId || "",
          policyLabel: policyLabel(r),
          renewalDate: toDateInput(r.renewalDate),
          renewalPremium: r.renewalPremium != null ? String(r.renewalPremium) : "",
          status: r.status || "Upcoming",
          notes: r.notes || "",
        });
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Failed to load renewal");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, renewalId, initialMode]);

  const setField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handlePolicyChange = (policy) =>
    setForm((f) => ({
      ...f,
      policyId: policy ? policy.id : "",
      policyLabel: policy ? policy.label || "" : "",
    }));

  function buildPayload() {
    const p = {
      renewalDate: form.renewalDate || null,
      renewalPremium: numOrNull(form.renewalPremium),
      status: form.status,
      notes: form.notes.trim(),
    };
    if (mode === "create") p.policyId = form.policyId || undefined;
    return p;
  }

  const requestClose = () => {
    if (saving) return;
    onClose?.();
  };

  async function handleSave() {
    if (mode === "create" && !form.policyId) {
      setError("Select the policy to renew.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload();
      if (mode === "create") {
        await insuranceApi.createRenewal(payload);
      } else {
        await insuranceApi.updateRenewal(renewalId, payload);
      }
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to save renewal");
    }
  }

  async function handleDelete() {
    if (!renewalId) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm("Delete this renewal? This cannot be undone.")) return;
    setSaving(true);
    setError(null);
    try {
      await insuranceApi.deleteRenewal(renewalId);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to delete renewal");
    }
  }

  async function handleRenew() {
    if (!renewalId) return;
    // eslint-disable-next-line no-alert
    if (
      !window.confirm(
        "Create the renewed policy term? The original policy is kept for history.",
      )
    )
      return;
    setSaving(true);
    setError(null);
    try {
      const policy = await insuranceApi.renewPolicy(renewalId);
      setRenewedNow(true);
      setNotice(
        `Renewed policy ${policy?.policyNumber || "created"} was created. The original policy is unchanged.`,
      );
      onSaved?.();
      try {
        const fresh = await insuranceApi.getRenewal(renewalId);
        setRenewal(fresh);
        setForm((f) => ({ ...f, status: fresh.status || f.status }));
      } catch (_) {
        /* non-fatal refresh */
      }
      setSaving(false);
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to create the renewed policy");
    }
  }

  const isForm = mode === "create" || mode === "edit";
  const alreadyRenewed = !!renewal?.renewedPolicyId || renewedNow;
  const title =
    mode === "create"
      ? "New Renewal"
      : mode === "edit"
        ? "Edit Renewal"
        : renewal?.policyNumber
          ? `Renewal · ${renewal.policyNumber}`
          : "Renewal";
  const subtitle =
    mode === "view" ? renewal?.policyHolder || renewal?.contactName || "" : "Renewal details";

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
            ? "Create renewal"
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
      {!alreadyRenewed && (
        <button
          type="button"
          className="iw-btn"
          onClick={handleRenew}
          disabled={saving}
        >
          {saving ? "Working..." : "Create renewed policy"}
        </button>
      )}
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
              <label>Policy to renew (required)</label>
              {mode === "create" ? (
                <PolicyPicker
                  value={
                    form.policyId
                      ? { id: form.policyId, label: form.policyLabel }
                      : null
                  }
                  onChange={handlePolicyChange}
                />
              ) : (
                <div className="iw-contact-selected">
                  <span>{form.policyLabel || "Linked policy"}</span>
                </div>
              )}
            </div>
            <div className="iw-field">
              <label>Renewal date</label>
              <input
                type="date"
                value={form.renewalDate}
                onChange={setField("renewalDate")}
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
              <label>Renewal premium</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.renewalPremium}
                onChange={setField("renewalPremium")}
                placeholder="0.00"
              />
            </div>
            <div className="iw-field full">
              <label>Notes</label>
              <textarea
                value={form.notes}
                onChange={setField("notes")}
                placeholder="Renewal notes"
              />
            </div>
          </div>
        </>
      ) : (
        <>
          {error && <p className="iw-error">{error}</p>}
          {notice && <p className="iw-notice">{notice}</p>}
          <dl className="iw-detail">
            <div>
              <dt>Policy</dt>
              <dd>{renewal?.policyNumber || "-"}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{renewal?.status || "-"}</dd>
            </div>
            <div>
              <dt>Customer</dt>
              <dd>{renewal?.contactName || renewal?.policyHolder || "-"}</dd>
            </div>
            <div>
              <dt>Carrier</dt>
              <dd>{renewal?.carrierName || "-"}</dd>
            </div>
            <div>
              <dt>Current expiration</dt>
              <dd>{formatDate(renewal?.currentExpiration)}</dd>
            </div>
            <div>
              <dt>Renewal date</dt>
              <dd>{formatDate(renewal?.renewalDate)}</dd>
            </div>
            <div>
              <dt>Current premium</dt>
              <dd>{formatMoney(renewal?.currentPremium)}</dd>
            </div>
            <div>
              <dt>Renewal premium</dt>
              <dd>{formatMoney(renewal?.renewalPremium)}</dd>
            </div>
            <div>
              <dt>Renewed policy</dt>
              <dd>{renewal?.renewedPolicyNumber || "Not renewed"}</dd>
            </div>
            <div>
              <dt>Assigned agent</dt>
              <dd>{renewal?.agentName || "Unassigned"}</dd>
            </div>
            <div className="full">
              <dt>Notes</dt>
              <dd>{renewal?.notes || "-"}</dd>
            </div>
          </dl>
        </>
      )}
    </InsuranceWorkModal>
  );
}
