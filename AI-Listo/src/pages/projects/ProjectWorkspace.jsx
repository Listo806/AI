import React, { useCallback, useEffect, useRef, useState } from "react";
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
  Settings2,
  Eye,
  Pencil,
  MoreVertical,
  Copy,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Trash2,
  Table2,
  List,
  Calendar,
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
import PjwProjectCalendar from "./PjwProjectCalendar";
import { TableSkeletonRows, CardsSkeleton } from "./PjwSkeleton";
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

const NEW_ITEMS = [
  ["Project", "project"],
  ["Task", "task"],
  ["Milestone", "milestone"],
  ["Deliverable", "deliverable"],
  ["Expense", "expense"],
];

const OPTIONAL_COLS = [
  ["budget", "Budget"],
  ["spent", "Spent"],
  ["tasks", "Tasks"],
  ["milestones", "Milestones"],
  ["activity", "Last Activity"],
];

const csvCell = (v) => {
  const s = v === null || v === undefined ? "" : String(v);
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function periodRange(period) {
  if (!period) return { from: "", to: "" };
  const now = new Date();
  const y = now.getFullYear();
  if (period === "month") {
    return { from: ymd(new Date(y, now.getMonth(), 1)), to: ymd(new Date(y, now.getMonth() + 1, 0)) };
  }
  if (period === "quarter") {
    const q = Math.floor(now.getMonth() / 3);
    return { from: ymd(new Date(y, q * 3, 1)), to: ymd(new Date(y, q * 3 + 3, 0)) };
  }
  if (period === "year") {
    return { from: ymd(new Date(y, 0, 1)), to: ymd(new Date(y, 11, 31)) };
  }
  return { from: "", to: "" };
}

export default function ProjectWorkspace() {
  const [tab, setTab] = useState("Overview");

  const [ctx, setCtx] = useState(null);
  const [ctxError, setCtxError] = useState("");
  const [overview, setOverview] = useState(null);
  const [ovError, setOvError] = useState("");

  const [refreshTick, setRefreshTick] = useState(0);
  const bump = useCallback(() => setRefreshTick((t) => t + 1), []);

  // projects list
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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [period, setPeriod] = useState("");
  const [overdue, setOverdue] = useState(false);
  const [hasBudget, setHasBudget] = useState(false);

  // view + selection + column visibility
  const [view, setView] = useState("table");
  const [selected, setSelected] = useState(() => new Set());
  const [visibleCols, setVisibleCols] = useState({
    budget: true, spent: true, tasks: true, milestones: true, activity: true,
  });

  // menus / popovers
  const [menu, setMenu] = useState(null); // 'new-header' | 'settings' | 'dates' | 'more' | null
  const [rowMenu, setRowMenu] = useState(null); // project id

  // project modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [modalId, setModalId] = useState(null);
  const [modalNonce, setModalNonce] = useState(0);

  // New-menu -> other tabs
  const [pendingCreate, setPendingCreate] = useState(null);

  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);

  const closeMenus = () => {
    setMenu(null);
    setRowMenu(null);
  };

  const openProject = (mode, id = null) => {
    setModalMode(mode);
    setModalId(id);
    setModalNonce((n) => n + 1);
    setModalOpen(true);
  };

  const handleNew = (type) => {
    closeMenus();
    if (type === "project") {
      openProject("create");
      return;
    }
    if (type === "task") setTab("Tasks");
    if (type === "milestone") setTab("Milestones");
    if (type === "deliverable") setTab("Deliverables");
    if (type === "expense") setTab("Time & Expenses");
    setPendingCreate(type);
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

  // ---- overview ----
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

  // ---- reset page + clear selection on filter change ----
  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [debounced, status, clientId, managerId, priority, dateFrom, dateTo, overdue, hasBudget]);

  // Selection is per-page: clear it whenever the page changes so bulk actions
  // never operate on rows that are no longer visible.
  useEffect(() => {
    setSelected(new Set());
  }, [page]);

  // ---- projects list (table/list views) ----
  useEffect(() => {
    if (tab !== "Projects" || view === "calendar") return undefined;
    let alive = true;
    setLoading(true);
    projectsApi
      .listProjects({
        search: debounced || undefined,
        status: status || undefined,
        clientId: clientId || undefined,
        managerId: managerId || undefined,
        priority: priority || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        overdue: overdue ? "true" : undefined,
        hasBudget: hasBudget ? "true" : undefined,
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
  }, [tab, view, debounced, status, clientId, managerId, priority, dateFrom, dateTo, overdue, hasBudget, page, limit, refreshTick]);

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setClientId("");
    setManagerId("");
    setPriority("");
    setDateFrom("");
    setDateTo("");
    setPeriod("");
    setOverdue(false);
    setHasBudget(false);
  };

  const applyPeriod = (p) => {
    setPeriod(p);
    const { from, to } = periodRange(p);
    setDateFrom(from);
    setDateTo(to);
  };

  // ---- row + bulk actions ----
  const setProjectStatus = async (id, newStatus) => {
    closeMenus();
    try {
      await projectsApi.updateProject(id, { status: newStatus });
      bump();
    } catch (e) {
      window.alert(e?.message || "Could not update project.");
    }
  };
  const duplicate = async (id) => {
    closeMenus();
    try {
      await projectsApi.duplicateProject(id);
      bump();
    } catch (e) {
      window.alert(e?.message || "Could not duplicate project.");
    }
  };
  const removeProject = async (id) => {
    closeMenus();
    if (!window.confirm("Delete this project? Tasks and time entries are kept but unlinked.")) return;
    try {
      await projectsApi.deleteProject(id);
      bump();
    } catch (e) {
      window.alert(e?.message || "Could not delete project.");
    }
  };

  const toggleRow = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const allVisibleSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (rows.every((r) => next.has(r.id))) rows.forEach((r) => next.delete(r.id));
      else rows.forEach((r) => next.add(r.id));
      return next;
    });
  };
  const bulkComplete = async () => {
    const ids = [...selected];
    for (const id of ids) {
      // eslint-disable-next-line no-await-in-loop
      await projectsApi.updateProject(id, { status: "completed" }).catch(() => {});
    }
    setSelected(new Set());
    bump();
  };
  const bulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.size} project(s)? Tasks/time are kept but unlinked.`)) return;
    const ids = [...selected];
    for (const id of ids) {
      // eslint-disable-next-line no-await-in-loop
      await projectsApi.deleteProject(id).catch(() => {});
    }
    setSelected(new Set());
    bump();
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
  const colCount = 10 + OPTIONAL_COLS.filter(([k]) => visibleCols[k]).length;

  const exportCsv = () => {
    const header = ["Code", "Name", "Client", "Manager", "Status", "Priority", "Progress", "Budget", "Spent", "Start", "Due"];
    const lines = [header.map(csvCell).join(",")];
    rows.forEach((p) => {
      lines.push(
        [p.code, p.name, p.clientName, p.managerName, p.statusLabel, p.priority, `${p.progress}%`, p.budget ?? "", p.spent ?? "", fmtDate(p.startDate), fmtDate(p.dueDate)]
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

  const filtersActive = !!(dateFrom || dateTo || overdue || hasBudget);

  return (
    <div className="pjw-page" onClick={() => (menu || rowMenu) && closeMenus()}>
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

          <div className="pjw-menu-wrap" onClick={(e) => e.stopPropagation()}>
            <button className="pjw-primary" onClick={() => setMenu(menu === "new-header" ? null : "new-header")}>
              <Plus size={16} /> New <ChevronDown size={14} />
            </button>
            {menu === "new-header" && (
              <div className="pjw-menu">
                {NEW_ITEMS.map(([label, type]) => (
                  <button key={type} type="button" onClick={() => handleNew(type)}>
                    <Plus size={14} /> New {label}
                  </button>
                ))}
              </div>
            )}
          </div>
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
              <div className="pjw-menu-wrap" onClick={(e) => e.stopPropagation()}>
                <button className="pjw-square" title="Columns" onClick={() => setMenu(menu === "settings" ? null : "settings")}>
                  <Settings2 size={15} />
                </button>
                {menu === "settings" && (
                  <div className="pjw-menu pjw-menu-right">
                    <span className="pjw-menu-label">Columns</span>
                    {OPTIONAL_COLS.map(([key, label]) => (
                      <label key={key} className="pjw-menu-check">
                        <input
                          type="checkbox"
                          checked={visibleCols[key]}
                          onChange={() => setVisibleCols((v) => ({ ...v, [key]: !v[key] }))}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
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

            <div className="pjw-menu-wrap" onClick={(e) => e.stopPropagation()}>
              <button className="pjw-date" onClick={() => setMenu(menu === "dates" ? null : "dates")}>
                <CalendarDays size={14} /> Date Range <ChevronDown size={13} />
              </button>
              {menu === "dates" && (
                <div className="pjw-menu pjw-menu-pad">
                  <label className="pjw-menu-field">
                    From (due)
                    <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPeriod(""); }} />
                  </label>
                  <label className="pjw-menu-field">
                    To (due)
                    <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPeriod(""); }} />
                  </label>
                  <button type="button" className="pjw-menu-clear" onClick={() => { setDateFrom(""); setDateTo(""); setPeriod(""); }}>
                    Clear dates
                  </button>
                </div>
              )}
            </div>

            <select value={period} onChange={(e) => applyPeriod(e.target.value)}>
              <option value="">All Time</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>

            <div className="pjw-menu-wrap" onClick={(e) => e.stopPropagation()}>
              <button className={`pjw-more-filter ${filtersActive ? "on" : ""}`} onClick={() => setMenu(menu === "more" ? null : "more")}>
                More Filters <ChevronDown size={13} />
              </button>
              {menu === "more" && (
                <div className="pjw-menu pjw-menu-pad">
                  <label className="pjw-menu-check">
                    <input type="checkbox" checked={overdue} onChange={() => setOverdue((v) => !v)} />
                    Overdue only
                  </label>
                  <label className="pjw-menu-check">
                    <input type="checkbox" checked={hasBudget} onChange={() => setHasBudget((v) => !v)} />
                    Has a budget
                  </label>
                </div>
              )}
            </div>

            <button className="pjw-reset" onClick={resetFilters}>
              <RotateCcw size={14} /> Reset
            </button>

            <span className="pjw-view-label" />
            <div className="pjw-view-group">
              <button className={`pjw-square ${view === "table" ? "active" : ""}`} title="Table" onClick={() => setView("table")}>
                <Table2 size={15} />
              </button>
              <button className={`pjw-square ${view === "list" ? "active" : ""}`} title="List" onClick={() => setView("list")}>
                <List size={15} />
              </button>
              <button className={`pjw-square ${view === "calendar" ? "active" : ""}`} title="Calendar" onClick={() => setView("calendar")}>
                <Calendar size={15} />
              </button>
            </div>
          </div>

          {selected.size > 0 && view !== "calendar" && (
            <div className="pjw-bulk-bar" onClick={(e) => e.stopPropagation()}>
              <span>{selected.size} selected</span>
              <button onClick={bulkComplete}>
                <CheckCircle2 size={14} /> Mark Complete
              </button>
              <button className="pjw-danger" onClick={bulkDelete}>
                <Trash2 size={14} /> Delete
              </button>
              <button onClick={() => setSelected(new Set())}>Clear</button>
            </div>
          )}

          {view === "calendar" ? (
            <PjwProjectCalendar refreshTick={refreshTick} onOpenProject={(id) => openProject("view", id)} />
          ) : view === "list" ? (
            <div className="pjw-tab-panel">
              {loading ? (
                <CardsSkeleton />
              ) : listError ? (
                <div className="pjw-error">{listError}</div>
              ) : rows.length === 0 ? (
                <div className="pjw-empty">
                  <FolderOpen size={34} />
                  <b>No projects yet</b>
                  <span>Create your first project to get started.</span>
                </div>
              ) : (
                <div className="pjw-cards">
                  {rows.map((p) => (
                    <button key={p.id} type="button" className="pjw-card" onClick={() => openProject("view", p.id)}>
                      <div className="pjw-card-top">
                        <b>{p.name}</b>
                        <span className={`pjw-pill ${statusClass(p.status)}`}>{p.statusLabel}</span>
                      </div>
                      <small>{p.clientName || "No client"}</small>
                      <div className="pjw-progress-cell">
                        <i>
                          <b style={{ width: `${p.progress}%` }} />
                        </i>
                        <span>{p.progress}%</span>
                      </div>
                      <div className="pjw-card-meta">
                        <span>{p.budget != null ? money(p.budget, p.currency) : "No budget"}</span>
                        <span>Due {fmtDate(p.dueDate)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="pjw-table-wrap">
              <div className="pjw-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleAll}
                          aria-label="Select all"
                        />
                      </th>
                      <th>Project Name</th>
                      <th>Client</th>
                      <th>Project Manager</th>
                      <th>Status</th>
                      <th>Progress</th>
                      <th>Priority</th>
                      <th>Start Date</th>
                      <th>Due Date</th>
                      {visibleCols.budget && <th>Budget</th>}
                      {visibleCols.spent && <th>Spent</th>}
                      {visibleCols.tasks && <th>Tasks</th>}
                      {visibleCols.milestones && <th>Milestones</th>}
                      {visibleCols.activity && <th>Last Activity</th>}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <TableSkeletonRows cols={colCount} rows={6} />
                    ) : listError ? (
                      <tr>
                        <td colSpan={colCount} style={{ textAlign: "center", padding: 30, color: "#b91c1c" }}>
                          {listError}
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={colCount} className="pjw-cell-muted" style={{ textAlign: "center", padding: 30 }}>
                          No projects yet. Create your first project to get started.
                        </td>
                      </tr>
                    ) : (
                      rows.map((p, index) => (
                        <tr key={p.id} className={selected.has(p.id) ? "pjw-row-selected" : ""}>
                          <td>
                            <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleRow(p.id)} aria-label="Select row" />
                          </td>
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
                          {visibleCols.budget && <td>{p.budget != null ? money(p.budget, p.currency) : <span className="pjw-cell-muted">—</span>}</td>}
                          {visibleCols.spent && <td>{money(p.spent, p.currency)}</td>}
                          {visibleCols.tasks && <td>{p.taskDone} / {p.taskTotal}</td>}
                          {visibleCols.milestones && <td>{p.milestoneDone} / {p.milestoneTotal}</td>}
                          {visibleCols.activity && <td><span className="pjw-recent">{fmtRelative(p.updatedAt)}</span></td>}
                          <td>
                            <div className="pjw-row-actions">
                              <button aria-label="View" onClick={() => openProject("view", p.id)}>
                                <Eye size={14} />
                              </button>
                              <button aria-label="Edit" onClick={() => openProject("edit", p.id)}>
                                <Pencil size={14} />
                              </button>
                              <div className="pjw-menu-wrap" onClick={(e) => e.stopPropagation()}>
                                <button aria-label="More" onClick={() => setRowMenu(rowMenu === p.id ? null : p.id)}>
                                  <MoreVertical size={15} />
                                </button>
                                {rowMenu === p.id && (
                                  <div className="pjw-menu pjw-menu-right">
                                    <button type="button" onClick={() => duplicate(p.id)}>
                                      <Copy size={14} /> Duplicate
                                    </button>
                                    <button type="button" onClick={() => setProjectStatus(p.id, "completed")}>
                                      <CheckCircle2 size={14} /> Mark Complete
                                    </button>
                                    <button type="button" onClick={() => setProjectStatus(p.id, "on_hold")}>
                                      <PauseCircle size={14} /> Put On Hold
                                    </button>
                                    <button type="button" onClick={() => setProjectStatus(p.id, "cancelled")}>
                                      <XCircle size={14} /> Cancel
                                    </button>
                                    <button type="button" className="pjw-menu-danger" onClick={() => removeProject(p.id)}>
                                      <Trash2 size={14} /> Delete
                                    </button>
                                  </div>
                                )}
                              </div>
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
          )}

          <PjwDashboardPanels overview={overview} />
        </>
      )}

      {tab === "Tasks" && (
        <PjwTasks ctx={ctx} onChanged={bump} autoCreate={pendingCreate === "task"} onAutoCreateDone={() => setPendingCreate(null)} />
      )}
      {tab === "Milestones" && (
        <PjwMilestones ctx={ctx} onChanged={bump} autoCreate={pendingCreate === "milestone"} onAutoCreateDone={() => setPendingCreate(null)} />
      )}
      {tab === "Deliverables" && (
        <PjwDeliverables ctx={ctx} onChanged={bump} autoCreate={pendingCreate === "deliverable"} onAutoCreateDone={() => setPendingCreate(null)} />
      )}
      {tab === "Files" && <PjwFiles ctx={ctx} />}
      {tab === "Time & Expenses" && (
        <PjwTimeExpenses ctx={ctx} onChanged={bump} autoCreate={pendingCreate === "expense"} onAutoCreateDone={() => setPendingCreate(null)} />
      )}
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
