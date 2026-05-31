export default function TeamBillingCard({ billing = {} }) {
  const totalSeats = Number(billing?.includedSeats || 0);

  const usedSeats = Number(billing?.activeSeats || 0);

  const additionalSeats = Number(billing?.additionalSeats || 0);

  const availableSeats = Math.max(0, totalSeats - usedSeats);

  const isFull = usedSeats >= totalSeats;

  return (
    <div className="team-billing-modern-card">
      {/* HEADER */}

      <div className="team-billing-modern-header">
        <div>
          <h3 className="team-billing-modern-title">Team Seats</h3>

          <p className="team-billing-modern-subtitle">
            Manage your team access
          </p>
        </div>
      </div>

      {/* STATUS */}

      <div className="team-billing-status-card">
        <div className="team-billing-status-label">
          Workspace Status
        </div>
        <div
          className={`team-billing-status-badge ${isFull ? "full" : "active"}`}
        >
          {isFull ? "Full" : "Active"}
        </div>
      </div>

      {/* STATS */}

      <div className="team-billing-stats-list">
        <div className="team-billing-stat-row">
          <span>Seats Used</span>

          <strong>
            {usedSeats} / {totalSeats}
          </strong>
        </div>

        <div className="team-billing-stat-row">
          <span>Base seats included</span>

          <strong>{totalSeats}</strong>
        </div>

        <div className="team-billing-stat-row">
          <span>Extra seats</span>

          <strong>{additionalSeats}</strong>
        </div>

        <div className="team-billing-stat-row">
          <span>Available seats</span>

          <strong>{availableSeats}</strong>
        </div>
      </div>

      {/* FOOTER */}

      <div className="team-billing-footer">
        <button className="team-billing-add-seat-btn">Add a seat</button>

        <button className="team-billing-mini-btn">Add +</button>
      </div>
    </div>
  );
}
