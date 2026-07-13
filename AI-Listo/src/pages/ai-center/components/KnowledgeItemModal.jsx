import React, { useEffect, useMemo, useState } from "react";

import { BookOpen, Check, Save, X } from "lucide-react";

import "./KnowledgeItemModal.css";

const CATEGORIES = [
  {
    value: "company_information",
    label: "Company Information",
  },
  {
    value: "office_hours",
    label: "Office Hours & Availability",
  },
  {
    value: "service_areas",
    label: "Service Areas",
  },
  {
    value: "property_knowledge",
    label: "Property Knowledge",
  },
  {
    value: "sales_scripts",
    label: "Sales Scripts & Templates",
  },
  {
    value: "financing_partners",
    label: "Financing & Partners",
  },
  {
    value: "faqs",
    label: "FAQs",
  },
  {
    value: "policies_processes",
    label: "Policies & Processes",
  },
];

const SOURCE_TYPES = [
  {
    value: "text",
    label: "Text",
  },
  {
    value: "qa",
    label: "Question & Answer",
  },
  {
    value: "website",
    label: "Website",
  },
  {
    value: "document",
    label: "Document",
  },
];

const DEFAULT_FORM = {
  category: "company_information",
  sourceType: "text",

  title: "",
  content: "",

  sourceUrl: "",

  status: "active",
  priority: 0,
};

export default function KnowledgeItemModal({
  open,
  item,
  saving,
  error,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm({
      ...DEFAULT_FORM,

      ...(item || {}),

      sourceType: item?.sourceType || "text",

      sourceUrl: item?.sourceUrl || "",
    });
  }, [open, item]);

  const editing = Boolean(item?.id);

  const canSave = useMemo(() => {
    return (
      form.category &&
      form.sourceType &&
      String(form.title || "").trim().length >= 3 &&
      String(form.content || "").trim().length >= 10
    );
  }, [form]);

  const update = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!canSave || saving) {
      return;
    }

    await onSave({
      category: form.category,

      sourceType: form.sourceType,

      title: String(form.title || "").trim(),

      content: String(form.content || "").trim(),

      sourceUrl: String(form.sourceUrl || "").trim() || null,

      status: form.status,

      priority: Number(form.priority || 0),

      metadata: item?.metadata || {},
    });
  };

  if (!open) {
    return null;
  }

  return (
    <div className="cx-knowledge-modal-backdrop" onMouseDown={onClose}>
      <div
        className="cx-knowledge-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="cx-knowledge-modal-head">
          <div>
            <span>
              <BookOpen size={22} />
            </span>

            <div>
              <h2>{editing ? "Edit Knowledge" : "Add Knowledge"}</h2>

              <p>Add information your AI Agent can use when responding.</p>
            </div>
          </div>

          <button type="button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={submit}>
          {error && <div className="cx-knowledge-modal-error">{error}</div>}

          <div className="cx-knowledge-form-grid">
            <label>
              Category
              <select
                value={form.category}
                onChange={(event) => update("category", event.target.value)}
              >
                {CATEGORIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Source type
              <select
                value={form.sourceType}
                onChange={(event) => update("sourceType", event.target.value)}
              >
                {SOURCE_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="full">
              Title
              <input
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
                placeholder="Example: About our company"
                maxLength={255}
              />
            </label>

            <label className="full">
              Content
              <textarea
                rows={10}
                value={form.content}
                onChange={(event) => update("content", event.target.value)}
                placeholder="Enter the information your AI Agent should know..."
                maxLength={20000}
              />
              <small>{String(form.content || "").length} / 20,000</small>
            </label>

            {(form.sourceType === "website" ||
              form.sourceType === "document") && (
              <label className="full">
                Source URL
                <input
                  value={form.sourceUrl}
                  onChange={(event) => update("sourceUrl", event.target.value)}
                  placeholder="https://..."
                />
              </label>
            )}

            <label>
              Status
              <select
                value={form.status}
                onChange={(event) => update("status", event.target.value)}
              >
                <option value="active">Active</option>

                <option value="inactive">Inactive</option>

                <option value="needs_review">Needs Review</option>
              </select>
            </label>

            <label>
              Priority
              <input
                type="number"
                min="0"
                max="100"
                value={form.priority}
                onChange={(event) => update("priority", event.target.value)}
              />
            </label>
          </div>

          <footer className="cx-knowledge-modal-foot">
            <div>
              {canSave ? (
                <span className="ready">
                  <Check size={16} />
                  Knowledge item is ready
                </span>
              ) : (
                <span>
                  Title must have 3 characters and content at least 10.
                </span>
              )}
            </div>

            <button
              type="button"
              className="secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary"
              disabled={!canSave || saving}
            >
              <Save size={16} />

              {saving
                ? "Saving..."
                : editing
                  ? "Save Changes"
                  : "Add Knowledge"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
