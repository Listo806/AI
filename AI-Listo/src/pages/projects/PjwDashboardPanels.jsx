import {
  Star,
  Milestone as MilestoneIcon,
  FileUp,
  ClipboardList,
  Clock3,
  CalendarDays,
  BadgeDollarSign,
  FolderOpen,
} from "lucide-react";
import { money, fmtRelative, fmtDate, fmtRemaining, STATUS_TONE } from "./projectFormat";

function activityIcon(eventType) {
  if (!eventType) return { Icon: Star, tone: "green" };
  if (eventType.startsWith("milestone")) return { Icon: MilestoneIcon, tone: "blue" };
  if (eventType.startsWith("deliverable")) return { Icon: FileUp, tone: "purple" };
  if (eventType.startsWith("time")) return { Icon: Clock3, tone: "green" };
  if (eventType.startsWith("expense")) return { Icon: BadgeDollarSign, tone: "amber" };
  if (eventType.startsWith("project")) return { Icon: FolderOpen, tone: "blue" };
  if (eventType.includes("completed")) return { Icon: Star, tone: "green" };
  return { Icon: ClipboardList, tone: "amber" };
}

export default function PjwDashboardPanels({ overview }) {
  const byStatus = overview?.projectsByStatus || [];
  const budgetRows = overview?.budgetVsSpent || [];
  const activity = overview?.recentActivity || [];
  const deadlines = overview?.upcomingDeadlines || [];

  const totalProjects = byStatus.reduce((a, b) => a + (b.count || 0), 0);

  // Donut conic-gradient from real status distribution.
  let acc = 0;
  const segments = byStatus.map((s) => {
    const start = totalProjects > 0 ? (acc / totalProjects) * 360 : 0;
    acc += s.count || 0;
    const end = totalProjects > 0 ? (acc / totalProjects) * 360 : 0;
    return `${STATUS_TONE[s.status] || "#cbd5e1"} ${start}deg ${end}deg`;
  });
  const donutStyle =
    segments.length > 0
      ? { backgroundImage: `conic-gradient(${segments.join(", ")})` }
      : { background: "#f1f5f9" };

  const maxBudget = Math.max(
    1,
    ...budgetRows.map((r) => Math.max(r.budget || 0, r.spent || 0)),
  );

  return (
    <section className="pjw-bottom">
      {/* Projects by Status */}
      <article className="pjw-panel">
        <div className="pjw-panel-head">
          <b>Projects by Status</b>
        </div>
        {totalProjects === 0 ? (
          <div className="pjw-empty">
            <FolderOpen size={30} />
            <b>No projects yet</b>
            <span>Create your first project to see the breakdown.</span>
          </div>
        ) : (
          <div className="pjw-donut-body">
            <div className="pjw-donut" style={donutStyle}>
              <div>
                <strong>{totalProjects}</strong>
                <span>Total Projects</span>
              </div>
            </div>
            <div className="pjw-legend">
              {byStatus.map((s) => (
                <p key={s.status}>
                  <i style={{ background: STATUS_TONE[s.status] || "#cbd5e1" }} />
                  <span>{s.label}</span>
                  <b>
                    {s.count} ({s.pct}%)
                  </b>
                </p>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Budget vs Spent */}
      <article className="pjw-panel">
        <div className="pjw-panel-head">
          <b>Budget vs Spent</b>
        </div>
        {budgetRows.length === 0 ? (
          <div className="pjw-empty">
            <BadgeDollarSign size={30} />
            <b>No budget data yet</b>
            <span>Add a budget to a project to track spend.</span>
          </div>
        ) : (
          <>
            <div className="pjw-budget-chart">
              <div className="pjw-budget-bars">
                {budgetRows.map((r) => (
                  <div className="pjw-budget-group" key={r.id || r.name}>
                    <div className="pjw-budget-pair">
                      <i
                        className="budget"
                        title={`Budget ${money(r.budget)}`}
                        style={{ height: `${Math.round(((r.budget || 0) / maxBudget) * 150)}px` }}
                      />
                      <i
                        className="spent"
                        title={`Spent ${money(r.spent)}`}
                        style={{ height: `${Math.round(((r.spent || 0) / maxBudget) * 150)}px` }}
                      />
                    </div>
                    <span title={r.name}>
                      {r.name?.length > 12 ? `${r.name.slice(0, 12)}…` : r.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pjw-budget-legend">
              <span>
                <i className="budget" />
                Budget
              </span>
              <span>
                <i className="spent" />
                Spent
              </span>
            </div>
          </>
        )}
      </article>

      {/* Recent Activity */}
      <article className="pjw-panel">
        <div className="pjw-panel-head">
          <b>Recent Activity</b>
        </div>
        {activity.length === 0 ? (
          <div className="pjw-empty">
            <ClipboardList size={30} />
            <b>No recent activity</b>
            <span>Actions across your projects show up here.</span>
          </div>
        ) : (
          <div className="pjw-activity-list">
            {activity.map((a, idx) => {
              const { Icon, tone } = activityIcon(a.eventType);
              return (
                <div className="pjw-activity-row" key={`${a.eventType}-${idx}`}>
                  <span className={`pjw-activity-icon ${tone}`}>
                    <Icon size={14} />
                  </span>
                  <div>
                    <b>{a.title}</b>
                    <span>{a.subject || "—"}</span>
                    <small>{a.userName || ""}</small>
                  </div>
                  <time>{fmtRelative(a.createdAt)}</time>
                </div>
              );
            })}
          </div>
        )}
      </article>

      {/* Upcoming Deadlines */}
      <article className="pjw-panel">
        <div className="pjw-panel-head">
          <b>Upcoming Deadlines</b>
        </div>
        {deadlines.length === 0 ? (
          <div className="pjw-empty">
            <CalendarDays size={30} />
            <b>No upcoming deadlines</b>
            <span>Milestones with a due date appear here.</span>
          </div>
        ) : (
          <div className="pjw-deadlines">
            {deadlines.map((d) => (
              <div className="pjw-deadline-row" key={d.id}>
                <span className="pjw-deadline-icon blue">
                  <CalendarDays size={14} />
                </span>
                <div>
                  <b>{d.projectName}</b>
                  <small>{d.title}</small>
                </div>
                <span>{fmtDate(d.dueDate)}</span>
                <strong>{fmtRemaining(d.dueDate)}</strong>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
