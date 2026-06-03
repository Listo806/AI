import { Users } from "lucide-react";

export default function TeamBillingCard({ billing = {}, onInvite }) {
  const totalSeats = Number(billing?.includedSeats || 0);

  const usedSeats = Number(billing?.activeSeats || 0);

  const additionalSeats = Number(billing?.additionalSeats || 0);

  const availableSeats = Math.max(0, totalSeats - usedSeats);

  const isFull = usedSeats >= totalSeats;

  return (
    <div className="team-billing-modern-card">
      {/* STATUS */}

      <div className="team-billing-status-card">
        <div className="team-billing-status-label">
          <h3 className="team-billing-modern-title">Team Seats</h3>
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
          <span>Available seats</span>

          <strong>{availableSeats}</strong>
        </div>
      </div>

      {/* FOOTER */}

      <div className="team-billing-footer">
        <button onClick={onInvite} className="team-primary-btn">
          <Users size={16} />
          Invite Team Member
        </button>
        <button className="team-billing-mini-btn">+ Add a seat</button>
      </div>
    </div>
  );
}
