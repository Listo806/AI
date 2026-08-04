import React, { useEffect, useMemo, useState } from "react";

import { useTranslation } from "react-i18next";

import { BookOpen, Check, Save, X } from "lucide-react";

import "./KnowledgeItemModal.css";

const CATEGORIES = [
  {
    value: "company_information",
    label: "Company Information",
    labelKey: "aiCenter.knowledgeItemModal.categoryCompanyInformation",
  },
  {
    value: "office_hours",
    label: "Office Hours & Availability",
    labelKey: "aiCenter.knowledgeItemModal.categoryOfficeHours",
  },
  {
    value: "service_areas",
    label: "Service Areas",
    labelKey: "aiCenter.knowledgeItemModal.categoryServiceAreas",
  },
  {
    value: "property_knowledge",
    label: "Property Knowledge",
    labelKey: "aiCenter.knowledgeItemModal.categoryPropertyKnowledge",
  },
  {
    value: "sales_scripts",
    label: "Sales Scripts & Templates",
    labelKey: "aiCenter.knowledgeItemModal.categorySalesScripts",
  },
  {
    value: "financing_partners",
    label: "Financing & Partners",
    labelKey: "aiCenter.knowledgeItemModal.categoryFinancingPartners",
  },
  {
    value: "faqs",
    label: "FAQs",
    labelKey: "aiCenter.knowledgeItemModal.categoryFaqs",
  },
  {
    value: "policies_processes",
    label: "Policies & Processes",
    labelKey: "aiCenter.knowledgeItemModal.categoryPoliciesProcesses",
  },
];

const SOURCE_TYPES = [
  {
    value: "text",
    label: "Text",
    labelKey: "aiCenter.knowledgeItemModal.sourceTypeText",
  },
  {
    value: "qa",
    label: "Question & Answer",
    labelKey: "aiCenter.knowledgeItemModal.sourceTypeQa",
  },
  {
    value: "website",
    label: "Website",
    labelKey: "aiCenter.knowledgeItemModal.sourceTypeWebsite",
  },
  {
    value: "document",
    label: "Document",
    labelKey: "aiCenter.knowledgeItemModal.sourceTypeDocument",
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
  const { t } = useTranslation();

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
  const isQuestionAnswer = form.sourceType === "qa";

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
              <h2>
                {editing
                  ? t("aiCenter.knowledgeItemModal.editKnowledge", "Edit Knowledge")
                  : t("aiCenter.knowledgeItemModal.addKnowledge", "Add Knowledge")}
              </h2>

              <p>
                {t(
                  "aiCenter.knowledgeItemModal.subtitle",
                  "Add information your AI Agent can use when responding.",
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t("aiCenter.knowledgeItemModal.closeAria", "Close")}
          >
            <X size={20} />
          </button>
        </header>

        <form onSubmit={submit}>
          {error && <div className="cx-knowledge-modal-error">{error}</div>}

          <div className="cx-knowledge-form-grid">
            <label>
              {t("aiCenter.knowledgeItemModal.categoryLabel", "Category")}
              <select
                value={form.category}
                onChange={(event) => update("category", event.target.value)}
              >
                {CATEGORIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey, option.label)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {t("aiCenter.knowledgeItemModal.sourceTypeLabel", "Source type")}
              <select
                value={form.sourceType}
                onChange={(event) => update("sourceType", event.target.value)}
              >
                {SOURCE_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey, option.label)}
                  </option>
                ))}
              </select>
            </label>

            <label className="full">
              {isQuestionAnswer
                ? t("aiCenter.knowledgeItemModal.questionLabel", "Question")
                : t("aiCenter.knowledgeItemModal.titleLabel", "Title")}
              <input
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
                placeholder={
                  isQuestionAnswer
                    ? t(
                        "aiCenter.knowledgeItemModal.questionPlaceholder",
                        "Example: What areas do you serve?",
                      )
                    : t(
                        "aiCenter.knowledgeItemModal.titlePlaceholder",
                        "Example: About our company",
                      )
                }
                maxLength={255}
              />
            </label>

            <label className="full">
              {isQuestionAnswer
                ? t("aiCenter.knowledgeItemModal.answerLabel", "Answer")
                : t("aiCenter.knowledgeItemModal.contentLabel", "Content")}
              <textarea
                rows={10}
                value={form.content}
                onChange={(event) => update("content", event.target.value)}
                placeholder={
                  isQuestionAnswer
                    ? t(
                        "aiCenter.knowledgeItemModal.answerPlaceholder",
                        "Enter the answer your AI Agent should provide...",
                      )
                    : t(
                        "aiCenter.knowledgeItemModal.contentPlaceholder",
                        "Enter the information your AI Agent should know...",
                      )
                }
                maxLength={20000}
              />
              <small>{String(form.content || "").length} / 20,000</small>
            </label>

            {(form.sourceType === "website" ||
              form.sourceType === "document") && (
              <label className="full">
                {t("aiCenter.knowledgeItemModal.sourceUrlLabel", "Source URL")}
                <input
                  value={form.sourceUrl}
                  onChange={(event) => update("sourceUrl", event.target.value)}
                  placeholder="https://..."
                />
              </label>
            )}

            <label>
              {t("aiCenter.knowledgeItemModal.statusLabel", "Status")}
              <select
                value={form.status}
                onChange={(event) => update("status", event.target.value)}
              >
                <option value="active">
                  {t("aiCenter.knowledgeItemModal.statusActive", "Active")}
                </option>

                <option value="inactive">
                  {t("aiCenter.knowledgeItemModal.statusInactive", "Inactive")}
                </option>

                <option value="needs_review">
                  {t(
                    "aiCenter.knowledgeItemModal.statusNeedsReview",
                    "Needs Review",
                  )}
                </option>
              </select>
            </label>

            <label>
              {t("aiCenter.knowledgeItemModal.priorityLabel", "Priority")}
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
                  {t(
                    "aiCenter.knowledgeItemModal.readyMessage",
                    "Knowledge item is ready",
                  )}
                </span>
              ) : (
                <span>
                  {t(
                    "aiCenter.knowledgeItemModal.validationMessage",
                    "Title must have 3 characters and content at least 10.",
                  )}
                </span>
              )}
            </div>

            <button
              type="button"
              className="secondary"
              onClick={onClose}
              disabled={saving}
            >
              {t("aiCenter.knowledgeItemModal.cancel", "Cancel")}
            </button>

            <button
              type="submit"
              className="primary"
              disabled={!canSave || saving}
            >
              <Save size={16} />

              {saving
                ? t("aiCenter.knowledgeItemModal.saving", "Saving...")
                : editing
                  ? t("aiCenter.knowledgeItemModal.saveChanges", "Save Changes")
                  : t("aiCenter.knowledgeItemModal.addKnowledge", "Add Knowledge")}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
