import { buildStatsCards } from '../utils/teamConstants';

export default function TeamStats({
  stats = {},
}) {
  const cards =
    buildStatsCards(stats);

  return (
    <div className="team-stats-wrap">
     <div className="team-stats-grid">

      {cards.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.key}
            className="team-stat-card"
          >
            <div className="team-stat-card-top">

              {/* LEFT */}
              <div className="team-stat-content">

                <div className="team-stat-label">
                  {item.label}
                </div>

                <div className="team-stat-value">
                  {item.value ?? 0}
                </div>

                {!!item.change && (
                  <div className="team-stat-change">

                    <strong>
                      {item.change}
                    </strong>

                    {item.changetext && (
                      <span>
                        {item.changetext}
                      </span>
                    )}

                  </div>
                )}

              </div>

              {/* RIGHT */}
              <div className="team-stat-icon">
                <Icon size={22} />
              </div>

            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}