import { useEffect, useMemo, useState } from "react";

import {
  fetchTeams,
  fetchTeamDashboard,
  fetchTeamSeats,
  fetchTeamNotifications,
} from "../services/team.service";

export default function useTeamDashboard() {
  const [loading, setLoading] = useState(true);

  const [teams, setTeams] = useState([]);

  const [selectedTeamId, setSelectedTeamId] =
    useState(null);

  const [team, setTeam] = useState(null);

  const [members, setMembers] = useState([]);

  const [stats, setStats] = useState({});

  const [activities, setActivities] =
    useState([]);

  const [subscription, setSubscription] =
    useState(null);
  const [insights, setInsights] = useState([]);
  const [billing, setBilling] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [notifications, setNotifications] = useState([]);

  /* =====================================================
    LOAD TEAMS
  ===================================================== */

  useEffect(() => {
    const loadTeams = async () => {
      try {
        setLoading(true);

        const teamsData = await fetchTeams();

        console.log(
          "teamsData",
          teamsData
        );

        setTeams(teamsData || []);

        if (
          teamsData?.length > 0 &&
          !selectedTeamId
        ) {
          setSelectedTeamId(
            teamsData[0].id
          );
        }
      } catch (error) {
        console.error(
          "loadTeams error",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, []);

  /* =====================================================
    LOAD DASHBOARD
  ===================================================== */

  const loadDashboard = async (
    teamId
  ) => {
    if (!teamId) return;

    try {
      setLoading(true);

      const [data, seats, notifications] =
          await Promise.all([
            fetchTeamDashboard(teamId),
            fetchTeamSeats(teamId),
            fetchTeamNotifications(teamId),
          ]);

        setTeam(data.team || null);

        setMembers(data.members || []);

        setStats(data.stats || {});

        setActivities(data.activities || []);

        setSubscription(data.subscription || null);

        setInsights(data.insights || []);

        setLeaderboard(data.leaderboard || []);

        setBilling(seats || null);
        setNotifications(
          notifications || []
        );
      
    } catch (error) {
      console.error(
        "loadDashboard error",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
    WHEN TEAM CHANGES
  ===================================================== */

  useEffect(() => {
      if (!selectedTeamId) return;

      loadDashboard(selectedTeamId);

      // eslint-disable-next-line
    }, []);

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
      available: Math.max(
        total - used,
        0
      ),
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
    insights,
    billing,
    leaderboard,
    notifications,
    reloadDashboard: () =>
      loadDashboard(selectedTeamId),
  };
}