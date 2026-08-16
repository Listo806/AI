import { useEffect, useState } from "react";
import { Plus, Search, ClipboardList, Eye, Pencil } from "lucide-react";
import projectsApi from "../../api/projectsApi";
import PjwTaskModal from "./PjwTaskModal";
import { fmtDate, minutesToText, statusClass, priorityClass } from "./projectFormat";

export default function PjwTasks({ ctx, onChanged }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [projectOptions, setProjectOptions] = useState([]);

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [project, setProject] = useState("");
  const [assignee, setAssignee] = useState("");

  const [page, setPage] = useState(1);
  const limit = 50;

  const [tick, setTick] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [modalId, setModalId] = useState(null);
  const [nonce, setNonce] = useState(0);

  const openTask = (mode, id = null) => {
    setModalMode(mode);
    setModalId(id);
    setNonce((n) => n + 1);
    setModalOpen(true);
  };
  const changed = () => {
    setTick((t) => t + 1);
    onChanged?.();
  };

  useEffect(() => {
    let alive = true;
    projectsApi
      .listProjects({ limit: 100 })
      .then((res) => {
        if (alive) setProjectOptions(res?.data || []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debounced, status, priority, project, assignee]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    projectsApi
      .listTasks({
        search: debounced || undefined,
        status: status || undefined,
        priority: priority || undefined,
        project: project || undefined,
        assignee: assignee || undefined,
        page,
        limit,
      })
      .then((res) => {
        if (!alive) return;
        setRows(res?.data || []);
        setTotal(res?.total || 0);
        setError("");
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setError("Could not load tasks.");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [debounced, status, priority, project, assignee, page, tick]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="pjw-tab-panel">
      <section className="pjw-section-head">
        <div>
          <h2>Tasks</h2>
          <p>Every task here is the same shared record used across your Team Workspace.</p>
        </div>
        <div className="pjw-section-actions">
          <button className="pjw-primary" onClick={() => openTask("create")}>
            <Plus size={15} /> New Task
          </button>
        </div>
      </section>

      <div className="pjw-filters">
        <label className="pjw-search-filter">
          <Search size={14} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..." />
        </label>
        <select value={project} onChange={(e) => setProject(e.target.value)}>
          <option value="">All Projects</option>
          {projectOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="review">In Review</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
          <option value="">All Assignees</option>
          {(ctx?.members || []).map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="pjw-table-wrap">
        <div className="pjw-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Assignee</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Due</th>
                <th>Progress</th>
                <th>Logged</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="pjw-cell-muted" style={{ textAlign: "center", padding: 30 }}>
                    Loading…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: 30, color: "#b91c1c" }}>
                    {error}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="pjw-cell-muted" style={{ textAlign: "center", padding: 30 }}>
                    No tasks yet. Create a task to get started.
                  </td>
                </tr>
              ) : (
                rows.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <button className="pjw-project-link" onClick={() => openTask("view", t.id)}>
                        {t.title}
                      </button>
                    </td>
                    <td>{t.projectName || <span className="pjw-cell-muted">—</span>}</td>
                    <td>{t.assigneeName || <span className="pjw-cell-muted">Unassigned</span>}</td>
                    <td>
                      <span className={`pjw-pill ${statusClass(t.status)}`}>{t.statusLabel}</span>
                    </td>
                    <td>
                      <span className={`pjw-pill ${priorityClass(t.priority)}`}>{t.priority}</span>
                    </td>
                    <td>{fmtDate(t.dueDate)}</td>
                    <td>
                      <div className="pjw-progress-cell">
                        <i>
                          <b style={{ width: `${t.progress}%` }} />
                        </i>
                        <span>{t.progress}%</span>
                      </div>
                    </td>
                    <td>{minutesToText(t.loggedMinutes)}</td>
                    <td>
                      <div className="pjw-row-actions">
                        <button aria-label="View" onClick={() => openTask("view", t.id)}>
                          <Eye size={14} />
                        </button>
                        <button aria-label="Edit" onClick={() => openTask("edit", t.id)}>
                          <Pencil size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <footer className="pjw-pagination">
          <span>
            {total === 0
              ? "0 tasks"
              : `Showing ${(page - 1) * limit + 1} to ${Math.min(page * limit, total)} of ${total} tasks`}
          </span>
          <div>
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              ‹
            </button>
            <button className="active">{page}</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              ›
            </button>
          </div>
          <span className="pjw-cell-muted">
            Page {page} of {totalPages}
          </span>
        </footer>
      </div>

      <PjwTaskModal
        key={nonce}
        open={modalOpen}
        mode={modalMode}
        taskId={modalId}
        ctx={ctx}
        projectOptions={projectOptions}
        onClose={() => setModalOpen(false)}
        onSaved={changed}
      />
    </div>
  );
}
