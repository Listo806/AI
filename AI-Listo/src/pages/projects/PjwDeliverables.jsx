import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import projectsApi from "../../api/projectsApi";
import PjwModal from "./PjwModal";
import { fmtDate, cap } from "./projectFormat";

const TONE = { pending: "gray", in_review: "amber", approved: "green", delivered: "blue", rejected: "red" };
const dateInput = (iso) => (iso ? String(iso).slice(0, 10) : "");
const EMPTY = { title: "", projectId: "", milestoneId: "", status: "pending", dueDate: "", description: "" };

function DeliverableModal({ open, record, projectOptions, milestones, defaultProjectId, onClose, onSaved }) {
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
        milestoneId: record.milestoneId || "",
        status: record.status || "pending",
        dueDate: dateInput(record.dueDate),
        description: record.description || "",
      });
    } else {
      setForm({ ...EMPTY, projectId: defaultProjectId || "" });
    }
  }, [open, record, defaultProjectId]);

  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const projectMilestones = useMemo(
    () => milestones.filter((m) => m.projectId === form.projectId),
    [milestones, form.projectId],
  );

  const save = async () => {
    if (!form.title.trim()) return setError("Title is required.");
    if (!form.projectId) return setError("Select a project.");
    setSaving(true);
    setError("");
    const payload = {
      title: form.title.trim(),
      projectId: form.projectId,
      milestoneId: form.milestoneId || null,
      status: form.status,
      dueDate: form.dueDate || null,
      description: form.description || null,
    };
    try {
      if (record) await projectsApi.updateDeliverable(record.id, payload);
      else await projectsApi.createDeliverable(payload);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Could not save deliverable.");
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
    <PjwModal open={open} title={record ? "Edit Deliverable" : "New Deliverable"} onClose={onClose} footer={footer} wide>
      {error ? <div className="pjw-form-error">{error}</div> : null}
      <div className="pjw-modal-grid">
        <label className="pjw-full">
          Title
          <input value={form.title} onChange={upd("title")} placeholder="e.g. Design System v1" />
        </label>
        <label>
          Project
          <select value={form.projectId} onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value, milestoneId: "" }))}>
            <option value="">Select a project</option>
            {projectOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Milestone
          <select value={form.milestoneId} onChange={upd("milestoneId")} disabled={!form.projectId}>
            <option value="">None</option>
            {projectMilestones.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={form.status} onChange={upd("status")}>
            <option value="pending">Pending</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
            <option value="delivered">Delivered</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        <label>
          Due Date
          <input type="date" value={form.dueDate} onChange={upd("dueDate")} />
        </label>
        <label className="pjw-full">
          Description
          <textarea value={form.description} onChange={upd("description")} />
        </label>
      </div>
    </PjwModal>
  );
}

export default function PjwDeliverables({ ctx, onChanged, autoCreate, onAutoCreateDone }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projectOptions, setProjectOptions] = useState([]);
  const [milestones, setMilestones] = useState([]);
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
    projectsApi.listMilestones().then((res) => setMilestones(res?.data || [])).catch(() => {});
  }, [tick]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    projectsApi
      .listDeliverables({ project: project || undefined })
      .then((res) => {
        if (!alive) return;
        setRows(res?.data || []);
        setError("");
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setError("Could not load deliverables.");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [project, tick]);

  const remove = async (id) => {
    if (!window.confirm("Delete this deliverable?")) return;
    try {
      await projectsApi.deleteDeliverable(id);
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
          <h2>Deliverables</h2>
          <p>What you hand off to the client, tracked to approval.</p>
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
            <Plus size={15} /> New Deliverable
          </button>
        </div>
      </section>

      <div className="pjw-table-wrap">
        <div className="pjw-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Deliverable</th>
                <th>Project</th>
                <th>Milestone</th>
                <th>Status</th>
                <th>Due</th>
                <th>Approved</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="pjw-cell-muted" style={{ textAlign: "center", padding: 30 }}>
                    Loading…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 30, color: "#b91c1c" }}>
                    {error}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="pjw-cell-muted" style={{ textAlign: "center", padding: 30 }}>
                    No deliverables yet. Add one to a project.
                  </td>
                </tr>
              ) : (
                rows.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <button className="pjw-project-link" onClick={() => open(d)}>
                        {d.title}
                      </button>
                    </td>
                    <td>{d.projectName}</td>
                    <td>{d.milestoneTitle || <span className="pjw-cell-muted">—</span>}</td>
                    <td>
                      <span className={`pjw-badge ${TONE[d.status] || "gray"}`}>{cap(d.status.replace(/_/g, " "))}</span>
                    </td>
                    <td>{fmtDate(d.dueDate)}</td>
                    <td>
                      {d.approvedByName ? (
                        <span className="pjw-cell-muted">{d.approvedByName}</span>
                      ) : (
                        <span className="pjw-cell-muted">—</span>
                      )}
                    </td>
                    <td>
                      <div className="pjw-row-actions">
                        <button aria-label="Edit" onClick={() => open(d)}>
                          <Pencil size={14} />
                        </button>
                        <button aria-label="Delete" onClick={() => remove(d.id)}>
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

      <DeliverableModal
        key={nonce}
        open={modalOpen}
        record={editing}
        projectOptions={projectOptions}
        milestones={milestones}
        defaultProjectId={project}
        onClose={() => setModalOpen(false)}
        onSaved={changed}
      />
    </div>
  );
}
