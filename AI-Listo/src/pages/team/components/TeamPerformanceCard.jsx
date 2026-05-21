import { Trophy, Clock3, Target, TrendingUp, Sparkles } from "lucide-react";

const ICONS = {
  "Top Performer": Trophy,
  "Fastest Response": Clock3,
  "Most Leads Closed": Target,
  "Highest Pipeline": TrendingUp,
  "Highest AI Score": Sparkles,
};

export default function TeamPerformanceCard({ leaderboard = [] }) {
  return (
    <div className="team-card">
      <div className="team-card-header">
        <div>
          <h3 className="team-card-title">Team Performance</h3>

          <p className="team-card-description">Top metrics from your team</p>
        </div>

        <button className="team-link-btn">View Full Report</button>
      </div>

      <div className="team-performance-list">
        {leaderboard?.map((item) => {
          const Icon = ICONS[item.label] || Trophy;

          return (
            <div
              key={item.id || item._id || item.email}
              className="team-performance-item"
            >
              {/* LEFT */}
              <div className="team-performance-left">
                <div className="team-performance-icon">
                  <Icon size={18} />
                </div>

                <div>
                  <div className="team-performance-label">{item.label}</div>

                  <div className="team-performance-name">{item.name}</div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="team-performance-value">{item.value}</div>
            </div>
          );
        })}
            <div className="team-performance-item" >
              <div className="team-performance-left">
                <div className="team-performance-icon">
                  <Trophy />
                </div>
                  <div className="team-performance-label">Top Performer</div>
                  <div className="team-performance-name">Maria Rodriguez</div>
              </div>
              <div className="team-performance-value">93%</div>
            </div>
            <div className="team-performance-item" >
              <div className="team-performance-left">
                <div className="team-performance-icon">
                  <Clock3 />
                </div>
                  <div className="team-performance-label">Top Performer</div>
                  <div className="team-performance-name">Maria Rodriguez</div>
              </div>
              <div className="team-performance-value">93%</div>
            </div>
       
      </div>
    </div>
  );
}
