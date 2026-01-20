import { useState } from 'react';
import './team.css';

export default function Team() {
  // Placeholder data - empty for Phase 1
  const [teamMembers] = useState([]);
  const [usedSeats] = useState(0);
  const [availableSeats] = useState(0);

  const handleAddMember = () => {
    // Phase 1: Placeholder action
    alert('Add member functionality will be available in a future phase.');
  };

  return (
    <div className="team-page">
      {/* Header */}
      <div className="team-header">
        <div>
          <h1 className="team-title">Team</h1>
          <p className="team-description">
            Manage your team members, roles, and seats.
          </p>
        </div>
        <button 
          className="team-add-btn"
          onClick={handleAddMember}
        >
          + Add Member
        </button>
      </div>

      {/* Empty State */}
      {teamMembers.length === 0 ? (
        <div className="team-empty-state">
          <div className="team-empty-icon">👥</div>
          <h3 className="team-empty-title">No team members yet</h3>
          <p className="team-empty-text">
            Add team members to collaborate on leads and properties.
          </p>
        </div>
      ) : (
        <div className="team-members-list">
          {/* Team members table will go here in future phases */}
        </div>
      )}

      {/* Seats Summary */}
      <div className="team-seats-summary">
        <h3 className="team-seats-title">Seats Summary</h3>
        <div className="team-seats-display">
          <span className="team-seats-used">Used: {usedSeats}</span>
          <span className="team-seats-separator">/</span>
          <span className="team-seats-available">Available: {availableSeats}</span>
        </div>
        <p className="team-seats-helper">
          Seat management will be connected to billing and subscriptions in a future phase.
        </p>
      </div>
    </div>
  );
}
