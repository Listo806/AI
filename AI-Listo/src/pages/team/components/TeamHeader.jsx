import { Bell, Users } from 'lucide-react';

export default function TeamHeader({
  user,
  teams,
  selectedTeam,
  onChangeTeam,
}) {
  return (
    <div className="team-header heading_page">
        <Users/>
        <h1 className="team-page-title">
          Team Workspace
        </h1>
     
      <div className="team-header-right">
        {/*
        
        {teams?.length > 1 && (
          <select
            value={selectedTeam?.id}
            onChange={(e) => onChangeTeam(e.target.value)}
            className="team-select"
          >
            {teams.map((team) => (
              <option
                key={team.id}
                value={team.id}
              >
                {team.name}
              </option>
            ))}
          </select>
        )}

        <button className="team-notification-btn">
          <Bell size={18} />

          <span className="team-notification-badge">
            6
          </span>
        </button>

        <div className="team-user-box">
          <img
            src={
              user?.avatar ||
              'https://i.pravatar.cc/100'
            }
            alt=""
            className="team-user-avatar"
          />

          <div>
            <div className="team-user-name">
              {user?.name}
            </div>

            <div className="team-user-role">
              Owner
            </div>
          </div>*/}
      </div>
    </div>
  );
}