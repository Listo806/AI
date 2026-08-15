import React from "react";
import { money, formatDate, relativeTime, initials } from "../sales/salesFormat";

// Overview tab: the dashboard home for the workspace. Every panel is driven by the
// live /financial/stats payload (passed in as `stats`) — no invented figures. The
// three money meanings stay separate: Portfolio Allocation shows recorded active
// holding values, AUM (a KPI card above) shows recorded active account balances,
// Revenue shows commission fees. Empty states are real (no demo data).
function Icon({ name, size = 16 }) {
  return <i data-lucide={name} style={{ width: size, height: size }} />;
}

function Donut({ title, rows, empty }) {
  const list = rows || [];
  return (
    <div className="fsw-panel fsw-donut-panel">
      <div className="fsw-panel-head">
        <b>{title}</b>
        <select>
          <option>This Month</option>
        </select>
      </div>
      <div className="fsw-donut-body">
        <div className="fsw-legend">
          {list.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 13 }}>{empty}</p>
          ) : (
            list.map((r, i) => (
              <div key={r.label}>
                <span className={`dot d${i}`}></span>
                <span>{r.label}</span>
                <b>{r.value}</b>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function FinancialOverviewSection({ stats }) {
  const reviews = stats?.upcomingReviews || [];
  const activity = stats?.recentActivity || [];
  const appsByStatus = (stats?.applicationsByStatus || []).map((a) => ({
    label: a.status,
    value: a.count,
  }));
  const portfolio = (stats?.portfolioAllocation || []).map((p) => ({
    label: p.category,
    value: money(p.amount),
  }));

  return (
    <section className="fsw-bottom-grid">
      <Donut title="Applications by Status" empty="No applications yet" rows={appsByStatus} />
      <Donut title="Portfolio Allocation (recorded)" empty="No portfolio data yet" rows={portfolio} />
      <div className="fsw-panel">
        <div className="fsw-panel-head">
          <b>Recent Activity</b>
          <select><option>All Activity</option></select>
        </div>
        <div className="fsw-activity">
          {activity.length === 0 ? (
            <div><p><small>No recent activity</small></p></div>
          ) : (
            activity.map((a, i) => (
              <div key={`${a.title}-${i}`}>
                <span><Icon name="activity" /></span>
                <p>
                  <b>{a.title}</b>
                  {a.subtitle && <small>{a.subtitle}</small>}
                </p>
                <time>{relativeTime(a.at)}</time>
              </div>
            ))
          )}
        </div>
        <button className="fsw-link">View all activity <Icon name="arrow-right" /></button>
      </div>
      <div className="fsw-panel">
        <div className="fsw-panel-head">
          <b>Upcoming Reviews</b>
          <select><option>Next 30 Days</option></select>
        </div>
        <div className="fsw-reviews">
          {reviews.length === 0 ? (
            <div><p><small>No reviews in the next 30 days</small></p></div>
          ) : (
            reviews.map((r, i) => (
              <div key={i}>
                <span className={`avatar a${i % 4}`}>{initials(r.clientName)}</span>
                <p>
                  <b>{r.clientName || "-"}</b>
                  <small>Review</small>
                </p>
                <time>{formatDate(r.nextReviewDate)}</time>
              </div>
            ))
          )}
        </div>
        <button className="fsw-link">View all reviews <Icon name="arrow-right" /></button>
      </div>
    </section>
  );
}
