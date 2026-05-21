import { useEffect, useMemo, useState } from 'react';

import {
  fetchTeams,
  fetchTeam,
  fetchTeamMembers,
  fetchTeamSeats,
} from '../services/team.service';

export default function useTeamDashboard() {
  const [teams, setTeams] = useState([]);

  const [selectedTeamId, setSelectedTeamId] =
    useState(null);

  const [team, setTeam] = useState(null);

  const [members, setMembers] = useState([]);

  const [seatInfo, setSeatInfo] =
    useState(null);

  const [loading, setLoading] =
    useState(true);
  
 
  /* =====================================================
    LOAD ALL TEAMS
  ===================================================== */

  const loadTeams = async () => {
      try {
        setLoading(true);

        const teamsRes = await fetchTeams();

        console.log('TEAMS RES', teamsRes);

        const teamsData = Array.isArray(teamsRes)
          ? teamsRes
          : [];

        setTeams(teamsData);
        if (
          teamsData.length > 0 &&
          !selectedTeamId
        ) {
          const firstTeam =
            teamsData[0];

          const teamId =
            firstTeam.id ||
            firstTeam._id ||
            firstTeam.teamId;

          console.log(
            'AUTO SELECT TEAM ID',
            teamId
          );

          setSelectedTeamId(teamId);
        }
      } catch (error) {
        console.error(
          'LOAD TEAMS ERROR',
          error
        );
      } finally {
        setLoading(false);
      }
    };

  /* =====================================================
    LOAD CURRENT TEAM DATA
  ===================================================== */

  const loadTeamData = async (
    teamId
  ) => {
    if (!teamId) return;

    try {
      setLoading(true);

      const [
        teamRes,
        membersRes,
        seatsRes,
      ] = await Promise.all([
        fetchTeam(teamId),
        fetchTeamMembers(teamId),
        fetchTeamSeats(teamId),
      ]);

      setTeam(teamRes || null);

      setMembers(
        Array.isArray(membersRes)
          ? membersRes
          : []
      );

      setSeatInfo(seatsRes || null);
    } catch (error) {
      console.error(
        'LOAD TEAM DATA ERROR',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
    STATS
  ===================================================== */

  const stats = useMemo(() => {
    return {
      totalMembers:
        members.length || 0,

      activeMembers:
        members.filter(
          (m) => m?.isActive
        ).length || 0,

      availableSeats:
        seatInfo?.available || 0,

      totalSeats:
        seatInfo?.total || 0,
    };
  }, [members, seatInfo]);

  /* =====================================================
    RELOAD
  ===================================================== */

  const reloadDashboard =
    async () => {
      await loadTeamData(
        selectedTeamId
      );
    };

  /* =====================================================
    INIT
  ===================================================== */

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
      if (!selectedTeamId) return;

      loadTeamData(
        selectedTeamId
      );
    }, [selectedTeamId]);
  console.log({
      selectedTeamId,
      teams,
    });
  return {
    loading,

    teams,
    selectedTeamId,
    setSelectedTeamId,

    team,
    members,
    seatInfo,

    stats,

    reloadDashboard,
  };
}