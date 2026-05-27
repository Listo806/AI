import { useEffect, useState } from "react";

import {
  Brain,
  Sparkles,
  ShieldAlert,
  TrendingUp,
  RefreshCcw,
  Trophy,
  AlertTriangle,
  Activity,
  Users,
} from "lucide-react";

import "./team-ai-insights.css";

import { fetchTeamAIInsights } from "../team/services/team.service";

import useTeamDashboard from "../team/hooks/useTeamDashboard";
import TeamAICharts from "./components/TeamAICharts";
export default function TeamAIInsightsPage() {
  const { selectedTeamId, team } = useTeamDashboard();

  const [loading, setLoading] = useState(true);

  const [insights, setInsights] = useState(null);

  const loadInsights = async () => {
    if (!selectedTeamId) return;

    try {
      setLoading(true);

      const data = await fetchTeamAIInsights(selectedTeamId);

      setInsights(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, [selectedTeamId]);

  return (
    <div className="team-ai-page">
      {/* HEADER */}

      <div className="team-ai-page-header">
        <div>
          <h1>AI Team Insights</h1>

          <p>
            AI-powered analysis for team productivity, collaboration,
            performance, and risk detection.
          </p>
        </div>

        <button className="team-ai-refresh-btn" onClick={loadInsights}>
          <RefreshCcw size={16} />
          Refresh Analysis
        </button>
      </div>
      <div className="team-ai-banner">
        {insights?.alerts?.length > 0 && (
          <div className="team-ai-alerts">
            {insights.alerts.map((alert, index) => (
              <div key={index} className={`team-ai-alert ${alert.type}`}>
                <AlertTriangle size={16} />

                <div>
                  <strong>{alert.title}</strong>

                  <p>{alert.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <div>
          <strong>AI Status:</strong> Team performance is improving this week.
        </div>

        <span className="team-ai-banner-badge">+12% Productivity</span>
      </div>
      {insights?.pipelineRisks?.length > 0 && (
        <div className="team-ai-alerts">
          {insights.pipelineRisks.map((risk, index) => (
            <div key={index} className={`team-ai-alert ${risk.type}`}>
              <AlertTriangle size={16} />

              <div>
                <strong>{risk.title}</strong>

                <p>{risk.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* LOADING */}

      {loading && <div className="team-ai-loading">Loading AI analysis...</div>}

      {/* CONTENT */}

      {!loading && insights && (
        <>
          {/* SCORE */}

          <div className="team-ai-score-card">
            <div className="team-ai-score">{insights.teamHealthScore || 0}</div>

            <div>
              <h2>Team Health Score</h2>

              <p>AI-generated collaboration & performance score</p>
              <div className="team-ai-score-breakdown">
                <div>
                  <span>Productivity</span>
                  <strong>{insights.productivityScore || 0}%</strong>
                </div>

                <div>
                  <span>Collaboration</span>
                  <strong>{insights.collaborationScore || 0}%</strong>
                </div>

                <div>
                  <span>Efficiency</span>
                  <strong>{insights.efficiencyScore || 0}%</strong>
                </div>
              </div>
            </div>
          </div>
          <div className="team-ai-trends">
            <div className="team-ai-trend-card">
              <TrendingUp size={18} />

              <div>
                <span>Productivity</span>

                <strong>{insights.trends?.productivity}</strong>
              </div>
            </div>

            <div className="team-ai-trend-card">
              <Activity size={18} />

              <div>
                <span>Collaboration</span>

                <strong>{insights.trends?.collaboration}</strong>
              </div>
            </div>

            <div className="team-ai-trend-card">
              <Brain size={18} />

              <div>
                <span>Efficiency</span>

                <strong>{insights.trends?.efficiency}</strong>
              </div>
            </div>
          </div>
          <div className="team-ai-extra-metrics">
            <div className="team-ai-mini-card">
              <span>Average AI Score</span>

              <strong>{insights.averageAIScore}%</strong>
            </div>

            <div className="team-ai-mini-card">
              <span>Pipeline Value</span>

              <strong>
                ${Number(insights.pipelineValue || 0).toLocaleString()}
              </strong>
            </div>

            <div className="team-ai-mini-card">
              <span>Deals Won</span>

              <strong>{insights.dealsWon}</strong>
            </div>

            <div className="team-ai-mini-card">
              <span>Inactive Leads</span>

              <strong>{insights.inactiveLeads}</strong>
            </div>

            <div className="team-ai-mini-card">
              <span>Conversion Rate</span>

              <strong>{insights.conversionRate}%</strong>
            </div>

            <div className="team-ai-mini-card">
              <span>Average Deal Value</span>

              <strong>
                ${Number(insights.averageDealValue || 0).toLocaleString()}
              </strong>
            </div>

            <div className="team-ai-mini-card">
              <span>Won Deals</span>

              <strong>{insights.wonDeals}</strong>
            </div>

            <div className="team-ai-mini-card">
              <span>Lost Deals</span>

              <strong>{insights.lostDeals}</strong>
            </div>
          </div>
          <TeamAICharts insights={insights} />
          {/* GRID */}

          <div className="team-ai-grid">
            {/* SUMMARY */}

            <div className="team-ai-card">
              <div className="team-ai-card-title">
                <Brain size={18} />
                Summary
              </div>

              <p>{insights.summary}</p>
            </div>

            {/* RISKS */}

            <div className="team-ai-card">
              <div className="team-ai-card-title">
                <ShieldAlert size={18} />
                Risks
              </div>

              <ul>
                <div className="team-ai-risk-list">
                  {(insights.risks || []).map((risk, index) => (
                    <div key={index} className="team-ai-risk-item">
                      <ShieldAlert size={16} />

                      <span>{risk}</span>
                    </div>
                  ))}
                </div>
              </ul>
            </div>

            {/* RECOMMENDATIONS */}

            <div className="team-ai-card">
              <div className="team-ai-card-title">
                <Sparkles size={18} />
                Recommendations
              </div>

              <ul>
                {(insights.recommendations || []).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            {/* METRICS */}

            <div className="team-ai-card">
              <div className="team-ai-card-title">
                <TrendingUp size={18} />
                Metrics
              </div>

              <div className="team-ai-metrics">
                <div>
                  <span>Productivity</span>

                  <strong>{insights.productivityScore}%</strong>
                </div>

                <div>
                  <span>Collaboration</span>

                  <strong>{insights.collaborationScore}%</strong>
                </div>

                <div>
                  <span>Efficiency</span>

                  <strong>{insights.efficiencyScore}%</strong>
                </div>
              </div>
            </div>
          </div>
          {/* TOP PERFORMERS */}

          <div className="team-ai-section-block">
            <div className="team-ai-section-header">
              <Trophy size={18} />

              <h3>Top Performers</h3>
            </div>

            <div className="team-ai-performers">
              {(insights.topPerformers || []).map((member) => (
                <div key={member.id} className="team-ai-performer-card">
                  <div className="team-ai-avatar">{member.name?.charAt(0)}</div>

                  <div>
                    <strong>{member.name}</strong>

                    <p>AI Score: {member.score}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* NEED ATTENTION */}
          <div className="team-ai-section-block">
            <div className="team-ai-section-header">
              <AlertTriangle size={18} />

              <h3>Overloaded Members</h3>
            </div>

            <div className="team-ai-attention-list">
              {(insights.overloadedMembers || []).map((member) => (
                <div key={member.id} className="team-ai-attention-item">
                  <div>
                    <strong>{member.name}</strong>

                    <p>Managing {member.totalLeads} leads</p>
                  </div>

                  <span>{member.severity}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="team-ai-section-block">
            <div className="team-ai-section-header">
              <Users size={18} />

              <h3>Needs Attention</h3>
            </div>

            <div className="team-ai-attention-list">
              {(insights.membersNeedingAttention || []).map((member) => (
                <div key={member.id} className="team-ai-attention-item">
                  <div>
                    <strong>{member.name}</strong>

                    <p>{member.issue}</p>
                  </div>

                  <span>{member.aiScore}%</span>
                </div>
              ))}
            </div>
          </div>
          {/* ACTIONS */}

          <div className="team-ai-actions">
            {(insights.nextActions || []).map((action, index) => (
              <button
                key={index}
                className="team-ai-action-btn"
                onClick={() => {
                  window.location.href = action.route;
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
