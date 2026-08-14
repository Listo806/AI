import React, { useEffect, useState } from "react";
import InsuranceWorkModal from "./InsuranceWorkModal";
import ContactPicker from "./ContactPicker";
import insuranceApi from "../../api/insuranceApi";

const STATUS_OPTIONS = ["Draft", "Sent", "Accepted", "Declined", "Expired"];
const BILLING_OPTIONS = ["Annual", "Semi-Annual", "Quarterly", "Monthly"];

const EMPTY_FORM = {
  quoteNumber: "",
  contactId: "",
  contactName: "",
  holderName: "",
  policyType: "",
  quotedPremium: "",
  status: "Draft",
  billingFrequency: "Annual",
  coverageStart: "",
  coverageEnd: "",
  validUntil: "",
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

// Quote create / view / edit / delete, plus Convert to Policy, inside the shared
// InsuranceWorkModal.
export default function QuoteModal({
  open,
  mode: initialMode,
  quoteId,
  onClose,
  onSaved,
}) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState(EMPTY_FORM);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [convertedNow, setConvertedNow] = useState(false);

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  useEffect(() => {
    if (!open) return undefined;
    setError(null);
    setNotice(null);

    if (initialMode === "create") {
      setForm(EMPTY_FORM);
      setQuote(null);
      return undefined;
    }
    if (!quoteId) return undefined;

    let cancelled = false;
    setLoading(true);
    insuranceApi
      .getQuote(quoteId)
      .then((q) => {
        if (cancelled) return;
        setQuote(q);
        setForm({
          quoteNumber: q.quoteNumber || "",
          contactId: q.contactId || "",
          contactName: q.contactName || "",
          holderName: q.holderName || "",
          policyType: q.policyType || "",
          quotedPremium: q.quotedPremium != null ? String(q.quotedPremium) : "",
          status: q.status || "Draft",
          billingFrequency: q.billingFrequency || "Annual",
          coverageStart: toDateInput(q.coverageStart),
          coverageEnd: toDateInput(q.coverageEnd),
          validUntil: toDateInput(q.validUntil),
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
      holderName: f.holderName || (contact ? contact.name || "" : ""),
    }));

  function buildPayload() {
    return {
      quoteNumber: form.quoteNumber.trim(),
      contactId: form.contactId || null,
      holderName: form.holderName.trim(),
      policyType: form.policyType.trim(),
      status: form.status,
      billingFrequency: form.billingFrequency,
      coverageStart: form.coverageStart || null,
      coverageEnd: form.coverageEnd || null,
      validUntil: form.validUntil || null,
      notes: form.notes.trim(),
      quotedPremium: numOrNull(form.quotedPremium),
    };
  }

  const requestClose = () => {
    if (saving) return;
    onClose?.();
  };

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload();
      if (mode === "create") {
        await insuranceApi.createQuote(payload);
      } else {
        await insuranceApi.updateQuote(quoteId, payload);
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
      await insuranceApi.deleteQuote(quoteId);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to delete quote");
    }
  }

  async function handleConvert() {
    if (!quoteId) return;
    // eslint-disable-next-line no-alert
    if (
      !window.confirm(
        "Convert this quote into a policy? The customer and coverage carry over.",
      )
    )
      return;
    setSaving(true);
    setError(null);
    try {
      const policy = await insuranceApi.convertQuote(quoteId);
      setConvertedNow(true);
      setNotice(
        `Policy ${policy?.policyNumber || "created"} was created from this quote.`,
      );
      onSaved?.();
      // Refresh the modal's state so the status shows Accepted and the converted
      // policy link is reflected (a later Edit->Save then can't revert status).
      try {
        const fresh = await insuranceApi.getQuote(quoteId);
        setQuote(fresh);
        setForm((f) => ({ ...f, status: fresh.status || f.status }));
      } catch (_) {
        /* non-fatal refresh */
      }
      setSaving(false);
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to convert quote");
    }
  }

  const isForm = mode === "create" || mode === "edit";
  const alreadyConverted = !!quote?.convertedPolicyId || convertedNow;
  const title =
    mode === "create"
      ? "New Quote"
      : mode === "edit"
        ? "Edit Quote"
        : quote?.quoteNumber || "Quote";
  const subtitle =
    mode === "view" ? quote?.holderName || quote?.contactName || "" : "Quote details";

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
            ? "Create quote"
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
      {!alreadyConverted && (
        <button
          type="button"
          className="iw-btn"
          onClick={handleConvert}
          disabled={saving}
        >
          {saving ? "Converting..." : "Convert to policy"}
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
              <label>Customer / holder</label>
              <input
                value={form.holderName}
                onChange={setField("holderName")}
                placeholder="Business or person name"
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
              <label>Quoted premium</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.quotedPremium}
                onChange={setField("quotedPremium")}
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
              <label>Valid until</label>
              <input
                type="date"
                value={form.validUntil}
                onChange={setField("validUntil")}
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
          {notice && <p className="iw-notice">{notice}</p>}
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
              <dd>{quote?.contactName || quote?.holderName || "-"}</dd>
            </div>
            <div>
              <dt>Policy type</dt>
              <dd>{quote?.policyType || "-"}</dd>
            </div>
            <div>
              <dt>Quoted premium</dt>
              <dd>{formatMoney(quote?.quotedPremium)}</dd>
            </div>
            <div>
              <dt>Billing frequency</dt>
              <dd>{quote?.billingFrequency || "-"}</dd>
            </div>
            <div>
              <dt>Coverage start</dt>
              <dd>{formatDate(quote?.coverageStart)}</dd>
            </div>
            <div>
              <dt>Coverage end</dt>
              <dd>{formatDate(quote?.coverageEnd)}</dd>
            </div>
            <div>
              <dt>Valid until</dt>
              <dd>{formatDate(quote?.validUntil)}</dd>
            </div>
            <div>
              <dt>Converted policy</dt>
              <dd>{quote?.convertedPolicyNumber || "Not converted"}</dd>
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
