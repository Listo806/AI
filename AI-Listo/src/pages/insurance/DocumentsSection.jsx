import React, { useEffect, useRef, useState } from "react";
import {
  RefreshCw,
  UploadCloud,
  Download,
  Trash2,
  FileText,
  Search,
} from "lucide-react";
import insuranceApi from "../../api/insuranceApi";
import PolicyPicker from "./PolicyPicker";

// Documents tab: a team-scoped library of files (policy PDFs, claim evidence,
// client paperwork). Files live in S3; this lists metadata only and downloads
// through short-lived signed links, so a private bucket keeps documents
// inaccessible without a signature. Access is account-isolated on the server.
const DOC_TYPES = ["Policy", "Claim", "Quote", "ID", "Invoice", "Other"];

function fmtSize(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function fmtDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-US");
}

export default function DocumentsSection() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("Policy");
  const [policy, setPolicy] = useState(null);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const fileInputRef = useRef(null);

  const load = async (searchTerm = search) => {
    try {
      const res = await insuranceApi.listDocuments({
        search: searchTerm || undefined,
        limit: 100,
      });
      setDocs(res?.data || []);
      setError("");
    } catch {
      setError("Could not load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setDocType("Policy");
    setPolicy(null);
    setNotes("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const upload = async () => {
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (title.trim()) fd.append("title", title.trim());
      if (docType) fd.append("docType", docType);
      if (policy?.id) fd.append("policyId", policy.id);
      if (notes.trim()) fd.append("notes", notes.trim());
      await insuranceApi.uploadDocument(fd);
      resetForm();
      await load();
    } catch (e) {
      setError(e?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const download = async (doc) => {
    setBusyId(doc.id);
    // Open the tab synchronously on the click so it is tied to the user gesture
    // (avoids popup blockers), then point it at the signed URL once it arrives.
    const win = window.open("about:blank", "_blank");
    try {
      const res = await insuranceApi.getDocumentLink(doc.id);
      if (res?.url) {
        if (win) win.location.href = res.url;
        else window.open(res.url, "_blank", "noopener");
      } else if (win) {
        win.close();
      }
    } catch (e) {
      if (win) win.close();
      setError(e?.message || "Could not open document.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (doc) => {
    if (!window.confirm(`Delete "${doc.title || doc.fileName}"? This cannot be undone.`)) {
      return;
    }
    setBusyId(doc.id);
    try {
      await insuranceApi.deleteDocument(doc.id);
      await load();
    } catch (e) {
      setError(e?.message || "Delete failed.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="insurance-ws-policies">
      <div className="insurance-ws-section-head">
        <div>
          <h2>Documents</h2>
          <p>Store and share policy, claim and client files. Private to your account.</p>
        </div>
        <button className="insurance-ws-icon-btn" onClick={() => load()} title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      {error && <div style={ST.error}>{error}</div>}

      {/* Upload card */}
      <div style={ST.uploadCard}>
        <div style={ST.uploadRow}>
          <label style={ST.fileLabel}>
            <UploadCloud size={16} />
            <span>{file ? file.name : "Choose file"}</span>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: "none" }}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <input
            style={ST.input}
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select style={ST.select} value={docType} onChange={(e) => setDocType(e.target.value)}>
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div style={ST.uploadRow}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <PolicyPicker value={policy} onChange={setPolicy} />
          </div>
          <input
            style={{ ...ST.input, flex: 1 }}
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button style={ST.uploadBtn} disabled={uploading || !file} onClick={upload}>
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
        <small style={ST.hint}>PDF, Word, Excel, CSV, text or images. Up to 20MB.</small>
      </div>

      {/* Search */}
      <div style={ST.searchWrap}>
        <Search size={14} style={{ color: "#94a3b8" }} />
        <input
          style={ST.searchInput}
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(search)}
        />
        <button style={ST.searchBtn} onClick={() => load(search)}>Search</button>
      </div>

      {/* List */}
      {loading ? (
        <p style={{ color: "#64748b", fontSize: 14 }}>Loading…</p>
      ) : docs.length === 0 ? (
        <div style={ST.empty}>
          <FileText size={22} style={{ color: "#cbd5e1" }} />
          <p>No documents yet. Upload your first file above.</p>
        </div>
      ) : (
        <div style={ST.tableWrap}>
          <table style={ST.table}>
            <thead>
              <tr>
                <th style={ST.th}>Document</th>
                <th style={ST.th}>Type</th>
                <th style={ST.th}>Policy</th>
                <th style={ST.th}>Size</th>
                <th style={ST.th}>Uploaded</th>
                <th style={{ ...ST.th, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} style={ST.tr}>
                  <td style={ST.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FileText size={16} style={{ color: "#64748b", flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={ST.docTitle}>{d.title || d.fileName}</div>
                        {d.fileName && d.title !== d.fileName && (
                          <div style={ST.docFile}>{d.fileName}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={ST.td}>{d.docType || "-"}</td>
                  <td style={ST.td}>{d.policyNumber || "-"}</td>
                  <td style={ST.td}>{fmtSize(d.size)}</td>
                  <td style={ST.td}>{fmtDate(d.createdAt)}</td>
                  <td style={{ ...ST.td, textAlign: "right", whiteSpace: "nowrap" }}>
                    <button
                      style={ST.iconAction}
                      title="Download"
                      disabled={busyId === d.id}
                      onClick={() => download(d)}
                    >
                      <Download size={16} />
                    </button>
                    <button
                      style={{ ...ST.iconAction, color: "#dc2626" }}
                      title="Delete"
                      disabled={busyId === d.id}
                      onClick={() => remove(d)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const ST = {
  error: { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px", fontSize: 13, marginBottom: 12 },
  uploadCard: { border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", padding: 16, marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 },
  uploadRow: { display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" },
  fileLabel: { display: "inline-flex", alignItems: "center", gap: 8, border: "1px dashed #cbd5e1", borderRadius: 8, padding: "9px 14px", fontSize: 14, color: "#334155", cursor: "pointer", maxWidth: 280, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" },
  input: { border: "1px solid #e5e7eb", borderRadius: 8, padding: "9px 12px", fontSize: 14, minWidth: 160 },
  select: { border: "1px solid #e5e7eb", borderRadius: 8, padding: "9px 12px", fontSize: 14, background: "#fff" },
  uploadBtn: { border: "none", background: "#0f172a", color: "#fff", borderRadius: 8, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  hint: { color: "#94a3b8", fontSize: 12 },
  searchWrap: { display: "flex", alignItems: "center", gap: 8, border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 10px", marginBottom: 14, maxWidth: 460, background: "#fff" },
  searchInput: { border: "none", outline: "none", flex: 1, fontSize: 14, background: "transparent" },
  searchBtn: { border: "1px solid #e5e7eb", background: "#f8fafc", borderRadius: 6, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#334155" },
  empty: { border: "1px dashed #e5e7eb", borderRadius: 12, padding: "36px 16px", textAlign: "center", color: "#94a3b8", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  tableWrap: { border: "1px solid #e5e7eb", borderRadius: 12, overflowX: "auto", background: "#fff" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: { textAlign: "left", padding: "12px 14px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: ".03em", borderBottom: "1px solid #eef2f7", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "12px 14px", color: "#334155", verticalAlign: "middle" },
  docTitle: { fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 320 },
  docFile: { fontSize: 12, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 320 },
  iconAction: { border: "1px solid #e5e7eb", background: "#fff", borderRadius: 8, padding: 7, cursor: "pointer", color: "#475569", marginLeft: 6 },
};
