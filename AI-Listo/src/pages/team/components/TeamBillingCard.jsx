import {
  ShieldCheck,
  Users,
  UserCheck,
  UserPlus,
} from 'lucide-react';

export default function TeamBillingCard({
  billing,
}) {
  const totalSeats =
    billing?.total || 0;

  const usedSeats =
    billing?.used || 0;

  const availableSeats =
    billing?.available || 0;

  const usagePercent =
    totalSeats > 0
      ? Math.min(
          100,
          Math.round(
            (usedSeats / totalSeats) * 100
          )
        )
      : 0;

  return (
    <div className="team-card">

      <div className="team-card-header">

        <div>

          <h3 className="team-card-title">
            Team Seats & Billing
          </h3>

          <p className="team-card-subtitle">
            Workspace seat usage overview
          </p>

        </div>

        <ShieldCheck
          size={20}
          className="team-blue-icon"
        />

      </div>

      {/* ========================================
          PLAN BOX
      ======================================== */}

      <div className="team-billing-box">

        <div className="team-billing-row">

          <div>

            <p className="team-billing-label">
              Team Plan
            </p>

            <h4 className="team-billing-plan">
              Enterprise CRM
            </h4>

          </div>

          <span className="team-billing-status">
            Active
          </span>

        </div>

        {/* PROGRESS */}

        <div className="team-seat-progress">

          <div className="team-seat-progress-top">

            <span>
              Seat Usage
            </span>

            <span>
              {usedSeats}/{totalSeats}
            </span>

          </div>

          <div className="team-seat-progress-bar">

            <div
              className="team-seat-progress-fill"
              style={{
                width: `${usagePercent}%`,
              }}
            />

          </div>

        </div>

      </div>

      {/* ========================================
          STATS
      ======================================== */}

      <div className="team-billing-stats">

        <div className="team-billing-stat">

          <div className="team-billing-stat-top">

            <Users
              size={18}
              className="team-billing-stat-icon"
            />

            <span>Total Seats</span>

          </div>

          <strong>
            {totalSeats}
          </strong>

        </div>

        <div className="team-billing-stat">

          <div className="team-billing-stat-top">

            <UserCheck
              size={18}
              className="team-billing-stat-icon"
            />

            <span>Used Seats</span>

          </div>

          <strong>
            {usedSeats}
          </strong>

        </div>

        <div className="team-billing-stat">

          <div className="team-billing-stat-top">

            <UserPlus
              size={18}
              className="team-billing-stat-icon"
            />

            <span>Available</span>

          </div>

          <strong>
            {availableSeats}
          </strong>

        </div>

        <div className="team-billing-stat">

          <div className="team-billing-stat-top">

            <ShieldCheck
              size={18}
              className="team-billing-stat-icon"
            />

            <span>Status</span>

          </div>

          <strong>
            Active
          </strong>

        </div>

      </div>

    </div>
  );
}