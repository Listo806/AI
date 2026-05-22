export default function TeamBillingCard({ billing }) {
  const totalSeats = Number(billing?.total || 0);

  const usedSeats = Number(billing?.used || 0);

  const availableSeats = Number(billing?.available || 0);

  const usagePercent =
    totalSeats > 0
      ? Math.min(100, Math.round((usedSeats / totalSeats) * 100))
      : 0;

  return (
    <div className="team-billing-modern-card">
      {/* HEADER */}

      <div className="team-billing-modern-header">
        <h3 className="team-billing-modern-title">Team Seats</h3>

        <p className="team-billing-modern-subtitle">Manage your team access</p>
      </div>

      {/* STATUS CARD */}

      <div className="team-billing-status-card">
        <div>
          <p className="team-billing-status-label">Workspace Status</p>

          <h4 className="team-billing-status-title">
            {availableSeats > 0 ? "Active" : "Full"}
          </h4>
        </div>

        <div className="team-billing-status-badge">
          {availableSeats > 0 ? "Active" : "Full"}
        </div>
      </div>

      {/* SEAT USAGE */}

      <div className="team-billing-progress-wrap">
        <div className="team-billing-progress-top">
          <span>Seats Used</span>

          <span>
            {usedSeats} / {totalSeats}
          </span>
        </div>

        <div className="team-billing-progress-bar">
          <div
            className="team-billing-progress-fill"
            style={{
              width: `${usagePercent}%`,
            }}
          />
        </div>
      </div>

      {/* ACTIONS */}

      <div className="team-billing-actions">
        <button
          className="team-billing-primary-btn"
          onClick={() => alert("Upgrade seats coming soon")}
        >
          Add Team Seats
        </button>

        <button disabled className="team-billing-secondary-btn">
          Remove Team Seats
        </button>
      </div>

      {/* STATS */}

      <div className="team-billing-bottom-stats">
        <div className="team-billing-bottom-card">
          <p>Total Seats</p>

          <h4>{totalSeats}</h4>
        </div>

        <div className="team-billing-bottom-card">
          <p>Used Seats</p>

          <h4>{usedSeats}</h4>
        </div>

        <div className="team-billing-bottom-card">
          <p>Status</p>

          <h4 className="active">Active</h4>
        </div>
      </div>
    </div>
  );
}
