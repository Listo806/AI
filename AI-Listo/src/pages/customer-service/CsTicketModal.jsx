import React, { useEffect, useState } from "react";
import InsuranceWorkModal from "../insurance/InsuranceWorkModal";
import CsContactPicker from "./CsContactPicker";
import CsAgentPicker from "./CsAgentPicker";
import customerServiceApi from "../../api/customerServiceApi";
import { formatDate, toDateInput } from "../sales/salesFormat";

const CHANNEL_OPTIONS = ["Web", "Email", "Portal", "Chat", "Phone", "WhatsApp", "Other"];
const CATEGORY_OPTIONS = [
  "Account Access",
  "Billing & Payments",
  "Technical Issue",
  "Feature Request",
  "Integration",
  "How-To / Support",
  "Other",
];
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Urgent"];
const STATUS_OPTIONS = ["Open", "In Progress", "Pending", "On Hold", "Resolved", "Closed"];
const SLA_OPTIONS = ["On Track", "At Risk", "Breached", "Completed"];

const EMPTY_FORM = {
  ticketNumber: "",
  subject: "",
  description: "",
  contactId: "",
  customerName: "",
  channel: "Web",
  category: "",
  priority: "Medium",
  status: "Open",
  slaStatus: "",
  assignedTo: "",
  assignedAgentName: "",
  tags: "",
  dueAt: "",
};

export default function CsTicketModal({ open, mode: initialMode, recordId, onClose, onSaved }) {
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
    customerServiceApi
      .getTicket(recordId)
      .then((t) => {
        if (cancelled) return;
        setRecord(t);
        setForm({
          ticketNumber: t.ticketNumber || "",
          subject: t.subject || "",
          description: t.description || "",
          contactId: t.contactId || "",
          customerName: t.customerName || "",
          channel: t.channel || "Web",
          category: t.category || "",
          priority: t.priority || "Medium",
          status: t.status || "Open",
          slaStatus: t.slaStatus || "",
          assignedTo: t.assignedTo || "",
          assignedAgentName: t.assignedAgentName || "",
          tags: Array.isArray(t.tags) ? t.tags.join(", ") : "",
          dueAt: toDateInput(t.dueAt),
        });
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Failed to load ticket");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, recordId, initialMode]);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleContactChange = (c) =>
    setForm((f) => ({
      ...f,
      contactId: c ? c.id : "",
      customerName: c ? c.name || "" : "",
    }));
  const handleAgentChange = (a) =>
    setForm((f) => ({
      ...f,
      assignedTo: a ? a.id : "",
      assignedAgentName: a ? a.name || "" : "",
    }));

  function buildPayload() {
    const tags = form.tags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      ticketNumber: form.ticketNumber.trim(),
      subject: form.subject.trim(),
      description: form.description.trim(),
      contactId: form.contactId || null,
      customerName: form.customerName.trim(),
      channel: form.channel,
      category: form.category.trim(),
      priority: form.priority,
      status: form.status,
      slaStatus: form.slaStatus || null,
      assignedTo: form.assignedTo || null,
      assignedAgentName: form.assignedAgentName.trim(),
      tags,
      dueAt: form.dueAt || null,
    };
  }

  const requestClose = () => {
    if (saving) return;
    onClose?.();
  };

  async function handleSave() {
    if (!form.subject.trim()) {
      setError("A subject is required.");
      return;
    }
    if (!form.contactId && !form.customerName.trim()) {
      setError("Link a customer or enter a customer name.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload();
      if (mode === "create") await customerServiceApi.createTicket(payload);
      else await customerServiceApi.updateTicket(recordId, payload);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to save ticket");
    }
  }

  async function handleDelete() {
    if (!recordId) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm("Delete this ticket? This cannot be undone.")) return;
    setSaving(true);
    setError(null);
    try {
      await customerServiceApi.deleteTicket(recordId);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Failed to delete ticket");
    }
  }

  const isForm = mode === "create" || mode === "edit";
  const title =
    mode === "create" ? "New Ticket" : mode === "edit" ? "Edit Ticket" : record?.ticketNumber || "Ticket";
  const subtitle = mode === "view" ? record?.subject || "" : "Ticket details";

  const footer = loading ? null : isForm ? (
    <>
      <button type="button" className="iw-btn" onClick={requestClose} disabled={saving}>Cancel</button>
      <button type="button" className="iw-btn primary" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : mode === "create" ? "Create ticket" : "Save changes"}
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
              <label>Subject</label>
              <input value={form.subject} onChange={setField("subject")} placeholder="Short summary of the issue" />
            </div>
            <div className="iw-field full">
              <label>Customer</label>
              <CsContactPicker
                value={form.contactId ? { id: form.contactId, name: form.customerName } : null}
                onChange={handleContactChange}
              />
            </div>
            <div className="iw-field full">
              <label>Customer name (if no linked contact)</label>
              <input value={form.customerName} onChange={setField("customerName")} placeholder="Customer name" />
            </div>
            <div className="iw-field">
              <label>Channel</label>
              <select value={form.channel} onChange={setField("channel")}>
                {CHANNEL_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div className="iw-field">
              <label>Category</label>
              <select value={form.category} onChange={setField("category")}>
                <option value="">Select category</option>
                {CATEGORY_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div className="iw-field">
              <label>Priority</label>
              <select value={form.priority} onChange={setField("priority")}>
                {PRIORITY_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div className="iw-field">
              <label>Status</label>
              <select value={form.status} onChange={setField("status")}>
                {STATUS_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div className="iw-field">
              <label>SLA status</label>
              <select value={form.slaStatus} onChange={setField("slaStatus")}>
                <option value="">Not set</option>
                {SLA_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div className="iw-field">
              <label>Due date</label>
              <input type="date" value={form.dueAt} onChange={setField("dueAt")} />
            </div>
            <div className="iw-field full">
              <label>Assigned agent</label>
              <CsAgentPicker
                value={form.assignedTo ? { id: form.assignedTo, name: form.assignedAgentName } : null}
                onChange={handleAgentChange}
              />
            </div>
            <div className="iw-field full">
              <label>Tags (comma separated)</label>
              <input value={form.tags} onChange={setField("tags")} placeholder="e.g. urgent, vip" />
            </div>
            <div className="iw-field full">
              <label>Ticket number</label>
              <input value={form.ticketNumber} onChange={setField("ticketNumber")} placeholder="Auto-generated if blank" />
            </div>
            <div className="iw-field full">
              <label>Description</label>
              <textarea value={form.description} onChange={setField("description")} placeholder="Full description of the issue" />
            </div>
          </div>
        </>
      ) : (
        <>
          {error && <p className="iw-error">{error}</p>}
          <dl className="iw-detail">
            <div><dt>Ticket number</dt><dd>{record?.ticketNumber || "-"}</dd></div>
            <div><dt>Status</dt><dd>{record?.status || "-"}</dd></div>
            <div className="full"><dt>Subject</dt><dd>{record?.subject || "-"}</dd></div>
            <div><dt>Customer</dt><dd>{record?.customerName || "-"}</dd></div>
            <div><dt>Channel</dt><dd>{record?.channel || "-"}</dd></div>
            <div><dt>Category</dt><dd>{record?.category || "-"}</dd></div>
            <div><dt>Priority</dt><dd>{record?.priority || "-"}</dd></div>
            <div><dt>SLA status</dt><dd>{record?.slaStatus || "-"}</dd></div>
            <div><dt>Assigned agent</dt><dd>{record?.assignedAgentName || "Unassigned"}</dd></div>
            <div><dt>Due date</dt><dd>{formatDate(record?.dueAt)}</dd></div>
            <div><dt>First response</dt><dd>{formatDate(record?.firstResponseAt)}</dd></div>
            <div><dt>Resolved</dt><dd>{formatDate(record?.resolvedAt)}</dd></div>
            <div className="full"><dt>Tags</dt><dd>{Array.isArray(record?.tags) && record.tags.length ? record.tags.join(", ") : "-"}</dd></div>
            <div className="full"><dt>Description</dt><dd>{record?.description || "-"}</dd></div>
          </dl>
        </>
      )}
    </InsuranceWorkModal>
  );
}
