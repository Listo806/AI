import React, { useMemo, useState } from "react";
import {
  Search,
  Plus,
  ChevronDown,
  Bell,
  MessageSquare,
  CircleHelp,
  FolderOpen,
  CircleCheckBig,
  CalendarDays,
  TimerReset,
  BadgeDollarSign,
  Gauge,
  Settings2,
  Upload,
  Download,
  RotateCcw,
  Table2,
  List,
  Calendar,
  Eye,
  Pencil,
  MoreVertical,
  LayoutDashboard,
  ClipboardList,
  Flag,
  PackageCheck,
  Files,
  Clock3,
  UsersRound,
  FileChartColumn,
  X,
  Star,
  Milestone,
  FileUp,
  UserRoundCheck,
} from "lucide-react";
import "./ProjectWorkspace.css";

const stats = [
  {
    label: "Active Projects",
    value: "32",
    sub: "18 in progress",
    trend: "14%",
    trendText: "vs last month",
    icon: FolderOpen,
    tone: "blue",
  },
  {
    label: "Projects Completed",
    value: "24",
    sub: "This month",
    trend: "20%",
    trendText: "vs last month",
    icon: CircleCheckBig,
    tone: "green",
  },
  {
    label: "Tasks In Progress",
    value: "156",
    sub: "of 358 total tasks",
    trend: "16%",
    trendText: "vs last month",
    icon: CalendarDays,
    tone: "amber",
  },
  {
    label: "Tasks Completed",
    value: "202",
    sub: "This month",
    trend: "18%",
    trendText: "vs last month",
    icon: CircleCheckBig,
    tone: "green",
  },
  {
    label: "On Time Delivery",
    value: "92.4%",
    sub: "This month",
    trend: "5.3%",
    trendText: "vs last month",
    icon: TimerReset,
    tone: "purple",
  },
  {
    label: "Budget Utilization",
    value: "74.6%",
    sub: "Average",
    trend: "3.1%",
    trendText: "vs last month",
    icon: BadgeDollarSign,
    tone: "gold",
  },
  {
    label: "Billable Amount (MTD)",
    value: "$186,750",
    sub: "Billed this month",
    trend: "22%",
    trendText: "vs last month",
    icon: BadgeDollarSign,
    tone: "orange",
  },
];

const tabs = [
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

const projects = [
  {
    name: "Website Redesign & Development",
    client: "TechFlow Solutions",
    manager: "Olivia Bennett",
    status: "In Progress",
    progress: 68,
    priority: "High",
    start: "Apr 15, 2025",
    due: "Jun 15, 2025",
    budget: "$24,000",
    spent: "$16,320",
    tasks: "18 / 28",
    milestones: "3 / 5",
    last: "2h ago",
  },
  {
    name: "Mobile App Development",
    client: "Bright Marketing",
    manager: "Ethan Walker",
    status: "In Progress",
    progress: 42,
    priority: "High",
    start: "Mar 20, 2025",
    due: "Jun 30, 2025",
    budget: "$45,000",
    spent: "$18,900",
    tasks: "24 / 56",
    milestones: "2 / 7",
    last: "1h ago",
  },
  {
    name: "CRM Implementation",
    client: "GreenLeaf Realty",
    manager: "Sophia Martinez",
    status: "In Progress",
    progress: 75,
    priority: "Medium",
    start: "Feb 10, 2025",
    due: "May 20, 2025",
    budget: "$18,500",
    spent: "$13,875",
    tasks: "32 / 43",
    milestones: "4 / 6",
    last: "5h ago",
  },
  {
    name: "Marketing Campaign Q2",
    client: "Summit Enterprises",
    manager: "Liam Johnson",
    status: "Planning",
    progress: 15,
    priority: "Medium",
    start: "May 10, 2025",
    due: "Jul 15, 2025",
    budget: "$12,000",
    spent: "$1,800",
    tasks: "5 / 20",
    milestones: "1 / 4",
    last: "1d ago",
  },
  {
    name: "E-commerce Platform",
    client: "Innovate Labs",
    manager: "Noah Davis",
    status: "In Progress",
    progress: 55,
    priority: "High",
    start: "Mar 01, 2025",
    due: "Jun 01, 2025",
    budget: "$32,000",
    spent: "$17,600",
    tasks: "26 / 48",
    milestones: "3 / 6",
    last: "3h ago",
  },
  {
    name: "Data Migration Project",
    client: "NextGen Industries",
    manager: "Ava Thompson",
    status: "On Hold",
    progress: 30,
    priority: "Low",
    start: "Apr 05, 2025",
    due: "Jun 25, 2025",
    budget: "$8,500",
    spent: "$2,550",
    tasks: "6 / 18",
    milestones: "0 / 3",
    last: "2d ago",
  },
  {
    name: "System Integration",
    client: "Pulse Technologies",
    manager: "Mason Clark",
    status: "In Review",
    progress: 90,
    priority: "Medium",
    start: "Jan 15, 2025",
    due: "May 10, 2025",
    budget: "$22,000",
    spent: "$21,120",
    tasks: "40 / 44",
    milestones: "5 / 5",
    last: "6h ago",
  },
  {
    name: "Brand Identity Design",
    client: "BlueStone Architects",
    manager: "Isabella White",
    status: "Completed",
    progress: 100,
    priority: "Low",
    start: "Feb 01, 2025",
    due: "Apr 15, 2025",
    budget: "$7,500",
    spent: "$7,500",
    tasks: "12 / 12",
    milestones: "3 / 3",
    last: "1d ago",
  },
];

const statusRows = [
  ["In Progress", "18 (56.3%)", "blue"],
  ["Planning", "5 (15.6%)", "purple"],
  ["In Review", "4 (12.5%)", "amber"],
  ["On Hold", "3 (9.4%)", "orange"],
  ["Completed", "2 (6.3%)", "green"],
];

const activityRows = [
  {
    icon: Star,
    tone: "green",
    title: "Task completed",
    sub: "Design homepage mockup",
    meta: "Olivia Bennett",
    time: "1h ago",
  },
  {
    icon: Milestone,
    tone: "blue",
    title: "Milestone achieved",
    sub: "Phase 2 Development Complete",
    meta: "Website Redesign",
    time: "3h ago",
  },
  {
    icon: FileUp,
    tone: "green",
    title: "File uploaded",
    sub: "Project Requirements.docx",
    meta: "Design Team",
    time: "5h ago",
  },
  {
    icon: ClipboardList,
    tone: "amber",
    title: "Task assigned",
    sub: "API integration",
    meta: "Sophia Martinez",
    time: "1d ago",
  },
  {
    icon: Clock3,
    tone: "green",
    title: "Time logged",
    sub: "3.5h logged to Mobile App Development",
    meta: "Liam Johnson",
    time: "1d ago",
  },
];

const deadlines = [
  ["Website Redesign & Development", "Design System", "May 25, 2025", "in 7 days", "blue"],
  ["CRM Implementation", "User Training", "May 28, 2025", "in 10 days", "green"],
  ["Mobile App Development", "Beta Testing", "May 30, 2025", "in 12 days", "purple"],
  ["E-commerce Platform", "Payment Gateway Integration", "Jun 01, 2025", "in 14 days", "orange"],
  ["Marketing Campaign Q2", "Campaign Launch", "Jun 05, 2025", "in 18 days", "green"],
];

const budgetRows = [
  ["Website Redesign", 36, 24],
  ["Mobile App", 49, 31],
  ["CRM Impl.", 23, 10],
  ["E-commerce", 38, 21],
  ["Others", 19, 10],
];

const initials = (name) =>
  name
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2);

export default function ProjectWorkspace() {
  const [tab, setTab] = useState("Projects");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All Statuses");
  const [client, setClient] = useState("All Clients");
  const [manager, setManager] = useState("All Managers");
  const [priority, setPriority] = useState("All Priorities");
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return projects.filter((project) => {
      return (
        (!q ||
          [
            project.name,
            project.client,
            project.manager,
            project.status,
            project.priority,
          ]
            .join(" ")
            .toLowerCase()
            .includes(q)) &&
        (status === "All Statuses" || project.status === status) &&
        (client === "All Clients" || project.client === client) &&
        (manager === "All Managers" || project.manager === manager) &&
        (priority === "All Priorities" || project.priority === priority)
      );
    });
  }, [search, status, client, manager, priority]);

  const resetFilters = () => {
    setSearch("");
    setStatus("All Statuses");
    setClient("All Clients");
    setManager("All Managers");
    setPriority("All Priorities");
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
            <input placeholder="Search projects, clients, tasks, milestones..." />
            <kbd>⌘ K</kbd>
          </label>

          <button className="pjw-primary" onClick={() => setShowNew(true)}>
            <Plus size={16} />
            New
            <ChevronDown size={14} />
          </button>

        </div>
      </header>

      <section className="pjw-stats">
        {stats.map(({ label, value, sub, trend, trendText, icon: StatIcon, tone }) => (
          <article className={`pjw-stat pjw-stat-${tone}`} key={label}>
            <div className="pjw-stat-top">
              <span>{label}</span>
              <em className={`pjw-stat-icon ${tone}`}>
                <StatIcon size={18} strokeWidth={2} />
              </em>
            </div>
            <strong>{value}</strong>
            <small>{sub}</small>
            <p>
              ↑ {trend} <span>{trendText}</span>
            </p>
          </article>
        ))}
      </section>

      <nav className="pjw-tabs">
        {tabs.map(([TabIcon, label]) => (
          <button
            type="button"
            key={label}
            className={tab === label ? "active" : ""}
            onClick={() => setTab(label)}
          >
            <TabIcon size={15} />
            {label}
          </button>
        ))}
      </nav>

      {tab === "Projects" ? (
        <>
          <section className="pjw-section-head">
            <div>
              <h2>Projects</h2>
              <p>Track and manage all client delivery projects</p>
            </div>

            <div className="pjw-section-actions">
              <button><Upload size={14} /> Import</button>
              <button><Download size={14} /> Export</button>
              <button className="pjw-square"><Settings2 size={15} /></button>
              <button className="pjw-primary" onClick={() => setShowNew(true)}>
                <Plus size={15} /> New Project
              </button>
            </div>
          </section>

          <div className="pjw-filters">
            <label className="pjw-search-filter">
              <Search size={14} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..."
              />
            </label>

            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>All Statuses</option>
              <option>In Progress</option>
              <option>Planning</option>
              <option>In Review</option>
              <option>On Hold</option>
              <option>Completed</option>
            </select>

            <select value={client} onChange={(e) => setClient(e.target.value)}>
              <option>All Clients</option>
              {[...new Set(projects.map((x) => x.client))].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>

            <select value={manager} onChange={(e) => setManager(e.target.value)}>
              <option>All Managers</option>
              {[...new Set(projects.map((x) => x.manager))].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>

            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option>All Priorities</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>

            <button className="pjw-date">
              <CalendarDays size={14} />
              Date Range
              <ChevronDown size={13} />
            </button>

            <select>
              <option>This Month</option>
            </select>

            <button className="pjw-more-filter">
              More Filters <ChevronDown size={13} />
            </button>

            <button className="pjw-reset" onClick={resetFilters}>
              <RotateCcw size={14} /> Reset
            </button>

            <span className="pjw-view-label"></span>
            <button className="pjw-view">
              <Table2 size={14} /> Table <ChevronDown size={12} />
            </button>
            <button className="pjw-square"><List size={15} /></button>
            <button className="pjw-square"><Calendar size={15} /></button>
            <button className="pjw-square"><CalendarDays size={15} /></button>
          </div>

          <div className="pjw-table-wrap">
            <div className="pjw-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th><input type="checkbox" /></th>
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
                  {filtered.map((project, index) => (
                    <tr key={project.name}>
                      <td><input type="checkbox" /></td>
                      <td>
                        <button className="pjw-project-link">{project.name}</button>
                      </td>
                      <td>{project.client}</td>
                      <td>
                        <span className="pjw-manager">
                          <span className={`pjw-avatar a${index % 5}`}>
                            {initials(project.manager)}
                          </span>
                          {project.manager}
                        </span>
                      </td>
                      <td>
                        <span className={`pjw-pill status-${project.status.toLowerCase().replaceAll(" ", "-")}`}>
                          {project.status}
                        </span>
                      </td>
                      <td>
                        <div className="pjw-progress-cell">
                          <i><b style={{ width: `${project.progress}%` }} /></i>
                          <span>{project.progress}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`pjw-pill priority-${project.priority.toLowerCase()}`}>
                          {project.priority}
                        </span>
                      </td>
                      <td>{project.start}</td>
                      <td>{project.due}</td>
                      <td>{project.budget}</td>
                      <td>{project.spent}</td>
                      <td>{project.tasks}</td>
                      <td>{project.milestones}</td>
                      <td><span className="pjw-recent">{project.last}</span></td>
                      <td>
                        <div className="pjw-row-actions">
                          <button aria-label="View"><Eye size={14} /></button>
                          <button aria-label="Edit"><Pencil size={14} /></button>
                          <button aria-label="More"><MoreVertical size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="pjw-pagination">
              <span>Showing 1 to {filtered.length} of 32 projects</span>
              <div>
                <button>‹</button>
                <button className="active">1</button>
                <button>2</button>
                <button>3</button>
                <button>4</button>
                <button>›</button>
              </div>
              <select defaultValue="20">
                <option value="20">20 / page</option>
                <option value="50">50 / page</option>
              </select>
            </footer>
          </div>

          <section className="pjw-bottom">
            <article className="pjw-panel">
              <div className="pjw-panel-head">
                <b>Projects by Status</b>
                <select defaultValue="This Month">
                  <option>This Month</option>
                </select>
              </div>

              <div className="pjw-donut-body">
                <div className="pjw-donut">
                  <div>
                    <strong>32</strong>
                    <span>Total Projects</span>
                  </div>
                </div>

                <div className="pjw-legend">
                  {statusRows.map(([label, value, tone]) => (
                    <p key={label}>
                      <i className={tone} />
                      <span>{label}</span>
                      <b>{value}</b>
                    </p>
                  ))}
                </div>
              </div>
            </article>

            <article className="pjw-panel">
              <div className="pjw-panel-head">
                <b>Budget vs Spent</b>
                <select defaultValue="This Month">
                  <option>This Month</option>
                </select>
              </div>

              <div className="pjw-budget-chart">
                <div className="pjw-y-axis">
                  <span>$60K</span><span>$45K</span><span>$30K</span><span>$15K</span><span>$0</span>
                </div>
                <div className="pjw-budget-bars">
                  {budgetRows.map(([label, budget, spent]) => (
                    <div className="pjw-budget-group" key={label}>
                      <div className="pjw-budget-pair">
                        <i className="budget" style={{ height: `${budget * 2.1}px` }} />
                        <i className="spent" style={{ height: `${spent * 2.1}px` }} />
                      </div>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pjw-budget-legend">
                <span><i className="budget" />Budget</span>
                <span><i className="spent" />Spent</span>
              </div>
            </article>

            <article className="pjw-panel">
              <div className="pjw-panel-head">
                <b>Recent Activity</b>
                <select defaultValue="All Activity">
                  <option>All Activity</option>
                </select>
              </div>

              <div className="pjw-activity-list">
                {activityRows.map(({ icon: ActivityIcon, tone, title, sub, meta, time }) => (
                  <div className="pjw-activity-row" key={`${title}-${sub}`}>
                    <span className={`pjw-activity-icon ${tone}`}>
                      <ActivityIcon size={14} />
                    </span>
                    <div>
                      <b>{title}</b>
                      <span>{sub}</span>
                      <small>{meta}</small>
                    </div>
                    <time>{time}</time>
                  </div>
                ))}
              </div>

              <button className="pjw-link">View all activity →</button>
            </article>

            <article className="pjw-panel">
              <div className="pjw-panel-head">
                <b>Upcoming Deadlines</b>
                <select defaultValue="Next 30 Days">
                  <option>Next 30 Days</option>
                </select>
              </div>

              <div className="pjw-deadlines">
                {deadlines.map(([project, deliverable, date, remaining, tone]) => (
                  <div className="pjw-deadline-row" key={project}>
                    <span className={`pjw-deadline-icon ${tone}`}>
                      <CalendarDays size={14} />
                    </span>
                    <div>
                      <b>{project}</b>
                      <small>{deliverable}</small>
                    </div>
                    <span>{date}</span>
                    <strong>{remaining}</strong>
                  </div>
                ))}
              </div>

              <button className="pjw-link">View all deadlines →</button>
            </article>
          </section>
        </>
      ) : (
        <section className="pjw-placeholder">
          <FolderOpen size={44} />
          <h2>{tab}</h2>
          <p>UI placeholder for the next implementation step.</p>
        </section>
      )}

      {showNew && (
        <div className="pjw-modal-bg" onMouseDown={() => setShowNew(false)}>
          <div className="pjw-modal" onMouseDown={(e) => e.stopPropagation()}>
            <header>
              <div>
                <h3>New Project</h3>
                <p>Create a new client delivery project.</p>
              </div>
              <button onClick={() => setShowNew(false)}><X size={18} /></button>
            </header>

            <div className="pjw-modal-grid">
              <label>
                Project Name
                <input placeholder="e.g. Website Redesign" />
              </label>
              <label>
                Client
                <input placeholder="Select or enter client" />
              </label>
              <label>
                Project Manager
                <input placeholder="Assign project manager" />
              </label>
              <label>
                Priority
                <select defaultValue="Medium">
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </label>
              <label>
                Start Date
                <input type="date" />
              </label>
              <label>
                Due Date
                <input type="date" />
              </label>
              <label>
                Budget
                <input placeholder="$0.00" />
              </label>
              <label>
                Status
                <select defaultValue="Planning">
                  <option>Planning</option>
                  <option>In Progress</option>
                  <option>On Hold</option>
                </select>
              </label>
            </div>

            <footer>
              <button onClick={() => setShowNew(false)}>Cancel</button>
              <button className="pjw-primary" onClick={() => setShowNew(false)}>
                <Plus size={15} /> Create Project
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}