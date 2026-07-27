import { Plus, Users } from "lucide-react";

export default function TeamBillingCard({
  billing = {},
  onInvite,
  onAddSeat,
  addingSeat = false,
}) {
  const totalSeats = Number(
    billing?.includedSeats || 0,
  );

  const usedSeats = Number(
    billing?.activeSeats || 0,
  );

  const additionalSeats = Number(
    billing?.additionalSeats || 0,
  );

  const availableSeats = Math.max(
    0,
    totalSeats - usedSeats,
  );

  const isFull =
    totalSeats > 0 &&
    usedSeats >= totalSeats;

  const seatPercent =
    totalSeats > 0
      ? Math.min(
          100,
          Math.round(
            (usedSeats / totalSeats) * 100,
          ),
        )
      : 0;

  return (
    <div className="team-billing-modern-card">
      {/* STATUS */}

      <div className="team-billing-status-card">
        <div className="team-billing-status-label">
          <h3 className="team-billing-modern-title">
            Team Seats
          </h3>
        </div>

        <div
          className={`team-billing-status-badge ${
            isFull ? "full" : "active"
          }`}
        >
          {isFull ? "Full" : "Active"}
        </div>
      </div>

      {/* STATS */}

      <div className="team-billing-stats-list">
        <div className="team-billing-stat-row">
          <strong>{availableSeats}</strong>

          <span>Available seats</span>
        </div>

        <div className="team-billing-stat-row">
          <strong>
            {usedSeats} / {totalSeats}
          </strong>

          <span>Seats Used</span>
        </div>

        {additionalSeats > 0 && (
          <div className="team-billing-stat-row">
            <strong>
              {additionalSeats}
            </strong>

            <span>Additional seats</span>
          </div>
        )}

        <div className="team-billing-progress">
          <div className="team-billing-progress-track">
            <div
              className="team-billing-progress-fill"
              style={{
                width: `${seatPercent}%`,
              }}
            />
          </div>

          <span className="team-billing-progress-text">
            {seatPercent}%
          </span>
        </div>
      </div>

      {/* FOOTER */}

      <div className="team-billing-footer">
        <button
          type="button"
          className="team-billing-mini-btn"
          onClick={onAddSeat}
          disabled={addingSeat}
        >
          <Plus size={16} />

          {addingSeat
            ? "Adding..."
            : "Add a seat"}
        </button>

        <button
          type="button"
          onClick={onInvite}
          className="team-primary-btn"
        >
          <Users size={16} />

          Invite Team Member
        </button>
      </div>
    </div>
  );
}