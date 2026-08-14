import React, { useEffect, useState } from "react";
import InsuranceWorkModal from "./InsuranceWorkModal";
import PolicyPicker from "./PolicyPicker";
import insuranceApi from "../../api/insuranceApi";

const STATUS_OPTIONS = [
  "Pending",
  "Earned",
  "Due",
  "Paid",
  "Adjusted",
  "Reversed",
];

const EMPTY_FORM = {
  policyId: "",
  policyLabel: "",
  rate: "",
  amount: "",
  status: "Pending",
  period: "",
  earnedDate: "",
  dueDate: "",
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

function policyLabel(c) {
  if (!c.policyNumber && !c.policyHolder) return "";
  return c.policyHolder
    ? `${c.policyNumber || "Policy"} — ${c.policyHolder}`
    : c.policyNumber || "Policy";
}

export default function CommissionModal({
  open,
  mode: initialMode,
  commissionId,
  onClose,
  onSaved,
}) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState(EMPTY_FORM);
  const [commission, setCommission] = useState(null);
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
      setCommission(null);
      return undefined;
    }
    if (!commissionId) return undefined;
    let cancelled = false;
    setLoading(true);
    insuranceApi
      .getCommission(commissionId)
      .then((c) => {
        if (cancelled) return;
        setCommission(c);
        setForm({
          policyId: c.policyId || "",
          policyLabel: policyLabel(c),
          rate: c.rate != null ? String(c.rate) : "",
          amount: c.amount != null ? String(c.amount) : "",
          status: c.status || "Pending",
          period: c.period || "",
          earnedDate: toDateInput(c.earnedDate),
          dueDate: toDateInput(c.dueDate),
          notes: c.notes || "",
        });
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Failed to load commission");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, commissionId, initialMode]);

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
      rate: numOrNull(form.rate),
      amount: numOrNull(form.amount),
      status: form.status,
      period: form.period.trim(),
      earnedDate: form.earnedDate || null,
      dueDate: form.dueDate || null,
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
      setError("Select the policy this commission is for.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload();
      if (mode === "create") {
        await insuranceApi.createCommission(payload);
      } else {
        await insuranceApi.updateCommission(commissionId, payload);
      }
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to save commission");
    }
  }

  async function handleDelete() {
    if (!commissionId) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm("Delete this commission? This cannot be undone.")) return;
    setSaving(true);
    setError(null);
    try {
      await insuranceApi.deleteCommission(commissionId);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to delete commission");
    }
  }

  const isForm = mode === "create" || mode === "edit";
  const title =
    mode === "create"
      ? "New Commission"
      : mode === "edit"
        ? "Edit Commission"
        : commission?.policyNumber
          ? `Commission · ${commission.policyNumber}`
          : "Commission";

  const footer = loading ? null : isForm ? (
    <>
      <button type="button" className="iw-btn" onClick={requestClose} disabled={saving}>
        Cancel
      </button>
      <button type="button" className="iw-btn primary" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : mode === "create" ? "Create commission" : "Save changes"}
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
    <InsuranceWorkModal
      open={open}
      title={title}
      subtitle={mode === "view" ? commission?.agentName || "" : "Commission details"}
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
              <label>Rate (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.rate}
                onChange={setField("rate")}
                placeholder="e.g. 10"
              />
            </div>
            <div className="iw-field">
              <label>Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={setField("amount")}
                placeholder="Auto from premium × rate"
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
              <label>Period</label>
              <input value={form.period} onChange={setField("period")} placeholder="e.g. 2026 Q1" />
            </div>
            <div className="iw-field">
              <label>Earned date</label>
              <input type="date" value={form.earnedDate} onChange={setField("earnedDate")} />
            </div>
            <div className="iw-field">
              <label>Due date</label>
              <input type="date" value={form.dueDate} onChange={setField("dueDate")} />
            </div>
            <div className="iw-field full">
              <label>Notes</label>
              <textarea value={form.notes} onChange={setField("notes")} placeholder="Notes" />
            </div>
          </div>
          <p className="iw-hint">
            If you enter a rate, the amount is calculated from the policy premium
            × rate on save.
          </p>
        </>
      ) : (
        <>
          {error && <p className="iw-error">{error}</p>}
          <dl className="iw-detail">
            <div>
              <dt>Policy</dt>
              <dd>{commission?.policyNumber || "-"}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{commission?.status || "-"}</dd>
            </div>
            <div>
              <dt>Customer</dt>
              <dd>{commission?.contactName || commission?.policyHolder || "-"}</dd>
            </div>
            <div>
              <dt>Agent</dt>
              <dd>{commission?.agentName || "Unassigned"}</dd>
            </div>
            <div>
              <dt>Rate</dt>
              <dd>{commission?.rate != null ? `${commission.rate}%` : "-"}</dd>
            </div>
            <div>
              <dt>Amount</dt>
              <dd>{formatMoney(commission?.amount)}</dd>
            </div>
            <div>
              <dt>Period</dt>
              <dd>{commission?.period || "-"}</dd>
            </div>
            <div>
              <dt>Earned date</dt>
              <dd>{formatDate(commission?.earnedDate)}</dd>
            </div>
            <div>
              <dt>Due date</dt>
              <dd>{formatDate(commission?.dueDate)}</dd>
            </div>
            <div>
              <dt>Paid date</dt>
              <dd>{formatDate(commission?.paidDate)}</dd>
            </div>
            <div className="full">
              <dt>Notes</dt>
              <dd>{commission?.notes || "-"}</dd>
            </div>
          </dl>
        </>
      )}
    </InsuranceWorkModal>
  );
}
