import {
  Trophy,
  TrendingUp,
  Clock3,
  Target,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import "./performance.css";
export default function TeamPerformancePage() {
  const topMembers = [
    {
      name: "Sarah Johnson",
      role: "Sales Manager",
      metric: "Top Performer",
      value: "98%",
      icon: Trophy,
    },
    {
      name: "Michael Chen",
      role: "Account Executive",
      metric: "Fastest Response",
      value: "2m",
      icon: Clock3,
    },
    {
      name: "Emma Davis",
      role: "Closer",
      metric: "Most Leads Closed",
      value: "42",
      icon: Target,
    },
    {
      name: "Daniel Lee",
      role: "Pipeline Owner",
      metric: "Highest Pipeline",
      value: "$84k",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="team-performance-page">
      {/* HERO */}
      <div className="team-performance-header heading_page">
        <TrendingUp />
        <h1 className="team-page-title">Team Performance</h1>
      </div>
      <div className="team-performance-hero">
        <button className="team-primary-btn">Export Report</button>
      </div>

      {/* STATS */}

      <div className="team-performance-grid">
        <div className="team-performance-stat-card">
          <div className="team-performance-stat-top">
            <div className="team-performance-stat-icon">
              <TrendingUp size={18} />
            </div>
            <span>Total Revenue</span>
          </div>
          <h2>$128,400</h2>
          <p>+18% this month</p>
        </div>

        <div className="team-performance-stat-card">
          <div className="team-performance-stat-top">
            <div className="team-performance-stat-icon">
              <TrendingUp size={18} />
            </div>
            <span>Deals Closed</span>
          </div>
          <h2>214</h2>
          <p>+9% this month</p>
        </div>

        <div className="team-performance-stat-card">
          <div className="team-performance-stat-top">
            <div className="team-performance-stat-icon">
              <TrendingUp size={18} />
            </div>
            <span>Avg Response</span>
          </div>
          <h2>4m 21s</h2>
          <p>Improved from last week</p>
        </div>

        <div className="team-performance-stat-card">
          <div className="team-performance-stat-top">
            <div className="team-performance-stat-icon">
              <TrendingUp size={18} />
            </div>
            <span>AI Performance</span>
          </div>
          <h2>92%</h2>
          <p>Excellent engagement score</p>
        </div>
      </div>

      {/* LEADERBOARD */}

      <div className="team-card">
        <div className="team-card-header">
          <div>
            <h3 className="team-card-title">Performance Leaders</h3>

            <p className="team-card-description">
              Top contributors across your organization
            </p>
          </div>
        </div>

        <div className="team-performance-table">
          <div className="team-performance-table-head">
            <div>Member</div>
            <div>Performance Metric</div>
            <div>Score</div>
          </div>

          <div className="team-performance-table-body">
            {topMembers.map((member, index) => {
              const Icon = member.icon;

              return (
                <div key={index} className="team-performance-row">
                  {/* LEFT */}

                  <div className="team-performance-member">
                    <div className="team-performance-rank">#{index + 1}</div>

                    <div className="team-performance-avatar">
                      <Icon size={18} />
                    </div>

                    <div>
                      <div className="team-performance-member-name">
                        {member.name}
                      </div>

                      <div className="team-performance-member-role">
                        {member.role}
                      </div>
                    </div>
                  </div>

                  {/* CENTER */}

                  <div className="team-performance-metric-badge">
                    {member.metric}
                  </div>

                  {/* RIGHT */}

                  <div className="team-performance-score-wrapper">
                    <div className="team-performance-score">{member.value}</div>

                    <div className="team-performance-arrow">
                      <ArrowUpRight size={16} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CHART PLACEHOLDER */}

      <div className="team-card">
        <div className="team-card-header">
          <div>
            <h3 className="team-card-title">Monthly Performance Trend</h3>

            <p className="team-card-description">
              Analytics visualization placeholder
            </p>
          </div>
        </div>

        <div className="team-chart-placeholder">
          Charts will be connected to backend analytics later
        </div>
      </div>
    </div>
  );
}
