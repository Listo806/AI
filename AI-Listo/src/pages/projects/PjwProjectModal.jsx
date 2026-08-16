import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import projectsApi from "../../api/projectsApi";
import { DetailSkeleton } from "./PjwSkeleton";
import PjwModal from "./PjwModal";
import { money, fmtDate, cap, pct } from "./projectFormat";

const EMPTY = {
  name: "",
  contactId: "",
  managerId: "",
  priority: "medium",
  status: "planning",
  startDate: "",
  dueDate: "",
  budget: "",
  currency: "USD",
  progress: 0,
  description: "",
};

const dateInput = (iso) => (iso ? String(iso).slice(0, 10) : "");

export default function PjwProjectModal({ open, mode: initialMode, projectId, ctx, onClose, onSaved }) {
  const [mode, setMode] = useState(initialMode || "create");
  const [form, setForm] = useState(EMPTY);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMode(initialMode || "create");
  }, [initialMode, projectId]);

  useEffect(() => {
    if (!open) return undefined;
    let alive = true;
    setError("");
    if (!projectId) {
      setForm(EMPTY);
      setDetail(null);
      return undefined;
    }
    setLoading(true);
    projectsApi
      .getProject(projectId)
      .then((p) => {
        if (!alive) return;
        setDetail(p);
        setForm({
          name: p.name || "",
          contactId: p.contactId || "",
          managerId: p.managerId || "",
          priority: p.priority || "medium",
          status: p.status || "planning",
          startDate: dateInput(p.startDate),
          dueDate: dateInput(p.dueDate),
          budget: p.budget ?? "",
          currency: p.currency || "USD",
          progress: p.storedProgress ?? p.progress ?? 0,
          description: p.description || "",
        });
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setError("Could not load this project.");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [open, projectId]);

  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.name.trim()) {
      setError("Project name is required.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      name: form.name.trim(),
      contactId: form.contactId || null,
      managerId: form.managerId || null,
      priority: form.priority,
      status: form.status,
      startDate: form.startDate || null,
      dueDate: form.dueDate || null,
      budget: form.budget === "" ? null : Number(form.budget),
      currency: form.currency || "USD",
      progress: Number(form.progress) || 0,
      description: form.description || null,
    };
    try {
      if (projectId) await projectsApi.updateProject(projectId, payload);
      else await projectsApi.createProject(payload);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Could not save the project.");
    }
  };

  const remove = async () => {
    if (!projectId) return;
    if (!window.confirm("Delete this project? Tasks and time entries will be kept but unlinked.")) return;
    setSaving(true);
    try {
      await projectsApi.deleteProject(projectId);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Could not delete the project.");
    }
  };

  const clients = ctx?.clients || [];
  const members = ctx?.members || [];
  const isView = mode === "view";
  const title = !projectId ? "New Project" : isView ? detail?.name || "Project" : "Edit Project";

  const footer = isView ? (
    <>
      <button type="button" onClick={() => onClose?.()}>
        Close
      </button>
      <button type="button" className="pjw-primary" onClick={() => setMode("edit")}>
        <Pencil size={15} /> Edit
      </button>
    </>
  ) : (
    <>
      {projectId ? (
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
          <Plus size={15} /> {saving ? "Saving…" : projectId ? "Save Changes" : "Create Project"}
        </button>
      </div>
    </>
  );

  return (
    <PjwModal open={open} title={title} subtitle={!projectId ? "Create a new client delivery project." : detail?.code || ""} onClose={onClose} footer={footer} wide>
      {loading ? (
        <DetailSkeleton />
      ) : isView && detail ? (
        <div className="pjw-detail-grid">
          <div className="pjw-kv"><span>Client</span><strong>{detail.clientName || "—"}</strong></div>
          <div className="pjw-kv"><span>Project Manager</span><strong>{detail.managerName || "—"}</strong></div>
          <div className="pjw-kv"><span>Status</span><strong>{detail.statusLabel}</strong></div>
          <div className="pjw-kv"><span>Priority</span><strong>{cap(detail.priority)}</strong></div>
          <div className="pjw-kv"><span>Progress</span><strong>{pct(detail.progress)}</strong></div>
          <div className="pjw-kv"><span>Budget</span><strong>{detail.budget != null ? money(detail.budget, detail.currency) : "—"}</strong></div>
          <div className="pjw-kv"><span>Spent</span><strong>{money(detail.spent, detail.currency)}</strong></div>
          <div className="pjw-kv"><span>Budget Utilization</span><strong>{pct(detail.budgetUtilization)}</strong></div>
          <div className="pjw-kv"><span>Start Date</span><strong>{fmtDate(detail.startDate)}</strong></div>
          <div className="pjw-kv"><span>Due Date</span><strong>{fmtDate(detail.dueDate)}</strong></div>
          <div className="pjw-kv"><span>Tasks</span><strong>{detail.taskDone} / {detail.taskTotal}</strong></div>
          <div className="pjw-kv"><span>Milestones</span><strong>{detail.milestoneDone} / {detail.milestoneTotal}</strong></div>
          <div className="pjw-kv" style={{ gridColumn: "1 / -1" }}>
            <span>Description</span>
            <strong style={{ fontWeight: 400 }}>{detail.description || "—"}</strong>
          </div>
        </div>
      ) : (
        <>
          {error ? <div className="pjw-form-error">{error}</div> : null}
          <div className="pjw-modal-grid">
            <label className="pjw-full">
              Project Name
              <input value={form.name} onChange={upd("name")} placeholder="e.g. Website Redesign" />
            </label>
            <label>
              Client
              <select value={form.contactId} onChange={upd("contactId")}>
                <option value="">No client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Project Manager
              <select value={form.managerId} onChange={upd("managerId")}>
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
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
              Status
              <select value={form.status} onChange={upd("status")}>
                <option value="planning">Planning</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label>
              Start Date
              <input type="date" value={form.startDate} onChange={upd("startDate")} />
            </label>
            <label>
              Due Date
              <input type="date" value={form.dueDate} onChange={upd("dueDate")} />
            </label>
            <label>
              Budget
              <input type="number" min="0" step="0.01" value={form.budget} onChange={upd("budget")} placeholder="0.00" />
            </label>
            <label>
              Progress (%)
              <input type="number" min="0" max="100" value={form.progress} onChange={upd("progress")} />
            </label>
            <label className="pjw-full">
              Description
              <textarea value={form.description} onChange={upd("description")} placeholder="Scope, notes, objectives…" />
            </label>
          </div>
        </>
      )}
    </PjwModal>
  );
}
