export default function TeamBillingCard({ billing = {} }) {
  const totalSeats = Number(billing?.includedSeats || 0);

  const usedSeats = Number(billing?.activeSeats || 0);

  const additionalSeats = Number(billing?.additionalSeats || 0);

  const availableSeats = Math.max(0, totalSeats - usedSeats);

  const usagePercent =
    totalSeats > 0
      ? Math.min(100, Math.round((usedSeats / totalSeats) * 100))
      : 0;

  const isFull = usedSeats >= totalSeats;

  return (
    <div className="team-billing-modern-card">
      {/* HEADER */}

      <div className="team-billing-modern-header">
        <h3 className="team-billing-modern-title">Team Seats</h3>

        <p className="team-billing-modern-subtitle">Manage your team access</p>
      </div>

      {/* STATUS */}

      <div className="team-billing-status-card">
        <div>
          <p className="team-billing-status-label">Workspace Status</p>

          <h4 className="team-billing-status-title">
            {billing?.status || "Active"}
          </h4>
        </div>

        <div
          className={`team-billing-status-badge ${isFull ? "full" : "active"}`}
        >
          {isFull ? "Full" : "Active"}
        </div>
      </div>

      {/* PROGRESS */}

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
          onClick={() => alert("Seat upgrade coming soon")}
        >
          Add Team Seats
        </button>

        <button
          disabled={usedSeats <= 1}
          className="team-billing-secondary-btn"
        >
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
          <p>Available</p>

          <h4>{availableSeats}</h4>
        </div>
      </div>
    </div>
  );
}
