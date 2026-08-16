import React, { useEffect, useState } from "react";
import InsuranceWorkModal from "../insurance/InsuranceWorkModal";
import customerServiceApi from "../../api/customerServiceApi";
import { formatDate } from "../sales/salesFormat";

const STATUS_OPTIONS = ["Draft", "Published", "Archived"];
const CATEGORY_OPTIONS = [
  "Getting Started",
  "Account",
  "Billing",
  "Troubleshooting",
  "How-To",
  "FAQ",
  "Other",
];

const EMPTY = { title: "", body: "", category: "", status: "Draft", authorName: "", tags: "" };

export default function CsArticleModal({ open, mode: initialMode, recordId, onClose, onSaved }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState(EMPTY);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { if (open) setMode(initialMode); }, [open, initialMode]);

  useEffect(() => {
    if (!open) return undefined;
    setError(null);
    if (initialMode === "create") { setForm(EMPTY); setRecord(null); return undefined; }
    if (!recordId) return undefined;
    let cancelled = false;
    setLoading(true);
    customerServiceApi
      .getArticle(recordId)
      .then((a) => {
        if (cancelled) return;
        setRecord(a);
        setForm({
          title: a.title || "",
          body: a.body || "",
          category: a.category || "",
          status: a.status || "Draft",
          authorName: a.authorName || "",
          tags: Array.isArray(a.tags) ? a.tags.join(", ") : "",
        });
        setLoading(false);
      })
      .catch((e) => { if (!cancelled) { setError(e?.message || "Failed to load article"); setLoading(false); } });
    return () => { cancelled = true; };
  }, [open, recordId, initialMode]);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function buildPayload() {
    return {
      title: form.title.trim(),
      body: form.body,
      category: form.category.trim(),
      status: form.status,
      authorName: form.authorName.trim(),
      tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
    };
  }

  async function handleSave() {
    if (!form.title.trim()) { setError("A title is required."); return; }
    setSaving(true); setError(null);
    try {
      if (mode === "create") await customerServiceApi.createArticle(buildPayload());
      else await customerServiceApi.updateArticle(recordId, buildPayload());
      setSaving(false); onSaved?.(); onClose?.();
    } catch (e) { setSaving(false); setError(e?.message || "Failed to save article"); }
  }

  async function quickStatus(status) {
    setSaving(true); setError(null);
    try {
      await customerServiceApi.updateArticle(recordId, { status });
      setSaving(false); onSaved?.(); onClose?.();
    } catch (e) { setSaving(false); setError(e?.message || "Failed to update status"); }
  }

  async function handleDelete() {
    if (!recordId) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm("Delete this article? This cannot be undone.")) return;
    setSaving(true); setError(null);
    try {
      await customerServiceApi.deleteArticle(recordId);
      setSaving(false); onSaved?.(); onClose?.();
    } catch (e) { setSaving(false); setError(e?.message || "Failed to delete article"); }
  }

  const isForm = mode === "create" || mode === "edit";
  const title = mode === "create" ? "New Article" : mode === "edit" ? "Edit Article" : record?.title || "Article";
  const subtitle = mode === "view" ? record?.category || "" : "Knowledge Base article";

  const footer = loading ? null : isForm ? (
    <>
      <button type="button" className="iw-btn" onClick={onClose} disabled={saving}>Cancel</button>
      <button type="button" className="iw-btn primary" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : mode === "create" ? "Create article" : "Save changes"}
      </button>
    </>
  ) : (
    <>
      <button type="button" className="iw-btn danger iw-btn-spacer" onClick={handleDelete} disabled={saving}>Delete</button>
      {record?.status !== "Published" && (
        <button type="button" className="iw-btn" onClick={() => quickStatus("Published")} disabled={saving}>Publish</button>
      )}
      {record?.status === "Published" && (
        <button type="button" className="iw-btn" onClick={() => quickStatus("Archived")} disabled={saving}>Archive</button>
      )}
      <button type="button" className="iw-btn" onClick={onClose}>Close</button>
      <button type="button" className="iw-btn primary" onClick={() => setMode("edit")}>Edit</button>
    </>
  );

  return (
    <InsuranceWorkModal open={open} title={title} subtitle={subtitle} onClose={onClose} footer={footer}>
      {loading ? (
        <div className="iw-loading">Loading...</div>
      ) : isForm ? (
        <>
          {error && <p className="iw-error">{error}</p>}
          <div className="iw-form">
            <div className="iw-field full">
              <label>Title</label>
              <input value={form.title} onChange={setField("title")} placeholder="Article title" />
            </div>
            <div className="iw-field">
              <label>Category</label>
              <select value={form.category} onChange={setField("category")}>
                <option value="">Select category</option>
                {CATEGORY_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div className="iw-field">
              <label>Status</label>
              <select value={form.status} onChange={setField("status")}>
                {STATUS_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div className="iw-field">
              <label>Author</label>
              <input value={form.authorName} onChange={setField("authorName")} placeholder="Author name" />
            </div>
            <div className="iw-field">
              <label>Tags (comma separated)</label>
              <input value={form.tags} onChange={setField("tags")} placeholder="e.g. login, password" />
            </div>
            <div className="iw-field full">
              <label>Body</label>
              <textarea value={form.body} onChange={setField("body")} rows={10} placeholder="Article content" />
            </div>
          </div>
        </>
      ) : (
        <>
          {error && <p className="iw-error">{error}</p>}
          <dl className="iw-detail">
            <div><dt>Status</dt><dd>{record?.status || "-"}</dd></div>
            <div><dt>Category</dt><dd>{record?.category || "-"}</dd></div>
            <div><dt>Author</dt><dd>{record?.authorName || "-"}</dd></div>
            <div><dt>Published</dt><dd>{formatDate(record?.publishedAt)}</dd></div>
            <div className="full"><dt>Tags</dt><dd>{Array.isArray(record?.tags) && record.tags.length ? record.tags.join(", ") : "-"}</dd></div>
            <div className="full"><dt>Body</dt><dd style={{ whiteSpace: "pre-wrap" }}>{record?.body || "-"}</dd></div>
          </dl>
        </>
      )}
    </InsuranceWorkModal>
  );
}
