import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './team.css';

export default function Team() {
  const { t } = useTranslation();
  // Placeholder data - empty for Phase 1
  const [teamMembers] = useState([]);
  const [usedSeats] = useState(0);
  const [availableSeats] = useState(0);

  const handleAddMember = () => {
    // Phase 1: Placeholder action
    alert(t('team.addMember') + ' - ' + t('common.loading'));
  };

  return (
    <div className="team-page">
      {/* Header */}
      <div className="team-header">
        <div>
          <h1 className="team-title">{t('team.title')}</h1>
          <p className="team-description">
            {t('team.description')}
          </p>
        </div>
        <button 
          className="team-add-btn"
          onClick={handleAddMember}
        >
          + {t('team.addMember')}
        </button>
      </div>

      {/* Empty State */}
      {teamMembers.length === 0 ? (
        <div className="team-empty-state">
          <div className="team-empty-icon">👥</div>
          <h3 className="team-empty-title">{t('team.noMembers')}</h3>
          <p className="team-empty-text">
            {t('team.addMembersDescription')}
          </p>
        </div>
      ) : (
        <div className="team-members-list">
          {/* Team members table will go here in future phases */}
        </div>
      )}

      {/* Seats Summary */}
      <div className="team-seats-summary">
        <h3 className="team-seats-title">{t('team.seatsSummary')}</h3>
        <div className="team-seats-display">
          <span className="team-seats-used">{t('team.used')}: {usedSeats}</span>
          <span className="team-seats-separator">/</span>
          <span className="team-seats-available">{t('team.available')}: {availableSeats}</span>
        </div>
        <p className="team-seats-helper">
          {t('team.seatsHelper')}
        </p>
      </div>
    </div>
  );
}
