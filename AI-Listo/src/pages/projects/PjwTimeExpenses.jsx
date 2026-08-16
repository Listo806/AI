import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Clock3, BadgeDollarSign } from "lucide-react";
import projectsApi from "../../api/projectsApi";
import { TimeExpensesSkeleton } from "./PjwSkeleton";
import PjwModal from "./PjwModal";
import { money, fmtDate, minutesToText } from "./projectFormat";

const dateInput = (iso) => (iso ? String(iso).slice(0, 10) : "");
const EMPTY = { projectId: "", category: "", description: "", amount: "", expenseDate: "", billable: true };

function ExpenseModal({ open, record, projectOptions, defaultProjectId, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    if (record) {
      setForm({
        projectId: record.projectId || "",
        category: record.category || "",
        description: record.description || "",
        amount: record.amount ?? "",
        expenseDate: dateInput(record.expenseDate),
        billable: record.billable !== false,
      });
    } else {
      setForm({ ...EMPTY, projectId: defaultProjectId || "" });
    }
  }, [open, record, defaultProjectId]);

  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.projectId) return setError("Select a project.");
    if (form.amount === "" || Number(form.amount) < 0) return setError("Enter a valid amount.");
    setSaving(true);
    setError("");
    const payload = {
      projectId: form.projectId,
      category: form.category || null,
      description: form.description || null,
      amount: Number(form.amount),
      expenseDate: form.expenseDate || null,
      billable: !!form.billable,
    };
    try {
      if (record) await projectsApi.updateExpense(record.id, payload);
      else await projectsApi.createExpense(payload);
      setSaving(false);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || "Could not save expense.");
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
          <Plus size={15} /> {saving ? "Saving…" : record ? "Save" : "Add Expense"}
        </button>
      </div>
    </>
  );

  return (
    <PjwModal open={open} title={record ? "Edit Expense" : "New Expense"} onClose={onClose} footer={footer} wide>
      {error ? <div className="pjw-form-error">{error}</div> : null}
      <div className="pjw-modal-grid">
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
          Category
          <input value={form.category} onChange={upd("category")} placeholder="e.g. Travel, Software" />
        </label>
        <label>
          Amount
          <input type="number" min="0" step="0.01" value={form.amount} onChange={upd("amount")} placeholder="0.00" />
        </label>
        <label>
          Date
          <input type="date" value={form.expenseDate} onChange={upd("expenseDate")} />
        </label>
        <label className="pjw-check">
          <input type="checkbox" checked={!!form.billable} onChange={(e) => setForm((f) => ({ ...f, billable: e.target.checked }))} />
          Billable to client
        </label>
        <label className="pjw-full">
          Description
          <textarea value={form.description} onChange={upd("description")} />
        </label>
      </div>
    </PjwModal>
  );
}

function BarRows({ items, labelKey, valueKey, format }) {
  const max = Math.max(1, ...items.map((i) => i[valueKey] || 0));
  return (
    <div className="pjw-tab-panel">
      {items.map((it, idx) => (
        <div className="pjw-bar-row" key={`${it[labelKey]}-${idx}`}>
          <span title={it[labelKey]} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {it[labelKey]}
          </span>
          <div className="pjw-bar-track">
            <div className="pjw-bar-fill" style={{ width: `${Math.round(((it[valueKey] || 0) / max) * 100)}%` }} />
          </div>
          <b>{format(it[valueKey])}</b>
        </div>
      ))}
    </div>
  );
}

export default function PjwTimeExpenses({ ctx, onChanged, autoCreate, onAutoCreateDone }) {
  const [data, setData] = useState(null);
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
      .getTimeAndExpenses({ project: project || undefined })
      .then((res) => {
        if (!alive) return;
        setData(res);
        setError("");
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setError("Could not load time & expenses.");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [project, tick]);

  const remove = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await projectsApi.deleteExpense(id);
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

  const t = data?.time;
  const ex = data?.expenses;

  return (
    <div className="pjw-tab-panel">
      <section className="pjw-section-head">
        <div>
          <h2>Time &amp; Expenses</h2>
          <p>Hours logged against tasks and billable project costs.</p>
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
            <Plus size={15} /> Add Expense
          </button>
        </div>
      </section>

      {loading ? (
        <TimeExpensesSkeleton />
      ) : error ? (
        <div className="pjw-error">{error}</div>
      ) : (
        <>
          <div className="pjw-metrics">
            <div className="pjw-metric">
              <span>Hours Logged</span>
              <strong>{t.summary.hoursLogged}h</strong>
            </div>
            <div className="pjw-metric">
              <span>Time Entries</span>
              <strong>{t.summary.entryCount}</strong>
            </div>
            <div className="pjw-metric">
              <span>Total Expenses</span>
              <strong>{money(ex.summary.total)}</strong>
            </div>
            <div className="pjw-metric">
              <span>Billable</span>
              <strong>{money(ex.summary.billable)}</strong>
            </div>
          </div>

          <div className="pjw-two-col">
            <article className="pjw-panel">
              <div className="pjw-panel-head">
                <b>
                  <Clock3 size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
                  Time by Project
                </b>
              </div>
              {t.byProject.length === 0 ? (
                <div className="pjw-empty">
                  <b>No time logged yet</b>
                  <span>Log time on a task to see it here.</span>
                </div>
              ) : (
                <BarRows items={t.byProject} labelKey="projectName" valueKey="hours" format={(v) => `${v}h`} />
              )}
            </article>

            <article className="pjw-panel">
              <div className="pjw-panel-head">
                <b>Time by Member</b>
              </div>
              {t.byMember.length === 0 ? (
                <div className="pjw-empty">
                  <b>No time logged yet</b>
                </div>
              ) : (
                <BarRows items={t.byMember} labelKey="userName" valueKey="hours" format={(v) => `${v}h`} />
              )}
            </article>

            <article className="pjw-panel">
              <div className="pjw-panel-head">
                <b>
                  <BadgeDollarSign size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
                  Expenses by Category
                </b>
              </div>
              {ex.byCategory.length === 0 ? (
                <div className="pjw-empty">
                  <b>No expenses yet</b>
                </div>
              ) : (
                <BarRows items={ex.byCategory} labelKey="category" valueKey="amount" format={(v) => money(v)} />
              )}
            </article>
          </div>

          <div className="pjw-two-col">
            <article className="pjw-panel">
              <div className="pjw-panel-head">
                <b>Recent Time Entries</b>
              </div>
              <div className="pjw-table-wrap" style={{ boxShadow: "none", border: "none" }}>
                <div className="pjw-table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Project</th>
                        <th>Member</th>
                        <th>Time</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {t.entries.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="pjw-cell-muted" style={{ textAlign: "center", padding: 24 }}>
                            No time entries yet.
                          </td>
                        </tr>
                      ) : (
                        t.entries.map((e) => (
                          <tr key={e.id}>
                            <td>{e.taskTitle || <span className="pjw-cell-muted">—</span>}</td>
                            <td>{e.projectName || <span className="pjw-cell-muted">—</span>}</td>
                            <td>{e.userName || "—"}</td>
                            <td>{minutesToText(e.minutes)}</td>
                            <td>{fmtDate(e.startedAt || e.createdAt)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </article>

            <article className="pjw-panel">
              <div className="pjw-panel-head">
                <b>Expenses</b>
              </div>
              <div className="pjw-table-wrap" style={{ boxShadow: "none", border: "none" }}>
                <div className="pjw-table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Project</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ex.data.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="pjw-cell-muted" style={{ textAlign: "center", padding: 24 }}>
                            No expenses yet.
                          </td>
                        </tr>
                      ) : (
                        ex.data.map((e) => (
                          <tr key={e.id}>
                            <td>
                              {e.category || <span className="pjw-cell-muted">Uncategorized</span>}
                              {e.billable ? <span className="pjw-badge green" style={{ marginLeft: 6 }}>Billable</span> : null}
                            </td>
                            <td>{e.projectName || <span className="pjw-cell-muted">—</span>}</td>
                            <td>{money(e.amount)}</td>
                            <td>{fmtDate(e.expenseDate)}</td>
                            <td>
                              <div className="pjw-row-actions">
                                <button aria-label="Edit" onClick={() => open(e)}>
                                  <Pencil size={14} />
                                </button>
                                <button aria-label="Delete" onClick={() => remove(e.id)}>
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
            </article>
          </div>
        </>
      )}

      <ExpenseModal
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
