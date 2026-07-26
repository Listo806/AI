import { Trophy, TrendingUp, ArrowUpRight } from "lucide-react";

import { useEffect, useState } from "react";

import {
  fetchTeamMembersDashboard,
  fetchTeamDashboard,
} from "./services/team.service";
import { downloadCsv } from "../../utils/helpers";
import useTeamDashboard from "./hooks/useTeamDashboard";

import "./performance.css";

export default function TeamPerformancePage() {
  const { selectedTeamId } = useTeamDashboard();

  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedTeamId) return;

    async function loadPerformance() {
      try {
        setLoading(true);
        setError("");

        const [membersRes, dashboardRes] = await Promise.all([
          fetchTeamMembersDashboard(selectedTeamId),
          fetchTeamDashboard(selectedTeamId),
        ]);

        setMembers(
          Array.isArray(membersRes) ? membersRes : membersRes?.data || [],
        );
        setStats(dashboardRes?.stats || null);
      } catch (err) {
        console.error("LOAD TEAM PERFORMANCE ERROR", err);
        setError("Unable to load performance data. Please try again.");
        setMembers([]);
        setStats(null);
      } finally {
        setLoading(false);
      }
    }

    loadPerformance();
  }, [selectedTeamId]);

  /* Real per-member leaderboard, ranked by the backend-computed AI score */
  const leaders = [...members].sort(
    (a, b) => Number(b.aiScore || 0) - Number(a.aiScore || 0),
  );

  /* AI Performance = average of the real per-member AI scores */
  const avgAiScore = members.length
    ? Math.round(
        members.reduce((sum, m) => sum + Number(m.aiScore || 0), 0) /
          members.length,
      )
    : null;

  const handleExport = () => {
    if (!leaders.length) return;

    const headers = [
      "Rank",
      "Name",
      "Role",
      "Assigned Leads",
      "Deals Won",
      "Pipeline Value",
      "AI Score",
    ];

    const rows = leaders.map((member, index) => [
      index + 1,
      member.name || "",
      member.jobTitle || member.role || "",
      member.totalLeads ?? 0,
      member.dealsWon ?? 0,
      member.pipelineValue ?? 0,
      `${member.aiScore ?? 0}%`,
    ]);

    downloadCsv("team-performance.csv", [headers, ...rows]);
  };

  return (
    <div className="team-performance-page">
      {/* HERO */}
      <div className="team-performance-header heading_page">
        <TrendingUp />
        <h1 className="team-page-title">Team Performance</h1>
      </div>
      <div className="team-performance-hero">
        <button className="team-primary-btn" onClick={handleExport}>
          Export Report
        </button>
      </div>

      {/* STATS */}
      {/*
        Total Revenue and Deals Closed come from the real SQL aggregates in the
        team dashboard stats (stats.revenue / stats.dealsWon). Avg Response has
        no backend data, so it stays "—". AI Performance is the real average of
        the per-member AI scores (stats.avgAIScore / conversionRate are
        hardcoded in the backend, so they are intentionally NOT used).
      */}

      <div className="team-performance-grid">
        <div className="team-performance-stat-card">
          <div className="team-performance-stat-top">
            <div className="team-performance-stat-icon">
              <TrendingUp size={18} />
            </div>
            <span>Total Revenue</span>
          </div>
          <h2>
            {stats ? `$${Number(stats.revenue || 0).toLocaleString()}` : "—"}
          </h2>
          <p>Closed-won deal value</p>
        </div>

        <div className="team-performance-stat-card">
          <div className="team-performance-stat-top">
            <div className="team-performance-stat-icon">
              <TrendingUp size={18} />
            </div>
            <span>Deals Closed</span>
          </div>
          <h2>{stats ? Number(stats.dealsWon || 0).toLocaleString() : "—"}</h2>
          <p>Won deals to date</p>
        </div>

        <div className="team-performance-stat-card">
          <div className="team-performance-stat-top">
            <div className="team-performance-stat-icon">
              <TrendingUp size={18} />
            </div>
            <span>Avg Response</span>
          </div>
          <h2>—</h2>
          <p>No response-time data available</p>
        </div>

        <div className="team-performance-stat-card">
          <div className="team-performance-stat-top">
            <div className="team-performance-stat-icon">
              <TrendingUp size={18} />
            </div>
            <span>AI Performance</span>
          </div>
          <h2>{avgAiScore === null ? "—" : `${avgAiScore}%`}</h2>
          <p>Average member AI score</p>
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
            {loading ? (
              <div className="team-performance-row">
                <div>Loading performance...</div>
              </div>
            ) : error ? (
              <div className="team-performance-row">
                <div>{error}</div>
              </div>
            ) : leaders.length === 0 ? (
              <div className="team-performance-row">
                <div>No performance data</div>
              </div>
            ) : (
              leaders.map((member, index) => {
                const Icon = index === 0 ? Trophy : TrendingUp;

                return (
                  <div
                    key={member.id || index}
                    className="team-performance-row"
                  >
                    {/* LEFT */}

                    <div className="team-performance-member">
                      <div className="team-performance-rank">#{index + 1}</div>

                      <div className="team-performance-avatar">
                        <Icon size={18} />
                      </div>

                      <div>
                        <div className="team-performance-member-name">
                          {member.name || "Unknown"}
                        </div>

                        <div className="team-performance-member-role">
                          {member.jobTitle || member.role || "Member"}
                        </div>
                      </div>
                    </div>

                    {/* CENTER */}

                    <div className="team-performance-metric-badge">
                      {Number(member.totalLeads || 0)} leads
                    </div>

                    {/* RIGHT */}

                    <div className="team-performance-score-wrapper">
                      <div className="team-performance-score">
                        {Number(member.aiScore || 0)}%
                      </div>

                      <div className="team-performance-arrow">
                        <ArrowUpRight size={16} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
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
