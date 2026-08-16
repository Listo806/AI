import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Clock3 } from "lucide-react";
import projectsApi from "../../api/projectsApi";
import { DetailSkeleton } from "./PjwSkeleton";
import PjwModal from "./PjwModal";
import { fmtDate, fmtDateTime, minutesToText, cap } from "./projectFormat";

const EMPTY = {
  title: "",
  description: "",
  projectId: "",
  assignedTo: "",
  status: "pending",
  priority: "medium",
  taskType: "task",
  dueDate: "",
  estimatedMinutes: "",
  progress: 0,
  labels: "",
};

const dateInput = (iso) => (iso ? String(iso).slice(0, 10) : "");

export default function PjwTaskModal({
  open,
  mode: initialMode,
  taskId,
  ctx,
  projectOptions = [],
  defaultProjectId = "",
  onClose,
  onSaved,
}) {
  const [mode, setMode] = useState(initialMode || "create");
  const [form, setForm] = useState(EMPTY);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [logMinutes, setLogMinutes] = useState("");
  const [logNote, setLogNote] = useState("");
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    setMode(initialMode || "create");
  }, [initialMode, taskId]);

  useEffect(() => {
    if (!open) return undefined;
    let alive = true;
    setError("");
    setLogMinutes("");
    setLogNote("");
    if (!taskId) {
      setForm({ ...EMPTY, projectId: defaultProjectId || "" });
      setDetail(null);
      return undefined;
    }
    setLoading(true);
    projectsApi
      .getTask(taskId)
      .then((t) => {
        if (!alive) return;
        setDetail(t);
        setForm({
          title: t.title || "",
          description: t.description || "",
          projectId: t.projectId || "",
          assignedTo: t.assignedTo || "",
          status: t.status || "pending",
          priority: t.priority || "medium",
          taskType: t.taskType || "task",
          dueDate: dateInput(t.dueDate),
          estimatedMinutes: t.estimatedMinutes || "",
          progress: t.progress || 0,
          labels: (t.labels || []).join(", "),
        });
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setError("Could not load this task.");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [open, taskId, defaultProjectId]);

  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.title.trim()) {
      setError("Task title is required.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      title: form.title.trim(),
      description: form.description || null,
      projectId: form.projectId || null,
      assignedTo: form.assignedTo || null,
      status: form.status,
      priority: form.priority,
      taskType: form.taskType || "task",
      dueDate: form.dueDate || null,
      estimatedMinutes: form.estimatedMinutes === "" ? 0 : Number(form.estimatedMinutes),
      progress: Number(form.progress) || 0,
      labels: form.labels
        ? form.labels.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
    };
    try {
      if (taskId) await projectsApi.updateTask(taskId, payload);
      else await projectsApi.createTask(payload);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Could not save the task.");
    }
  };

  const remove = async () => {
    if (!taskId) return;
    if (!window.confirm("Delete this task?")) return;
    setSaving(true);
    try {
      await projectsApi.deleteTask(taskId);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Could not delete the task.");
    }
  };

  const submitLog = async () => {
    const minutes = Number(logMinutes);
    if (!(minutes > 0)) {
      setError("Enter minutes greater than zero.");
      return;
    }
    setLogging(true);
    setError("");
    try {
      await projectsApi.logTime(taskId, { minutes, note: logNote || null });
      // refresh detail so logged time updates
      const t = await projectsApi.getTask(taskId);
      setDetail(t);
      setLogMinutes("");
      setLogNote("");
      setLogging(false);
      onSaved?.();
    } catch (e) {
      setLogging(false);
      setError(e?.message || "Could not log time.");
    }
  };

  const members = ctx?.members || [];
  const isView = mode === "view";
  const title = !taskId ? "New Task" : isView ? detail?.title || "Task" : "Edit Task";

  const footer = isView ? (
    <>
      <button type="button" className="pjw-danger" onClick={remove} disabled={saving}>
        <Trash2 size={15} /> Delete
      </button>
      <div className="pjw-inline-actions">
        <button type="button" onClick={() => onClose?.()}>
          Close
        </button>
        <button type="button" className="pjw-primary" onClick={() => setMode("edit")}>
          <Pencil size={15} /> Edit
        </button>
      </div>
    </>
  ) : (
    <>
      {taskId ? (
        <button type="button" className="pjw-danger" onClick={remove} disabled={saving}>
          <Trash2 size={15} /> Delete
        </button>
      ) : (
        <span />
      )}
      <div className="pjw-inline-actions">
        <button type="button" onClick={() => onClose?.()} disabled={saving}>
          Cancel
        </button>
        <button type="button" className="pjw-primary" onClick={save} disabled={saving}>
          <Plus size={15} /> {saving ? "Saving…" : taskId ? "Save Changes" : "Create Task"}
        </button>
      </div>
    </>
  );

  return (
    <PjwModal open={open} title={title} subtitle={detail?.projectName || ""} onClose={onClose} footer={footer} wide>
      {loading ? (
        <DetailSkeleton />
      ) : isView && detail ? (
        <>
          {error ? <div className="pjw-form-error">{error}</div> : null}
          <div className="pjw-detail-grid">
            <div className="pjw-kv"><span>Project</span><strong>{detail.projectName || "—"}</strong></div>
            <div className="pjw-kv"><span>Assignee</span><strong>{detail.assigneeName || "Unassigned"}</strong></div>
            <div className="pjw-kv"><span>Status</span><strong>{detail.statusLabel}</strong></div>
            <div className="pjw-kv"><span>Priority</span><strong>{cap(detail.priority)}</strong></div>
            <div className="pjw-kv"><span>Due Date</span><strong>{fmtDate(detail.dueDate)}</strong></div>
            <div className="pjw-kv"><span>Progress</span><strong>{detail.progress}%</strong></div>
            <div className="pjw-kv"><span>Logged</span><strong>{minutesToText(detail.loggedMinutes)}</strong></div>
            <div className="pjw-kv"><span>Estimated</span><strong>{minutesToText(detail.estimatedMinutes)}</strong></div>
            <div className="pjw-kv"><span>Type</span><strong>{cap(detail.taskType)}</strong></div>
            <div className="pjw-kv"><span>Updated</span><strong>{fmtDateTime(detail.updatedAt)}</strong></div>
            {detail.labels?.length ? (
              <div className="pjw-kv" style={{ gridColumn: "1 / -1" }}>
                <span>Labels</span>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {detail.labels.map((l) => (
                    <span className="pjw-badge gray" key={l}>
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="pjw-kv" style={{ gridColumn: "1 / -1" }}>
              <span>Description</span>
              <strong style={{ fontWeight: 400 }}>{detail.description || "—"}</strong>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #eef2f6", paddingTop: 14 }}>
            <div className="pjw-kv" style={{ marginBottom: 8 }}>
              <span>
                <Clock3 size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                Log Time
              </span>
            </div>
            <div className="pjw-uploader">
              <input
                type="number"
                min="1"
                placeholder="Minutes"
                value={logMinutes}
                onChange={(e) => setLogMinutes(e.target.value)}
                style={{ width: 120 }}
              />
              <input
                placeholder="Note (optional)"
                value={logNote}
                onChange={(e) => setLogNote(e.target.value)}
                style={{ flex: 1, minWidth: 160 }}
              />
              <button type="button" className="pjw-primary" onClick={submitLog} disabled={logging}>
                {logging ? "Saving…" : "Log"}
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {error ? <div className="pjw-form-error">{error}</div> : null}
          <div className="pjw-modal-grid">
            <label className="pjw-full">
              Title
              <input value={form.title} onChange={upd("title")} placeholder="e.g. Design homepage mockup" />
            </label>
            <label>
              Project
              <select value={form.projectId} onChange={upd("projectId")}>
                <option value="">No project</option>
                {projectOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Assignee
              <select value={form.assignedTo} onChange={upd("assignedTo")}>
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select value={form.status} onChange={upd("status")}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="review">In Review</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label>
              Priority
              <select value={form.priority} onChange={upd("priority")}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
            <label>
              Due Date
              <input type="date" value={form.dueDate} onChange={upd("dueDate")} />
            </label>
            <label>
              Progress (%)
              <input type="number" min="0" max="100" value={form.progress} onChange={upd("progress")} />
            </label>
            <label>
              Estimated (minutes)
              <input type="number" min="0" value={form.estimatedMinutes} onChange={upd("estimatedMinutes")} />
            </label>
            <label>
              Type
              <input value={form.taskType} onChange={upd("taskType")} placeholder="task" />
            </label>
            <label className="pjw-full">
              Labels (comma separated)
              <input value={form.labels} onChange={upd("labels")} placeholder="design, frontend" />
            </label>
            <label className="pjw-full">
              Description
              <textarea value={form.description} onChange={upd("description")} placeholder="Details…" />
            </label>
          </div>
        </>
      )}
    </PjwModal>
  );
}
