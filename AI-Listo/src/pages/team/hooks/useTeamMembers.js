import {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';

import {
  fetchTeamMembers,
  fetchTeamMembersDashboard,
  inviteMember,
  removeMember,
} from '../services/team.service';

export default function useTeamMembers({
  teamId,
  onReload,
  mode = 'members',
}) {

  /* =====================================================
    STATE
  ===================================================== */

  const [loading, setLoading] =
    useState(true);

  const [inviting, setInviting] =
    useState(false);

  const [removing, setRemoving] =
    useState(false);

  const [search, setSearch] =
    useState('');
  const [debouncedSearch, setDebouncedSearch] =
    useState('');
  const [filter, setFilter] =
    useState('all');
  
  const [filterDashboard, setFilterDashboard] =
    useState('all');
  const [inviteEmail, setInviteEmail] =
    useState('');

  const [allMembers, setAllMembers] =
    useState([]);

  const [toast, setToast] =
    useState(null);

  const [page, setPage] =
    useState(1);

  const [limit, setLimit] = useState(10);
  const [dashboardLimit, setDashboardLimit] = useState(5);
  const [pagination, setPagination] =
    useState({
      total: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    });
  /* =====================================================
    TOAST
  ===================================================== */

  const showToast = (
    message,
    type = 'success'
  ) => {

    setToast({
      message,
      type,
    });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  /* =====================================================
    FILTERED MEMBERS
  ===================================================== */

  const members = allMembers;

  /* =====================================================
    LOAD MEMBERS
  ===================================================== */

  const loadMembers = useCallback(async () => {
      try {

        if (!teamId) {
          setAllMembers([]);
          return;
        }

        setLoading(true);

        console.log("CURRENT FILTER", filter);

        const response =
          await fetchTeamMembers(
            teamId,
            {
              page,
              limit,
              search: debouncedSearch,
              filter,
            }
          );

        console.log('HOOK RESPONSE', response);

        const membersData = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];

        setAllMembers(membersData);

        setPagination({
          total:
            response?.pagination?.total ||
            membersData.length,

          totalPages:
            response?.pagination?.totalPages || 1,

          hasNextPage:
            response?.pagination?.hasNextPage || false,

          hasPrevPage:
            response?.pagination?.hasPrevPage || false,
        });

      } catch (error) {

        console.error(
          'LOAD MEMBERS ERROR',
          error
        );

      } finally {

        setLoading(false);
      }
    }, [
      teamId,
      page,
      limit,
      debouncedSearch,
      filter,
    ]);
    
    const loadMembersDashboard = useCallback(async () => {
      try {
        if (!teamId) {
          setAllMembers([]);
          return;
        }

        setLoading(true);

        console.log(
          'DASHBOARD FILTER',
          filterDashboard
        );
        const response =
          await fetchTeamMembersDashboard(
            teamId,
            {
              page,
              dashboardLimit,
              search: debouncedSearch,
              filter: filterDashboard,
            }
          );

        const membersData = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];
        
        setAllMembers(membersData);

        setPagination({
          total:
            response?.pagination?.total ||
            membersData.length,

          totalPages:
            response?.pagination?.totalPages || 1,

          hasNextPage:
            response?.pagination?.hasNextPage || false,

          hasPrevPage:
            response?.pagination?.hasPrevPage || false,
        });

      } catch (error) {

        console.error(
          'LOAD MEMBERS db',
          error
        );

      } finally {

        setLoading(false);
      }
    }, [
      teamId,
      page,
      dashboardLimit,
      debouncedSearch,
      filterDashboard,
    ]);
  /* =====================================================
    INVITE MEMBER
  ===================================================== */

  const handleInviteMember =
      async (payload = {}) => {

      const email =
        payload.email || inviteEmail;

      const role =
        payload.role || 'agent';

      if (!teamId) {

        showToast(
          'No team selected',
          'error'
        );

        return false;
      }

      if (!email?.trim()) {

        showToast(
          'Email is required',
          'error'
        );

        return false;
      }

      try {

        setInviting(true);

        await inviteMember(
          teamId,
          {
            email,
            role,
          }
        );

        showToast(
          'Invitation sent successfully'
        );

        setInviteEmail('');

        await Promise.all([
          loadMembers(),
          onReload?.(),
        ]);

        return true;

      } catch (error) {

        console.error(
          'INVITE MEMBER ERROR',
          error
        );

        showToast(
          error?.message ||
          'Failed to invite member',
          'error'
        );

        return false;

      } finally {

        setInviting(false);
      }
    };

  /* =====================================================
    REMOVE MEMBER
  ===================================================== */

  const handleRemoveMember =
    async (memberId) => {

      if (!teamId) {

        showToast(
          'No team selected',
          'error'
        );

        return false;
      }

      try {

        setRemoving(true);
        console.log('REMOVE', teamId, memberId);
        await removeMember(
          teamId,
          memberId
        );

        showToast(
          'Member removed successfully'
        );

        await Promise.all([
          loadMembers(),
          onReload?.(),
        ]);

        return true;

      } catch (error) {

        console.error(
          'REMOVE MEMBER ERROR',
          error
        );

        showToast(
          error?.message ||
          'Failed to remove member',
          'error'
        );

        return false;

      } finally {

        setRemoving(false);
      }
    };

  /* =====================================================
    EFFECT
  ===================================================== */
  useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedSearch(search);
      }, 400);

      return () => clearTimeout(timer);
    }, [search]);
 
    
    useEffect(() => {
      if (page !== 1) {
        setPage(1);
      }
    }, [
      debouncedSearch,
      filter,
    ]);
    
    useEffect(() => {
      if (!teamId) return;

      if (mode === 'members') {
        loadMembers();
      }

      if (mode === 'dashboard') {
        loadMembersDashboard();
      }

    }, [
      teamId,
      page,
      limit,
      dashboardLimit,
      debouncedSearch,
      filter,
      filterDashboard,
      mode,
      loadMembersDashboard,
      loadMembers,
    ]);
  /* =====================================================
    RETURN
  ===================================================== */

  return {

    members,

    allMembers,

    loading,

    inviting,

    removing,

    search,
    setSearch,

    filter,
    setFilter,
    
    filterDashboard,
    setFilterDashboard,
    
    inviteEmail,
    setInviteEmail,

    toast,
    showToast,
    page,
    setPage,

    limit,
    setLimit,
    
    dashboardLimit,
    setDashboardLimit,

    pagination,

    inviteMember:
    handleInviteMember,

    removeMember:
      handleRemoveMember,

    reloadMembers:
      loadMembers,
      loadMembersDashboard,
  };
}