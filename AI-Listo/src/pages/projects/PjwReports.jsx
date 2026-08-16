import { useEffect, useState } from "react";
import projectsApi from "../../api/projectsApi";
import { ReportsSkeleton } from "./PjwSkeleton";
import { money, pct } from "./projectFormat";

function Bars({ items, labelKey, valueKey, format }) {
  if (!items || items.length === 0) {
    return <div className="pjw-empty"><b>No data yet</b></div>;
  }
  const max = Math.max(1, ...items.map((i) => Number(i[valueKey]) || 0));
  return (
    <div className="pjw-tab-panel">
      {items.map((it, idx) => (
        <div className="pjw-bar-row" key={`${it[labelKey]}-${idx}`}>
          <span title={it[labelKey]} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {it[labelKey]}
          </span>
          <div className="pjw-bar-track">
            <div className="pjw-bar-fill" style={{ width: `${Math.round(((Number(it[valueKey]) || 0) / max) * 100)}%` }} />
          </div>
          <b>{format(it[valueKey])}</b>
        </div>
      ))}
    </div>
  );
}

export default function PjwReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    projectsApi
      .getReports()
      .then((res) => {
        if (!alive) return;
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setError("Could not load reports.");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <ReportsSkeleton />;
  if (error) return <div className="pjw-error">{error}</div>;
  if (!data) return null;

  return (
    <div className="pjw-tab-panel">
      <div className="pjw-metrics">
        <div className="pjw-metric">
          <span>On-Time Delivery</span>
          <strong>{data.onTimeRate == null ? "—" : pct(data.onTimeRate)}</strong>
        </div>
        <div className="pjw-metric">
          <span>Projects Tracked</span>
          <strong>{data.projectStatus.reduce((a, b) => a + (b.count || 0), 0)}</strong>
        </div>
        <div className="pjw-metric">
          <span>Tasks Tracked</span>
          <strong>{data.taskStatus.reduce((a, b) => a + (b.count || 0), 0)}</strong>
        </div>
        <div className="pjw-metric">
          <span>Expense Categories</span>
          <strong>{data.expensesByCategory.length}</strong>
        </div>
      </div>

      <div className="pjw-two-col">
        <article className="pjw-panel">
          <div className="pjw-panel-head"><b>Projects by Status</b></div>
          <Bars items={data.projectStatus} labelKey="label" valueKey="count" format={(v) => v} />
        </article>
        <article className="pjw-panel">
          <div className="pjw-panel-head"><b>Tasks by Status</b></div>
          <Bars items={data.taskStatus} labelKey="label" valueKey="count" format={(v) => v} />
        </article>
        <article className="pjw-panel">
          <div className="pjw-panel-head"><b>Time by Project</b></div>
          <Bars items={data.timeByProject} labelKey="name" valueKey="hours" format={(v) => `${v}h`} />
        </article>
        <article className="pjw-panel">
          <div className="pjw-panel-head"><b>Time by Member</b></div>
          <Bars items={data.timeByMember} labelKey="name" valueKey="hours" format={(v) => `${v}h`} />
        </article>
        <article className="pjw-panel">
          <div className="pjw-panel-head"><b>Expenses by Category</b></div>
          <Bars items={data.expensesByCategory} labelKey="category" valueKey="amount" format={(v) => money(v)} />
        </article>
        <article className="pjw-panel">
          <div className="pjw-panel-head"><b>Budget by Project</b></div>
          {data.budgetByProject.length === 0 ? (
            <div className="pjw-empty"><b>No budget data yet</b></div>
          ) : (
            <div className="pjw-tab-panel">
              {data.budgetByProject.map((p, idx) => {
                const max = Math.max(1, ...data.budgetByProject.map((x) => Math.max(x.budget, x.spent)));
                return (
                  <div className="pjw-bar-row" key={`${p.name}-${idx}`}>
                    <span title={p.name} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.name}
                    </span>
                    <div className="pjw-bar-track" style={{ position: "relative" }}>
                      <div className="pjw-bar-fill" style={{ width: `${Math.round((p.budget / max) * 100)}%`, background: "#c7d2fe" }} />
                      <div
                        className="pjw-bar-fill"
                        style={{ width: `${Math.round((p.spent / max) * 100)}%`, background: "#3b82f6", position: "absolute", top: 0, left: 0 }}
                      />
                    </div>
                    <b>{money(p.spent)}</b>
                  </div>
                );
              })}
            </div>
          )}
        </article>
        <article className="pjw-panel">
          <div className="pjw-panel-head"><b>Top Clients</b></div>
          <Bars items={data.topClients} labelKey="name" valueKey="projects" format={(v) => `${v} proj`} />
        </article>
      </div>
    </div>
  );
}
