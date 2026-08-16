import { useEffect, useRef, useState } from "react";
import { Upload, Download, Trash2, FileText, Files as FilesIcon } from "lucide-react";
import projectsApi from "../../api/projectsApi";
import { FilesSkeleton } from "./PjwSkeleton";
import { fmtRelative } from "./projectFormat";

function fmtSize(bytes) {
  const b = Number(bytes) || 0;
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${Math.round((b / (1024 * 1024)) * 10) / 10} MB`;
}

export default function PjwFiles({ ctx }) {
  const teamId = ctx?.teamId;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projectOptions, setProjectOptions] = useState([]);
  const [project, setProject] = useState("");
  const [uploading, setUploading] = useState(false);
  const [tick, setTick] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    projectsApi.listProjects({ limit: 100 }).then((res) => setProjectOptions(res?.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!teamId) return undefined;
    let alive = true;
    setLoading(true);
    projectsApi
      .listFiles({ teamId, projectId: project || undefined })
      .then((res) => {
        if (!alive) return;
        setRows(Array.isArray(res) ? res : res?.data || []);
        setError("");
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setError("Could not load files.");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [teamId, project, tick]);

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !teamId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("teamId", teamId);
      if (project) fd.append("projectId", project);
      await projectsApi.uploadFile(fd);
      setTick((t) => t + 1);
    } catch (err) {
      window.alert(err?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const download = async (id) => {
    try {
      const res = await projectsApi.getFileUrl(id, teamId);
      const url = res?.url || res;
      if (url) window.open(url, "_blank", "noopener");
    } catch (e) {
      window.alert(e?.message || "Could not open file.");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this file?")) return;
    try {
      await projectsApi.deleteFile(id, teamId);
      setTick((t) => t + 1);
    } catch (e) {
      window.alert(e?.message || "Could not delete file.");
    }
  };

  if (!ctx) return <FilesSkeleton />;

  return (
    <div className="pjw-tab-panel">
      <section className="pjw-section-head">
        <div>
          <h2>Files</h2>
          <p>Project files, stored on the same secure storage as your Team Workspace.</p>
        </div>
        <div className="pjw-section-actions">
          <select value={project} onChange={(e) => setProject(e.target.value)}>
            <option value="">All Projects</option>
            {projectOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input ref={inputRef} type="file" style={{ display: "none" }} onChange={onUpload} />
          <button className="pjw-primary" onClick={() => inputRef.current?.click()} disabled={uploading}>
            <Upload size={15} /> {uploading ? "Uploading…" : "Upload File"}
          </button>
        </div>
      </section>

      {loading ? (
        <FilesSkeleton />
      ) : error ? (
        <div className="pjw-error">{error}</div>
      ) : rows.length === 0 ? (
        <div className="pjw-empty">
          <FilesIcon size={34} />
          <b>No files yet</b>
          <span>Upload a file to attach it to this workspace{project ? " and project" : ""}.</span>
        </div>
      ) : (
        <div className="pjw-tab-panel">
          {rows.map((f) => (
            <div className="pjw-file-row" key={f.id}>
              <span className="pjw-file-icon">
                <FileText size={18} />
              </span>
              <div>
                <b title={f.originalName}>{f.originalName || f.fileName}</b>
                <small>
                  {fmtSize(f.size)} · {fmtRelative(f.createdAt)}
                </small>
              </div>
              <div className="pjw-row-actions">
                <button aria-label="Download" onClick={() => download(f.id)}>
                  <Download size={15} />
                </button>
                <button aria-label="Delete" onClick={() => remove(f.id)}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
