import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  RefreshCw,
  UploadCloud,
  Download,
  Trash2,
  FileText,
  Search,
} from "lucide-react";
import financialApi from "../../api/financialApi";
import FinancialClientPicker from "./FinancialClientPicker";
import FinancialAccountPicker from "./FinancialAccountPicker";

// Documents tab: a team-scoped library of client and account files. Files live in a
// private S3 bucket; this lists metadata only and downloads through short-lived
// signed links, so a document is unreachable without a signature. All access is
// account-isolated on the server. Mirrors the Insurance documents design.
const DOC_TYPES = [
  "Statement",
  "Application",
  "Agreement",
  "KYC / ID",
  "Tax",
  "Report",
  "Other",
];

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

export default function FinancialDocumentsSection() {
  const { t } = useTranslation();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("Statement");
  const [client, setClient] = useState(null);
  const [account, setAccount] = useState(null);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const fileInputRef = useRef(null);

  const load = async (searchTerm = search) => {
    try {
      const res = await financialApi.listDocuments({
        search: searchTerm || undefined,
        limit: 100,
      });
      setDocs(res?.data || []);
      setError("");
    } catch {
      setError(t("financialWorkspace.documents.loadError"));
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
    setDocType("Statement");
    setClient(null);
    setAccount(null);
    setNotes("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const upload = async () => {
    if (!file) {
      setError(t("financialWorkspace.documents.chooseFileError"));
      return;
    }
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (title.trim()) fd.append("title", title.trim());
      if (docType) fd.append("docType", docType);
      if (client?.id) fd.append("clientId", client.id);
      if (account?.id) fd.append("accountId", account.id);
      if (notes.trim()) fd.append("notes", notes.trim());
      await financialApi.uploadDocument(fd);
      resetForm();
      await load();
    } catch (e) {
      setError(e?.message || t("financialWorkspace.documents.uploadFailed"));
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
      const res = await financialApi.getDocumentLink(doc.id);
      if (res?.url) {
        if (win) win.location.href = res.url;
        else window.open(res.url, "_blank", "noopener");
      } else if (win) {
        win.close();
      }
    } catch (e) {
      if (win) win.close();
      setError(e?.message || t("financialWorkspace.documents.openFailed"));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (doc) => {
    if (!window.confirm(t("financialWorkspace.documents.deleteConfirm", { name: doc.title || doc.fileName }))) {
      return;
    }
    setBusyId(doc.id);
    try {
      await financialApi.deleteDocument(doc.id);
      await load();
    } catch (e) {
      setError(e?.message || t("financialWorkspace.documents.deleteFailed"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="fsw-documents">
      <div className="fsw-section-title">
        <div>
          <h2>{t("financialWorkspace.tabs.documents")}</h2>
          <p>{t("financialWorkspace.documents.subtitle")}</p>
        </div>
        <button className="fsw-reset" onClick={() => load()} title={t("financialWorkspace.actions.refresh")}>
          <RefreshCw size={16} />
        </button>
      </div>

      {error && <div style={ST.error}>{error}</div>}

      {/* Upload card */}
      <div className="fsw-doc-mobile-upload-card" style={ST.uploadCard}>
        <div className="fsw-doc-mobile-upload-row" style={ST.uploadRow}>
          <label className="fsw-doc-mobile-file-label" style={ST.fileLabel}>
            <UploadCloud size={16} />
            <span>{file ? file.name : t("financialWorkspace.documents.chooseFile")}</span>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: "none" }}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <input
            className="fsw-doc-mobile-input" style={ST.input}
            placeholder={t("financialWorkspace.documents.titleOptional")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select className="fsw-doc-mobile-select" style={ST.select} value={docType} onChange={(e) => setDocType(e.target.value)}>
            {DOC_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`financialWorkspace.documents.types.${type.toLowerCase().replaceAll(" / ", "_").replaceAll(" ", "_")}`, { defaultValue: type })}
              </option>
            ))}
          </select>
        </div>
        <div className="fsw-doc-mobile-upload-row" style={ST.uploadRow}>
          <div className="fsw-doc-mobile-picker" style={{ flex: 1, minWidth: 200 }}>
            <FinancialClientPicker value={client} onChange={setClient} />
          </div>
          <div className="fsw-doc-mobile-picker" style={{ flex: 1, minWidth: 200 }}>
            <FinancialAccountPicker value={account} onChange={setAccount} />
          </div>
        </div>
        <div className="fsw-doc-mobile-upload-row" style={ST.uploadRow}>
          <input
            className="fsw-doc-mobile-input fsw-doc-mobile-notes" style={{ ...ST.input, flex: 1 }}
            placeholder={t("financialWorkspace.documents.notesOptional")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button className="fsw-doc-mobile-upload-btn" style={ST.uploadBtn} disabled={uploading || !file} onClick={upload}>
            {uploading ? t("financialWorkspace.documents.uploading") : t("financialWorkspace.documents.upload")}
          </button>
        </div>
        <small className="fsw-doc-mobile-hint" style={ST.hint}>{t("financialWorkspace.documents.hint")}</small>
      </div>

      {/* Search */}
      <div className="fsw-doc-mobile-search" style={ST.searchWrap}>
        <Search size={14} style={{ color: "#94a3b8" }} />
        <input
          className="fsw-doc-mobile-search-input" style={ST.searchInput}
          placeholder={t("financialWorkspace.documents.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(search)}
        />
        <button className="fsw-doc-mobile-search-btn" style={ST.searchBtn} onClick={() => load(search)}>{t("common.search")}</button>
      </div>

      {/* List */}
      {loading ? (
        <p style={{ color: "#64748b", fontSize: 14 }}>{t("common.loading")}</p>
      ) : docs.length === 0 ? (
        <div className="fsw-doc-mobile-empty" style={ST.empty}>
          <FileText size={22} style={{ color: "#cbd5e1" }} />
          <p>{t("financialWorkspace.documents.empty")}</p>
        </div>
      ) : (
        <div className="fsw-doc-mobile-table-wrap" style={ST.tableWrap}>
          <table className="fsw-doc-mobile-table" style={ST.table}>
            <thead>
              <tr>
                <th className="fsw-doc-mobile-th" style={ST.th}>{t("financialWorkspace.documents.document")}</th>
                <th className="fsw-doc-mobile-th" style={ST.th}>{t("financialWorkspace.documents.type")}</th>
                <th className="fsw-doc-mobile-th" style={ST.th}>{t("financialWorkspace.tabs.clients")}</th>
                <th className="fsw-doc-mobile-th" style={ST.th}>{t("financialWorkspace.tabs.accounts")}</th>
                <th className="fsw-doc-mobile-th" style={ST.th}>{t("financialWorkspace.documents.size")}</th>
                <th className="fsw-doc-mobile-th" style={ST.th}>{t("financialWorkspace.documents.uploaded")}</th>
                <th style={{ ...ST.th, textAlign: "right" }}>{t("financialWorkspace.table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} className="fsw-doc-mobile-tr" style={ST.tr}>
                  <td className="fsw-doc-mobile-td" style={ST.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FileText size={16} style={{ color: "#64748b", flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div className="fsw-doc-mobile-title" style={ST.docTitle}>{d.title || d.fileName}</div>
                        {d.fileName && d.title !== d.fileName && (
                          <div className="fsw-doc-mobile-file" style={ST.docFile}>{d.fileName}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="fsw-doc-mobile-td" style={ST.td}>{d.docType || "-"}</td>
                  <td className="fsw-doc-mobile-td" style={ST.td}>{d.clientName || "-"}</td>
                  <td className="fsw-doc-mobile-td" style={ST.td}>{d.accountNumber || "-"}</td>
                  <td className="fsw-doc-mobile-td" style={ST.td}>{fmtSize(d.size)}</td>
                  <td className="fsw-doc-mobile-td" style={ST.td}>{fmtDate(d.createdAt)}</td>
                  <td style={{ ...ST.td, textAlign: "right", whiteSpace: "nowrap" }}>
                    <button
                      className="fsw-doc-mobile-icon-action" style={ST.iconAction}
                      title={t("financialWorkspace.documents.download")}
                      disabled={busyId === d.id}
                      onClick={() => download(d)}
                    >
                      <Download size={16} />
                    </button>
                    <button
                      className="fsw-doc-mobile-icon-action danger" style={{ ...ST.iconAction, color: "#dc2626" }}
                      title={t("common.delete")}
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
