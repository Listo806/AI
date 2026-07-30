import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  fetchTeams,
  fetchTeamDashboard,
  fetchTeamSeats,
  fetchTeamNotifications,
  fetchTeamSeatUsage,
} from "../services/team.service";

export default function useTeamDashboard() {
  const [searchParams] = useSearchParams();
  const urlTeamId = searchParams.get("teamId");
  const [loading, setLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] =
    useState(true);

  const [dashboardLoading, setDashboardLoading] =
    useState(true);
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
  const [seatUsage, setSeatUsage] = useState(null);

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
          const fromUrl =
            urlTeamId &&
            teamsData.some(
              (t) => String(t.id) === String(urlTeamId)
            )
              ? urlTeamId
              : teamsData[0].id;
          setSelectedTeamId(fromUrl);
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

        // Plan-based seat usage (the real enforced cap). Degrade gracefully so
        // the dashboard still loads for users without seat-usage access.
        try {
          const usage = await fetchTeamSeatUsage(teamId);
          setSeatUsage(usage || null);
        } catch (_e) {
          setSeatUsage(null);
        }

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
    }, [selectedTeamId]);

  /* =====================================================
    SEAT INFO
  ===================================================== */

  const seatInfo = useMemo(() => {
    // Prefer the plan-based seat-usage endpoint (GET /teams/:id/seat-usage) —
    // the real enforced cap — over the legacy subscription/team seat_limit
    // columns, which can contradict what actually gates invites.
    if (seatUsage && seatUsage.limit != null) {
      const total = Number(seatUsage.limit) || 0;
      const used = Number(seatUsage.used) || 0;
      const available =
        seatUsage.available != null
          ? Number(seatUsage.available)
          : Math.max(total - used, 0);

      return { total, used, available };
    }

    // Fallback to the legacy computation when seat-usage is unavailable.
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
  }, [seatUsage, subscription, team, members]);

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