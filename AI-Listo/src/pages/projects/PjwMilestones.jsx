import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Milestone as MilestoneIcon } from "lucide-react";
import projectsApi from "../../api/projectsApi";
import PjwModal from "./PjwModal";
import { fmtDate, cap } from "./projectFormat";

const TONE = { pending: "gray", in_progress: "blue", completed: "green" };
const dateInput = (iso) => (iso ? String(iso).slice(0, 10) : "");
const EMPTY = { title: "", projectId: "", status: "pending", dueDate: "", sortOrder: 0, description: "" };

function MilestoneModal({ open, record, projectOptions, defaultProjectId, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    if (record) {
      setForm({
        title: record.title || "",
        projectId: record.projectId || "",
        status: record.status || "pending",
        dueDate: dateInput(record.dueDate),
        sortOrder: record.sortOrder || 0,
        description: record.description || "",
      });
    } else {
      setForm({ ...EMPTY, projectId: defaultProjectId || "" });
    }
  }, [open, record, defaultProjectId]);

  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.title.trim()) return setError("Title is required.");
    if (!form.projectId) return setError("Select a project.");
    setSaving(true);
    setError("");
    const payload = {
      title: form.title.trim(),
      projectId: form.projectId,
      status: form.status,
      dueDate: form.dueDate || null,
      sortOrder: Number(form.sortOrder) || 0,
      description: form.description || null,
    };
    try {
      if (record) await projectsApi.updateMilestone(record.id, payload);
      else await projectsApi.createMilestone(payload);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Could not save milestone.");
    }
    return undefined;
  };

  const footer = (
    <>
      <span />
      <div className="pjw-inline-actions">
        <button type="button" onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button type="button" className="pjw-primary" onClick={save} disabled={saving}>
          <Plus size={15} /> {saving ? "Saving…" : record ? "Save" : "Create"}
        </button>
      </div>
    </>
  );

  return (
    <PjwModal open={open} title={record ? "Edit Milestone" : "New Milestone"} onClose={onClose} footer={footer} wide>
      {error ? <div className="pjw-form-error">{error}</div> : null}
      <div className="pjw-modal-grid">
        <label className="pjw-full">
          Title
          <input value={form.title} onChange={upd("title")} placeholder="e.g. Phase 2 Complete" />
        </label>
        <label>
          Project
          <select value={form.projectId} onChange={upd("projectId")}>
            <option value="">Select a project</option>
            {projectOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={form.status} onChange={upd("status")}>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </label>
        <label>
          Due Date
          <input type="date" value={form.dueDate} onChange={upd("dueDate")} />
        </label>
        <label>
          Order
          <input type="number" min="0" value={form.sortOrder} onChange={upd("sortOrder")} />
        </label>
        <label className="pjw-full">
          Description
          <textarea value={form.description} onChange={upd("description")} />
        </label>
      </div>
    </PjwModal>
  );
}

export default function PjwMilestones({ ctx, onChanged, autoCreate, onAutoCreateDone }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projectOptions, setProjectOptions] = useState([]);
  const [project, setProject] = useState("");
  const [tick, setTick] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [nonce, setNonce] = useState(0);

  const changed = () => {
    setTick((t) => t + 1);
    onChanged?.();
  };

  useEffect(() => {
    if (autoCreate) {
      open(null);
      onAutoCreateDone?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCreate]);

  useEffect(() => {
    projectsApi.listProjects({ limit: 100 }).then((res) => setProjectOptions(res?.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    projectsApi
      .listMilestones({ project: project || undefined })
      .then((res) => {
        if (!alive) return;
        setRows(res?.data || []);
        setError("");
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setError("Could not load milestones.");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [project, tick]);

  const remove = async (id) => {
    if (!window.confirm("Delete this milestone?")) return;
    try {
      await projectsApi.deleteMilestone(id);
      changed();
    } catch (e) {
      window.alert(e?.message || "Could not delete.");
    }
  };

  const open = (record = null) => {
    setEditing(record);
    setNonce((n) => n + 1);
    setModalOpen(true);
  };

  return (
    <div className="pjw-tab-panel">
      <section className="pjw-section-head">
        <div>
          <h2>Milestones</h2>
          <p>Key checkpoints across your projects.</p>
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
          <button className="pjw-primary" onClick={() => open(null)}>
            <Plus size={15} /> New Milestone
          </button>
        </div>
      </section>

      <div className="pjw-table-wrap">
        <div className="pjw-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Milestone</th>
                <th>Project</th>
                <th>Status</th>
                <th>Due</th>
                <th>Completed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="pjw-cell-muted" style={{ textAlign: "center", padding: 30 }}>
                    Loading…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 30, color: "#b91c1c" }}>
                    {error}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="pjw-cell-muted" style={{ textAlign: "center", padding: 30 }}>
                    No milestones yet. Add a milestone to a project.
                  </td>
                </tr>
              ) : (
                rows.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <button className="pjw-project-link" onClick={() => open(m)}>
                        {m.title}
                      </button>
                    </td>
                    <td>{m.projectName}</td>
                    <td>
                      <span className={`pjw-badge ${TONE[m.status] || "gray"}`}>{cap(m.status.replace(/_/g, " "))}</span>
                    </td>
                    <td>{fmtDate(m.dueDate)}</td>
                    <td>{m.completedAt ? fmtDate(m.completedAt) : <span className="pjw-cell-muted">—</span>}</td>
                    <td>
                      <div className="pjw-row-actions">
                        <button aria-label="Edit" onClick={() => open(m)}>
                          <Pencil size={14} />
                        </button>
                        <button aria-label="Delete" onClick={() => remove(m.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <MilestoneModal
        key={nonce}
        open={modalOpen}
        record={editing}
        projectOptions={projectOptions}
        defaultProjectId={project}
        onClose={() => setModalOpen(false)}
        onSaved={changed}
      />
    </div>
  );
}
