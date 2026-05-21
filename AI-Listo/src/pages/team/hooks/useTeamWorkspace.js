import { useEffect, useState } from 'react';

import {
  getTeamStats,
  getTeamMembers,
  searchTeamMembers,
  getTeamActivity,
  getTeamLeaderboard,
  getTeamInsights,
  getTeamBilling,
  runTeamAIReview,
} from '../services/team.service';

export default function useTeamWorkspace() {

  const [stats, setStats] = useState([]);
  const [members, setMembers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [insights, setInsights] = useState([]);
  const [billing, setBilling] = useState(null);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const [loading, setLoading] = useState(false);

  /* ==================================================== */
  /* LOAD DASHBOARD                                       */
  /* ==================================================== */

  const loadDashboard = async () => {
    try {

      setLoading(true);

      const [
        statsRes,
        membersRes,
        activityRes,
        leaderboardRes,
        insightsRes,
        billingRes,
      ] = await Promise.all([
        getTeamStats(),
        getTeamMembers(filter),
        getTeamActivity(),
        getTeamLeaderboard(),
        getTeamInsights(),
        getTeamBilling(),
      ]);

      setStats(statsRes || []);
      setMembers(membersRes || []);
      setActivity(activityRes || []);
      setLeaderboard(leaderboardRes || []);
      setInsights(insightsRes || []);
      setBilling(billingRes || null);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ==================================================== */
  /* SEARCH MEMBERS                                       */
  /* ==================================================== */

  const handleSearch = async (value) => {
    try {

      setSearch(value);

      if (!value.trim()) {
        const data = await getTeamMembers(filter);

        setMembers(data || []);

        return;
      }

      const data = await searchTeamMembers(value);

      setMembers(data || []);

    } catch (err) {
      console.error(err);
    }
  };

  /* ==================================================== */
  /* AI REVIEW                                            */
  /* ==================================================== */

  const handleRunAIReview = async () => {
    try {

      setLoading(true);

      await runTeamAIReview();

      const insightsData = await getTeamInsights();

      setInsights(insightsData || []);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ==================================================== */
  /* EFFECT                                               */
  /* ==================================================== */

  useEffect(() => {
    loadDashboard();
  }, [filter]);

  return {
    stats,
    members,
    activity,
    leaderboard,
    insights,
    billing,

    search,
    setSearch,

    filter,
    setFilter,

    loading,

    handleSearch,
    handleRunAIReview,

    reloadDashboard: loadDashboard,
  };
}