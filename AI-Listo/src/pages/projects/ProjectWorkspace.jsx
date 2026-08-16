import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Plus,
  ChevronDown,
  FolderOpen,
  CircleCheckBig,
  CalendarDays,
  TimerReset,
  BadgeDollarSign,
  Upload,
  Download,
  RotateCcw,
  Eye,
  Pencil,
  LayoutDashboard,
  ClipboardList,
  PackageCheck,
  Files,
  Clock3,
  UsersRound,
  FileChartColumn,
  Milestone,
} from "lucide-react";
import "./ProjectWorkspace.css";

import projectsApi from "../../api/projectsApi";
import { money, fmtRelative, fmtDate, initials, statusClass, priorityClass, pct } from "./projectFormat";
import PjwDashboardPanels from "./PjwDashboardPanels";
import PjwProjectModal from "./PjwProjectModal";
import PjwOverview from "./PjwOverview";
import PjwTasks from "./PjwTasks";
import PjwMilestones from "./PjwMilestones";
import PjwDeliverables from "./PjwDeliverables";
import PjwFiles from "./PjwFiles";
import PjwTimeExpenses from "./PjwTimeExpenses";
import PjwClients from "./PjwClients";
import PjwReports from "./PjwReports";

const TABS = [
  [LayoutDashboard, "Overview"],
  [FolderOpen, "Projects"],
  [ClipboardList, "Tasks"],
  [Milestone, "Milestones"],
  [PackageCheck, "Deliverables"],
  [Files, "Files"],
  [Clock3, "Time & Expenses"],
  [UsersRound, "Clients"],
  [FileChartColumn, "Reports"],
];

const csvCell = (v) => {
  const s = v === null || v === undefined ? "" : String(v);
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export default function ProjectWorkspace() {
  const [tab, setTab] = useState("Overview");

  // shared context (team, members, clients) — fetched once
  const [ctx, setCtx] = useState(null);
  const [ctxError, setCtxError] = useState("");

  // overview (KPIs + dashboard panels)
  const [overview, setOverview] = useState(null);
  const [ovError, setOvError] = useState("");

  const [refreshTick, setRefreshTick] = useState(0);
  const bump = useCallback(() => setRefreshTick((t) => t + 1), []);

  // projects list state
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState("");

  // filters
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("");
  const [clientId, setClientId] = useState("");
  const [managerId, setManagerId] = useState("");
  const [priority, setPriority] = useState("");

  // project modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [modalId, setModalId] = useState(null);
  const [modalNonce, setModalNonce] = useState(0);

  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);

  const openProject = (mode, id = null) => {
    setModalMode(mode);
    setModalId(id);
    setModalNonce((n) => n + 1);
    setModalOpen(true);
  };

  // ---- context (once) ----
  useEffect(() => {
    let alive = true;
    projectsApi
      .getContext()
      .then((c) => {
        if (alive) setCtx(c);
      })
      .catch(() => {
        if (alive) setCtxError("Could not load workspace context.");
      });
    return () => {
      alive = false;
    };
  }, []);

  // ---- overview (mount + refresh) ----
  useEffect(() => {
    let alive = true;
    projectsApi
      .getOverview()
      .then((o) => {
        if (alive) {
          setOverview(o);
          setOvError("");
        }
      })
      .catch(() => {
        if (alive) setOvError("Could not load overview.");
      });
    return () => {
      alive = false;
    };
  }, [refreshTick]);

  // ---- debounce search ----
  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  // ---- reset page on filter change ----
  useEffect(() => {
    setPage(1);
  }, [debounced, status, clientId, managerId, priority]);

  // ---- projects list ----
  useEffect(() => {
    if (tab !== "Projects") return undefined;
    let alive = true;
    setLoading(true);
    projectsApi
      .listProjects({
        search: debounced || undefined,
        status: status || undefined,
        clientId: clientId || undefined,
        managerId: managerId || undefined,
        priority: priority || undefined,
        page,
        limit,
      })
      .then((res) => {
        if (!alive) return;
        setRows(res?.data || []);
        setTotal(res?.total || 0);
        setListError("");
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setListError("Could not load projects.");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [tab, debounced, status, clientId, managerId, priority, page, limit, refreshTick]);

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setClientId("");
    setManagerId("");
    setPriority("");
  };

  const kpis = overview?.kpis || {};
  const statCards = [
    { label: "Active Projects", value: kpis.activeProjects ?? 0, sub: `${kpis.inProgressProjects ?? 0} in progress`, icon: FolderOpen, tone: "blue" },
    { label: "Projects Completed", value: kpis.completedProjectsMonth ?? 0, sub: "This month", icon: CircleCheckBig, tone: "green" },
    { label: "Tasks In Progress", value: kpis.tasksInProgress ?? 0, sub: `of ${kpis.tasksTotal ?? 0} total tasks`, icon: CalendarDays, tone: "amber" },
    { label: "Tasks Completed", value: kpis.tasksCompletedMonth ?? 0, sub: "This month", icon: CircleCheckBig, tone: "green" },
    { label: "On Time Delivery", value: kpis.onTimeDelivery == null ? "—" : pct(kpis.onTimeDelivery), sub: "Milestones", icon: TimerReset, tone: "purple" },
    { label: "Budget Utilization", value: kpis.budgetUtilization == null ? "—" : pct(kpis.budgetUtilization), sub: "Active projects", icon: BadgeDollarSign, tone: "gold" },
    { label: "Billable Amount (MTD)", value: money(kpis.billableAmountMonth ?? 0), sub: "Billed this month", icon: BadgeDollarSign, tone: "orange" },
  ];

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const exportCsv = () => {
    const header = ["Code", "Name", "Client", "Manager", "Status", "Priority", "Progress", "Budget", "Spent", "Start", "Due"];
    const lines = [header.map(csvCell).join(",")];
    rows.forEach((p) => {
      lines.push(
        [
          p.code,
          p.name,
          p.clientName,
          p.managerName,
          p.statusLabel,
          p.priority,
          `${p.progress}%`,
          p.budget ?? "",
          p.spent ?? "",
          fmtDate(p.startDate),
          fmtDate(p.dueDate),
        ]
          .map(csvCell)
          .join(","),
      );
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "projects.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const linesRaw = text.split(/\r?\n/).filter((l) => l.trim());
      // Skip a header row if the first cell looks like "name"/"project".
      const start = /name|project/i.test(linesRaw[0] || "") ? 1 : 0;
      const names = linesRaw
        .slice(start, start + 200)
        .map((l) => l.split(",")[0].replace(/^"|"$/g, "").trim())
        .filter(Boolean);
      let created = 0;
      for (const name of names) {
        // eslint-disable-next-line no-await-in-loop
        await projectsApi.createProject({ name });
        created += 1;
      }
      window.alert(`${created} project${created === 1 ? "" : "s"} imported.`);
      bump();
    } catch (err) {
      window.alert(err?.message || "Import failed.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="pjw-page">
      <header className="pjw-header">
        <div>
          <h1>Projects / Client Delivery</h1>
          <p>Deliver exceptional work, on time and on budget.</p>
        </div>

        <div className="pjw-header-actions">
          <label className="pjw-global-search">
            <Search size={16} />
            <input
              placeholder="Search projects…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (tab !== "Projects") setTab("Projects");
              }}
            />
          </label>
          <button className="pjw-primary" onClick={() => openProject("create")}>
            <Plus size={16} /> New Project
          </button>
        </div>
      </header>

      {ctxError ? <div className="pjw-error">{ctxError}</div> : null}
      {ovError ? <div className="pjw-error">{ovError}</div> : null}

      <section className="pjw-stats">
        {statCards.map(({ label, value, sub, icon: StatIcon, tone }) => (
          <article className={`pjw-stat pjw-stat-${tone}`} key={label}>
            <div className="pjw-stat-top">
              <span>{label}</span>
              <em className={`pjw-stat-icon ${tone}`}>
                <StatIcon size={18} strokeWidth={2} />
              </em>
            </div>
            <strong>{value}</strong>
            <small>{sub}</small>
          </article>
        ))}
      </section>

      <nav className="pjw-tabs">
        {TABS.map(([TabIcon, label]) => (
          <button type="button" key={label} className={tab === label ? "active" : ""} onClick={() => setTab(label)}>
            <TabIcon size={15} />
            {label}
          </button>
        ))}
      </nav>

      {tab === "Overview" && <PjwOverview overview={overview} />}

      {tab === "Projects" && (
        <>
          <section className="pjw-section-head">
            <div>
              <h2>Projects</h2>
              <p>Track and manage all client delivery projects</p>
            </div>
            <div className="pjw-section-actions">
              <button onClick={() => fileInputRef.current?.click()} disabled={importing}>
                <Upload size={14} /> {importing ? "Importing…" : "Import"}
              </button>
              <input ref={fileInputRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={onImportFile} />
              <button onClick={exportCsv}>
                <Download size={14} /> Export
              </button>
              <button className="pjw-primary" onClick={() => openProject("create")}>
                <Plus size={15} /> New Project
              </button>
            </div>
          </section>

          <div className="pjw-filters">
            <label className="pjw-search-filter">
              <Search size={14} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..." />
            </label>

            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="planning">Planning</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">All Clients</option>
              {(ctx?.clients || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select value={managerId} onChange={(e) => setManagerId(e.target.value)}>
              <option value="">All Managers</option>
              {(ctx?.members || []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="urgent">Urgent</option>
            </select>

            <button className="pjw-reset" onClick={resetFilters}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>

          <div className="pjw-table-wrap">
            <div className="pjw-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Project Name</th>
                    <th>Client</th>
                    <th>Project Manager</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Priority</th>
                    <th>Start Date</th>
                    <th>Due Date</th>
                    <th>Budget</th>
                    <th>Spent</th>
                    <th>Tasks</th>
                    <th>Milestones</th>
                    <th>Last Activity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={14} className="pjw-cell-muted" style={{ textAlign: "center", padding: 30 }}>
                        Loading…
                      </td>
                    </tr>
                  ) : listError ? (
                    <tr>
                      <td colSpan={14} style={{ textAlign: "center", padding: 30, color: "#b91c1c" }}>
                        {listError}
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="pjw-cell-muted" style={{ textAlign: "center", padding: 30 }}>
                        No projects yet. Create your first project to get started.
                      </td>
                    </tr>
                  ) : (
                    rows.map((p, index) => (
                      <tr key={p.id}>
                        <td>
                          <button className="pjw-project-link" onClick={() => openProject("view", p.id)}>
                            {p.name}
                            {p.code ? <span className="pjw-cell-muted"> · {p.code}</span> : null}
                          </button>
                        </td>
                        <td>{p.clientName || <span className="pjw-cell-muted">—</span>}</td>
                        <td>
                          {p.managerName ? (
                            <span className="pjw-manager">
                              <span className={`pjw-avatar a${index % 5}`}>{initials(p.managerName)}</span>
                              {p.managerName}
                            </span>
                          ) : (
                            <span className="pjw-cell-muted">Unassigned</span>
                          )}
                        </td>
                        <td>
                          <span className={`pjw-pill ${statusClass(p.status)}`}>{p.statusLabel}</span>
                        </td>
                        <td>
                          <div className="pjw-progress-cell">
                            <i>
                              <b style={{ width: `${p.progress}%` }} />
                            </i>
                            <span>{p.progress}%</span>
                          </div>
                        </td>
                        <td>
                          <span className={`pjw-pill ${priorityClass(p.priority)}`}>{p.priority}</span>
                        </td>
                        <td>{fmtDate(p.startDate)}</td>
                        <td>{fmtDate(p.dueDate)}</td>
                        <td>{p.budget != null ? money(p.budget, p.currency) : <span className="pjw-cell-muted">—</span>}</td>
                        <td>{money(p.spent, p.currency)}</td>
                        <td>
                          {p.taskDone} / {p.taskTotal}
                        </td>
                        <td>
                          {p.milestoneDone} / {p.milestoneTotal}
                        </td>
                        <td>
                          <span className="pjw-recent">{fmtRelative(p.updatedAt)}</span>
                        </td>
                        <td>
                          <div className="pjw-row-actions">
                            <button aria-label="View" onClick={() => openProject("view", p.id)}>
                              <Eye size={14} />
                            </button>
                            <button aria-label="Edit" onClick={() => openProject("edit", p.id)}>
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
                {total === 0 ? "0 projects" : `Showing ${(page - 1) * limit + 1} to ${Math.min(page * limit, total)} of ${total} projects`}
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

          <PjwDashboardPanels overview={overview} />
        </>
      )}

      {tab === "Tasks" && <PjwTasks ctx={ctx} onChanged={bump} />}
      {tab === "Milestones" && <PjwMilestones ctx={ctx} onChanged={bump} />}
      {tab === "Deliverables" && <PjwDeliverables ctx={ctx} onChanged={bump} />}
      {tab === "Files" && <PjwFiles ctx={ctx} />}
      {tab === "Time & Expenses" && <PjwTimeExpenses ctx={ctx} onChanged={bump} />}
      {tab === "Clients" && <PjwClients ctx={ctx} onOpenProject={(id) => openProject("view", id)} />}
      {tab === "Reports" && <PjwReports />}

      <PjwProjectModal
        key={modalNonce}
        open={modalOpen}
        mode={modalMode}
        projectId={modalId}
        ctx={ctx}
        onClose={() => setModalOpen(false)}
        onSaved={bump}
      />
    </div>
  );
}
