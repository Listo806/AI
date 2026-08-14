import React, { useEffect, useState } from "react";
import InsuranceWorkModal from "./InsuranceWorkModal";
import insuranceApi from "../../api/insuranceApi";

const STATUS_OPTIONS = ["active", "inactive"];

const EMPTY_FORM = {
  name: "",
  carrierMark: "",
  contactEmail: "",
  contactPhone: "",
  status: "active",
  notes: "",
};

export default function CarrierModal({
  open,
  mode: initialMode,
  carrierId,
  onClose,
  onSaved,
}) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState(EMPTY_FORM);
  const [carrier, setCarrier] = useState(null);
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
      setCarrier(null);
      return undefined;
    }
    if (!carrierId) return undefined;
    let cancelled = false;
    setLoading(true);
    insuranceApi
      .getCarrier(carrierId)
      .then((c) => {
        if (cancelled) return;
        setCarrier(c);
        setForm({
          name: c.name || "",
          carrierMark: c.carrierMark || "",
          contactEmail: c.contactEmail || "",
          contactPhone: c.contactPhone || "",
          status: c.status || "active",
          notes: c.notes || "",
        });
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Failed to load carrier");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, carrierId, initialMode]);

  const setField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const requestClose = () => {
    if (saving) return;
    onClose?.();
  };

  async function handleSave() {
    if (!form.name.trim()) {
      setError("Carrier name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        carrierMark: form.carrierMark.trim(),
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim(),
        status: form.status,
        notes: form.notes.trim(),
      };
      if (mode === "create") {
        await insuranceApi.createCarrier(payload);
      } else {
        await insuranceApi.updateCarrier(carrierId, payload);
      }
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to save carrier");
    }
  }

  async function handleDelete() {
    if (!carrierId) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm("Delete this carrier? This cannot be undone.")) return;
    setSaving(true);
    setError(null);
    try {
      await insuranceApi.deleteCarrier(carrierId);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to delete carrier");
    }
  }

  const isForm = mode === "create" || mode === "edit";
  const title =
    mode === "create"
      ? "New Carrier"
      : mode === "edit"
        ? "Edit Carrier"
        : carrier?.name || "Carrier";

  const footer = loading ? null : isForm ? (
    <>
      <button type="button" className="iw-btn" onClick={requestClose} disabled={saving}>
        Cancel
      </button>
      <button type="button" className="iw-btn primary" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : mode === "create" ? "Add carrier" : "Save changes"}
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
      subtitle={mode === "view" ? "Carrier details" : "Carrier"}
      onClose={requestClose}
      footer={footer}
    >
      {loading ? (
        <div className="iw-loading">Loading...</div>
      ) : isForm ? (
        <>
          {error && <p className="iw-error">{error}</p>}
          <div className="iw-form">
            <div className="iw-field">
              <label>Carrier name</label>
              <input value={form.name} onChange={setField("name")} placeholder="e.g. Travelers" />
            </div>
            <div className="iw-field">
              <label>Short mark</label>
              <input value={form.carrierMark} onChange={setField("carrierMark")} placeholder="e.g. TR" />
            </div>
            <div className="iw-field">
              <label>Contact email</label>
              <input value={form.contactEmail} onChange={setField("contactEmail")} placeholder="agent@carrier.com" />
            </div>
            <div className="iw-field">
              <label>Contact phone</label>
              <input value={form.contactPhone} onChange={setField("contactPhone")} placeholder="Phone" />
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
            <div className="iw-field full">
              <label>Notes</label>
              <textarea value={form.notes} onChange={setField("notes")} placeholder="Notes" />
            </div>
          </div>
        </>
      ) : (
        <>
          {error && <p className="iw-error">{error}</p>}
          <dl className="iw-detail">
            <div>
              <dt>Name</dt>
              <dd>{carrier?.name || "-"}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{carrier?.status || "-"}</dd>
            </div>
            <div>
              <dt>Contact email</dt>
              <dd>{carrier?.contactEmail || "-"}</dd>
            </div>
            <div>
              <dt>Contact phone</dt>
              <dd>{carrier?.contactPhone || "-"}</dd>
            </div>
            <div>
              <dt>Policies</dt>
              <dd>{carrier?.policyCount ?? 0}</dd>
            </div>
            <div className="full">
              <dt>Notes</dt>
              <dd>{carrier?.notes || "-"}</dd>
            </div>
          </dl>
        </>
      )}
    </InsuranceWorkModal>
  );
}
