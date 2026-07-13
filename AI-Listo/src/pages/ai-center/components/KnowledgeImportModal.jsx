import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  AlertTriangle,
  Check,
  FileJson,
  FileSpreadsheet,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import "./KnowledgeImportModal.css";

const CATEGORY_OPTIONS = [
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

const createEmptyItem = (category = "company_information") => ({
  id: crypto.randomUUID(),

  category,

  sourceType: "text",

  title: "",
  content: "",

  sourceUrl: null,

  status: "active",
  priority: 0,

  metadata: {},
});

export default function KnowledgeImportModal({
  open,
  saving,
  error,
  defaultCategory,
  onClose,
  onImport,
}) {
  const fileInputRef = useRef(null);

  const [items, setItems] = useState([]);

  const [parseError, setParseError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setItems([createEmptyItem(defaultCategory || "company_information")]);

    setParseError("");
  }, [open, defaultCategory]);

  const validItems = useMemo(() => {
    return items.filter(
      (item) =>
        String(item.title || "").trim().length >= 3 &&
        String(item.content || "").trim().length >= 10,
    );
  }, [items]);

  const updateItem = (id, key, value) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [key]: value,
            }
          : item,
      ),
    );
  };

  const addItem = () => {
    setItems((current) => [
      ...current,

      createEmptyItem(defaultCategory || "company_information"),
    ]);
  };

  const removeItem = (id) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const parseCsvLine = (line) => {
    const values = [];
    let current = "";
    let quoted = false;

    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];

      if (character === '"') {
        if (quoted && line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          quoted = !quoted;
        }

        continue;
      }

      if (character === "," && !quoted) {
        values.push(current.trim());

        current = "";
        continue;
      }

      current += character;
    }

    values.push(current.trim());

    return values;
  };

  const parseCsv = (text) => {
    const lines = String(text || "")
      .split(/\r?\n/)
      .filter((line) => line.trim());

    if (lines.length < 2) {
      throw new Error("CSV must contain a header and at least one item.");
    }

    const headers = parseCsvLine(lines[0]).map((header) =>
      header.trim().toLowerCase(),
    );

    const titleIndex = headers.indexOf("title");

    const contentIndex = headers.indexOf("content");

    if (titleIndex < 0 || contentIndex < 0) {
      throw new Error('CSV requires "title" and "content" columns.');
    }

    return lines.slice(1).map((line) => {
      const values = parseCsvLine(line);

      const get = (column, fallback = "") => {
        const index = headers.indexOf(column);

        return index >= 0 ? values[index] || fallback : fallback;
      };

      return {
        id: crypto.randomUUID(),

        category: get("category", defaultCategory || "company_information"),

        sourceType: get("sourcetype", get("source_type", "text")),

        title: get("title"),

        content: get("content"),

        sourceUrl: get("sourceurl", get("source_url", "")) || null,

        status: get("status", "active"),

        priority: Number(get("priority", "0")),

        metadata: {},
      };
    });
  };

  const parseJson = (text) => {
    const parsed = JSON.parse(text);

    const sourceItems = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.items)
        ? parsed.items
        : [];

    if (sourceItems.length === 0) {
      throw new Error("JSON must contain an array of knowledge items.");
    }

    return sourceItems.map((item) => ({
      id: crypto.randomUUID(),

      category: item.category || defaultCategory || "company_information",

      sourceType: item.sourceType || item.source_type || "text",

      title: item.title || "",

      content: item.content || "",

      sourceUrl: item.sourceUrl || item.source_url || null,

      status: item.status || "active",

      priority: Number(item.priority || 0),

      metadata:
        item.metadata && typeof item.metadata === "object" ? item.metadata : {},
    }));
  };

  const readFile = async (file) => {
    setParseError("");

    try {
      const text = await file.text();

      const lowerName = file.name.toLowerCase();

      let parsedItems = [];

      if (lowerName.endsWith(".json")) {
        parsedItems = parseJson(text);
      } else if (lowerName.endsWith(".csv")) {
        parsedItems = parseCsv(text);
      } else {
        throw new Error("Only JSON and CSV files are supported.");
      }

      if (parsedItems.length > 500) {
        throw new Error("Maximum 500 items per import.");
      }

      setItems(parsedItems);
    } catch (fileError) {
      console.error("PARSE KNOWLEDGE FILE FAILED:", fileError);

      setParseError(fileError?.message || "Unable to read this file.");
    }
  };

  const submit = async (event) => {
    event.preventDefault();

    if (validItems.length === 0 || saving) {
      return;
    }

    await onImport(
      validItems.map(({ id, ...item }) => ({
        ...item,

        title: String(item.title || "").trim(),

        content: String(item.content || "").trim(),

        priority: Number(item.priority || 0),
      })),
    );
  };

  if (!open) {
    return null;
  }

  return (
    <div className="cx-knowledge-import-backdrop" onMouseDown={onClose}>
      <div
        className="cx-knowledge-import-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="cx-knowledge-import-head">
          <div>
            <span>
              <Upload size={22} />
            </span>

            <div>
              <h2>Import Knowledge</h2>

              <p>
                Import multiple knowledge items from CSV, JSON, or manual entry.
              </p>
            </div>
          </div>

          <button type="button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={submit}>
          {(error || parseError) && (
            <div className="cx-knowledge-import-error">
              <AlertTriangle size={17} />

              {error || parseError}
            </div>
          )}

          <div className="cx-knowledge-import-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,application/json,text/csv"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (file) {
                  readFile(file);
                }

                event.target.value = "";
              }}
            />

            <button type="button" onClick={() => fileInputRef.current?.click()}>
              <FileSpreadsheet size={17} />
              Import CSV
            </button>

            <button type="button" onClick={() => fileInputRef.current?.click()}>
              <FileJson size={17} />
              Import JSON
            </button>

            <button type="button" onClick={addItem}>
              <Plus size={17} />
              Add Item
            </button>

            <span>
              {validItems.length} valid of {items.length}
            </span>
          </div>

          <div className="cx-knowledge-import-list">
            {items.map((item, index) => (
              <article key={item.id} className="cx-knowledge-import-row">
                <div className="cx-knowledge-import-row-head">
                  <strong>Item {index + 1}</strong>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    aria-label="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="cx-knowledge-import-grid">
                  <label>
                    Category
                    <select
                      value={item.category}
                      onChange={(event) =>
                        updateItem(item.id, "category", event.target.value)
                      }
                    >
                      {CATEGORY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Priority
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.priority}
                      onChange={(event) =>
                        updateItem(item.id, "priority", event.target.value)
                      }
                    />
                  </label>

                  <label className="full">
                    Title
                    <input
                      value={item.title}
                      onChange={(event) =>
                        updateItem(item.id, "title", event.target.value)
                      }
                      placeholder="Knowledge title"
                      maxLength={255}
                    />
                  </label>

                  <label className="full">
                    Content
                    <textarea
                      rows={5}
                      value={item.content}
                      onChange={(event) =>
                        updateItem(item.id, "content", event.target.value)
                      }
                      placeholder="Knowledge content..."
                      maxLength={20000}
                    />
                  </label>
                </div>
              </article>
            ))}
          </div>

          <footer className="cx-knowledge-import-foot">
            <div>
              {validItems.length > 0 ? (
                <span className="ready">
                  <Check size={16} />
                  {validItems.length} items ready to import
                </span>
              ) : (
                <span>Add at least one valid knowledge item.</span>
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
              disabled={saving || validItems.length === 0}
            >
              <Save size={16} />

              {saving ? "Importing..." : `Import ${validItems.length} Items`}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
