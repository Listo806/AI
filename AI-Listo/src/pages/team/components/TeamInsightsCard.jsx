import {
  Sparkles,
  AlertTriangle,
  Clock3,
  TrendingUp,
  BellRing,
} from "lucide-react";

const getInsightIcon = (type) => {
  switch (type) {
    case "warning":
      return (
        <div className="team-insight-icon warning">
          <AlertTriangle size={18} />
        </div>
      );

    case "danger":
      return (
        <div className="team-insight-icon danger">
          <Clock3 size={18} />
        </div>
      );

    case "success":
      return (
        <div className="team-insight-icon success">
          <TrendingUp size={18} />
        </div>
      );

    default:
      return (
        <div className="team-insight-icon info">
          <BellRing size={18} />
        </div>
      );
  }
};
import { useNavigate } from "react-router-dom";
export default function TeamInsightsCard({ insights = [], onRunAIReview }) {
  const navigate = useNavigate();
  const insightItems = [
    ...(insights?.alerts || []),
    ...(insights?.pipelineRisks || []),
  ].slice(0, 5);
  return (
    <div className="team-card team-insights-card">
      <div className="team-card-header">
        <div>
          <h3 className="team-card-title">AI Team Insights</h3>

          <p className="team-card-subtitle">Updated just now</p>
        </div>

        <button
          className="team-ai-review-btn"
          onClick={() => navigate("/dashboard/team/ai-insights")}
        >
          <Sparkles size={16} />

          <span>Run AI Review</span>
        </button>
      </div>

      <div className="team-insights-list">
        {insightItems.map((item, index) => (
          <div key={item.id || item._id || index} className="team-insight-box">
            <div className="team-insight-left">
              {getInsightIcon(item.type)}
              <div>
                <p className="team-insight-title">{item.title}</p>
                <p className="team-insight-description">{item.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="team-insights-footer">
        <button className="team-insights-report-btn" onClick={() => navigate("/dashboard/team/ai-insights")}>
          View Full AI Report
        </button>
      </div>
    </div>
  );
}
