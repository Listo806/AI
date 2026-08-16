import React, { useRef, useState } from "react";
import InsuranceWorkModal from "../insurance/InsuranceWorkModal";
import customerServiceApi from "../../api/customerServiceApi";

// Ticket import: paste or upload a CSV, mapped to safe free-text fields only. The
// server always files imported tickets under the caller's own account and ignores
// any id/team column, so an import can never cross accounts. Shows a per-row result.
const COLUMNS = ["subject", "customerName", "channel", "category", "priority", "status", "description"];
const HEADER_ALIASES = {
  subject: "subject",
  customer: "customerName",
  "customer name": "customerName",
  customername: "customerName",
  channel: "channel",
  category: "category",
  priority: "priority",
  status: "status",
  description: "description",
};

// Minimal CSV parser handling quoted fields and commas/newlines inside quotes.
function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ""));
}

function rowsToTickets(csvRows) {
  if (csvRows.length === 0) return [];
  const header = csvRows[0].map((h) => String(h).trim().toLowerCase());
  const map = header.map((h) => HEADER_ALIASES[h] || null);
  return csvRows.slice(1).map((cols) => {
    const t = {};
    map.forEach((key, i) => { if (key) t[key] = String(cols[i] ?? "").trim(); });
    return t;
  });
}

export default function CsImportModal({ open, onClose, onDone }) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const parse = (raw) => {
    setError(""); setResult(null);
    try {
      const tickets = rowsToTickets(parseCsv(raw));
      setPreview(tickets);
      if (tickets.length === 0) setError("No rows found. Include a header row with a Subject column.");
    } catch {
      setError("Could not parse the CSV.");
      setPreview([]);
    }
  };

  const onText = (e) => { setText(e.target.value); parse(e.target.value); };
  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { const raw = String(reader.result || ""); setText(raw); parse(raw); };
    reader.readAsText(file);
  };

  const doImport = async () => {
    if (preview.length === 0) { setError("Nothing to import."); return; }
    setImporting(true); setError("");
    try {
      const res = await customerServiceApi.importTickets(preview);
      setResult(res);
      onDone?.();
    } catch (e) {
      setError(e?.message || "Import failed.");
    } finally {
      setImporting(false);
    }
  };

  const footer = (
    <>
      <button type="button" className="iw-btn" onClick={onClose} disabled={importing}>Close</button>
      <button type="button" className="iw-btn primary" onClick={doImport} disabled={importing || preview.length === 0}>
        {importing ? "Importing…" : `Import ${preview.length || ""} ticket${preview.length === 1 ? "" : "s"}`}
      </button>
    </>
  );

  return (
    <InsuranceWorkModal open={open} title="Import Tickets" subtitle="CSV with a header row" onClose={onClose} footer={footer}>
      {error && <p className="iw-error">{error}</p>}
      <p className="iw-hint">
        Columns: Subject (required), Customer, Channel, Category, Priority, Status, Description. Imported tickets are
        filed under your account only.
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <label style={ST.fileBtn}>
          Upload CSV
          <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={onFile} />
        </label>
      </div>
      <textarea
        style={ST.textarea}
        rows={7}
        value={text}
        onChange={onText}
        placeholder={"Subject,Customer,Channel,Priority\nLogin issue,Acme Co,Email,High"}
      />

      {preview.length > 0 && !result && (
        <div style={ST.previewBox}>
          <b>{preview.length}</b> row{preview.length === 1 ? "" : "s"} ready. First few:
          <ul style={ST.list}>
            {preview.slice(0, 5).map((t, i) => (
              <li key={i}>{t.subject || <em style={{ color: "#dc2626" }}>missing subject</em>} {t.customerName ? `— ${t.customerName}` : ""}</li>
            ))}
          </ul>
        </div>
      )}

      {result && (
        <div style={ST.resultBox}>
          <p><b>{result.created}</b> created · <b>{result.skipped}</b> skipped (duplicate) · <b>{result.errors?.length || 0}</b> error(s)</p>
          {result.errors && result.errors.length > 0 && (
            <ul style={ST.list}>
              {result.errors.slice(0, 8).map((e, i) => (<li key={i} style={{ color: "#b91c1c" }}>Row {e.row}: {e.error}</li>))}
            </ul>
          )}
        </div>
      )}
    </InsuranceWorkModal>
  );
}

const ST = {
  fileBtn: { display: "inline-flex", alignItems: "center", gap: 6, border: "1px dashed #cbd5e1", borderRadius: 8, padding: "8px 14px", fontSize: 13, color: "#334155", cursor: "pointer" },
  textarea: { width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", fontSize: 13, fontFamily: "monospace", resize: "vertical" },
  previewBox: { marginTop: 10, fontSize: 13, color: "#334155" },
  resultBox: { marginTop: 12, fontSize: 13, color: "#0f172a", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 },
  list: { margin: "6px 0 0", paddingLeft: 18, fontSize: 12.5 },
};
