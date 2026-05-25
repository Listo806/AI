import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  fetchTeamMembers,
  inviteMember,
  removeMember,
} from '../services/team.service';

export default function useTeamMembers({
  teamId,
  onReload,
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

  const [inviteEmail, setInviteEmail] =
    useState('');

  const [allMembers, setAllMembers] =
    useState([]);

  const [toast, setToast] =
    useState(null);

  const [page, setPage] =
    useState(1);

  const [limit, setLimit] =
    useState(10);

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
    FILTER LOGIC
  ===================================================== */

  // function applyFilters(
    // membersData,
    // keyword,
    // currentFilter
  // ) {

    // let result = [...membersData];

    // /* SEARCH */

    // if (keyword?.trim()) {

      // const q =
        // keyword.toLowerCase();

      // result = result.filter(
        // (member) =>
          // member.name
            // ?.toLowerCase()
            // .includes(q) ||

          // member.email
            // ?.toLowerCase()
            // .includes(q) ||

          // member.role
            // ?.toLowerCase()
            // .includes(q)
      // );
    // }

    // /* FILTER */

    // switch (currentFilter) {

      // case 'active':
        // result = result.filter(
          // (m) => m.isActive
        // );
        // break;

      // case 'pending':
        // result = result.filter(
          // (m) => !m.isActive
        // );
        // break;

      // case 'managers':
        // result = result.filter(
          // (m) =>
            // m.role === 'manager'
        // );
        // break;

      // case 'agents':
        // result = result.filter(
          // (m) =>
            // m.role === 'agent'
        // );
        // break;

      // case 'high-performers':
        // result = result.filter(
          // (m) =>
            // Number(m.aiScore || 0) >= 85
        // );
        // break;

      // case 'needs-attention':
        // result = result.filter(
          // (m) =>
            // Number(m.aiScore || 0) < 70
        // );
        // break;

      // default:
        // break;
    // }

    // return result;
  // }

  /* =====================================================
    FILTERED MEMBERS
  ===================================================== */

  const members = allMembers;

  /* =====================================================
    LOAD MEMBERS
  ===================================================== */

  const loadMembers = async () => {

    try {

      if (!teamId) {

        setAllMembers([]);

        return;
      }

      setLoading(true);

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

        console.log(
          'MEMBERS RESPONSE',
          response
        );

        const membersData = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];

        setAllMembers(membersData);

        setPagination({
          total:
            response?.pagination
              ?.total || membersData.length,

          totalPages:
            response?.pagination
              ?.totalPages || 1,

          hasNextPage:
            response?.pagination
              ?.hasNextPage || false,

          hasPrevPage:
            response?.pagination
              ?.hasPrevPage || false,
        });

    } catch (error) {

      console.error(
        'LOAD MEMBERS ERROR',
        error
      );

    } finally {

      setLoading(false);
    }
  };

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
    async (userId) => {

      if (!teamId) {

        showToast(
          'No team selected',
          'error'
        );

        return false;
      }

      try {

        setRemoving(true);
        console.log('REMOVE', teamId, userId);
        await removeMember(
          teamId,
          userId
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
      if (!teamId) return;

      loadMembers();
    }, [
      teamId,
      page,
      limit,
      debouncedSearch,
      filter,
    ]);
    
    useEffect(() => {
      if (page !== 1) {
        setPage(1);
      }
    }, [
      debouncedSearch,
      filter,
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

    inviteEmail,
    setInviteEmail,

    toast,
    showToast,
    page,
    setPage,

    limit,
    setLimit,

    pagination,

    inviteMember:
    handleInviteMember,

    removeMember:
      handleRemoveMember,

    reloadMembers:
      loadMembers,
  };
}