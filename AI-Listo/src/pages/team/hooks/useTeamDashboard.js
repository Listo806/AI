import { useEffect, useMemo, useState } from 'react';

import {
  fetchTeams,
  fetchTeam,
  fetchTeamMembers,
  fetchTeamSeats,
  fetchTeamDashboard,
} from '../services/team.service';

export default function useTeamDashboard() {
  const [loading, setLoading] = useState(true);

  const [teams, setTeams] = useState([]);

  const [selectedTeamId, setSelectedTeamId] = useState(null);

  const [team, setTeam] = useState(null);

  const [members, setMembers] = useState([]);

  const [stats, setStats] = useState({});

  const [activities, setActivities] = useState([]);

  const [subscription, setSubscription] = useState(null);

  /* =====================================================
    LOAD DASHBOARD
  ===================================================== */

  const loadDashboard = async (teamId) => {
    try {
      setLoading(true);

      const data = await fetchTeamDashboard(teamId);
console.error("loadDashboard data", data);
      setTeams(data.teams || []);

      setTeam(data.team || null);

      setMembers(data.members || []);

      setStats(data.stats || {});

      setActivities(data.activities || []);

      setSubscription(data.subscription || null);

      if (!selectedTeamId && data.team?.id) {
        setSelectedTeamId(data.team.id);
      }
    } catch (error) {
      console.error("loadDashboard error", error);
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
    INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    loadDashboard(selectedTeamId);
  }, [selectedTeamId]);

  /* =====================================================
    SEAT INFO
  ===================================================== */

  const seatInfo = useMemo(() => {
    const total =
      subscription?.seat_limit ||
      team?.seat_limit ||
      0;

    const used = members.length;

    return {
      total,
      used,
      available: Math.max(total - used, 0),
    };
  }, [subscription, team, members]);

  return {
    loading,
    teams,
    selectedTeamId,
    setSelectedTeamId,
    team,
    members,
    stats,
    activities,
    subscription,
    seatInfo,
    reloadDashboard: () => loadDashboard(selectedTeamId),
  };
}
