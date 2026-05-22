import {
  useEffect,
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

  const [members, setMembers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [inviting, setInviting] =
    useState(false);

  const [removing, setRemoving] =
    useState(false);

  const [search, setSearch] =
    useState('');

  const [inviteEmail, setInviteEmail] =
    useState('');

  const [toast, setToast] =
      useState(null);
  const [filter, setFilter] = useState('all');
  const [allMembers, setAllMembers] = useState([]);

  const [filteredMembers, setFilteredMembers] = useState([]);

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
    LOAD TEAM + MEMBERS
  ===================================================== */

  const loadMembers = async () => {
      try {
        if (!teamId) {
          setMembers([]);
          return;
        }

        setLoading(true);

        const membersRes =
          await fetchTeamMembers(
            teamId
          );

        const data = membersRes || [];
        setAllMembers(data);
        setFilteredMembers(data);
        setMembers(data);
        
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
    SEARCH
  ===================================================== */

  const searchMembers = (value) => {
      setSearch(value);

      const filtered =
        applyFilters(
          allMembers,
          value,
          filter
        );

      setFilteredMembers(filtered);
    };

  /* =====================================================
    INVITE MEMBER
  ===================================================== */

  const handleInviteMember =
      async (e = null) => {
        e?.preventDefault?.();

        if (!teamId) {
          showToast(
            'No team selected',
            'error'
          );

          return false;
        }

        if (!inviteEmail?.trim()) {
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
            inviteEmail
          );

          showToast(
            'Invitation sent successfully'
          );

          setInviteEmail('');

          await loadMembers();

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

          await removeMember(
            teamId,
            userId
          );

          showToast(
            'Member removed successfully'
          );

          await loadMembers();

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
      
    const applyFilters = (
      membersData,
      keyword,
      currentFilter
    ) => {
      let result = [...membersData];

      /* SEARCH */

      if (keyword?.trim()) {
        const q =
          keyword.toLowerCase();

        result = result.filter(
          (member) =>
            member.name
              ?.toLowerCase()
              .includes(q) ||

            member.email
              ?.toLowerCase()
              .includes(q) ||

            member.role
              ?.toLowerCase()
              .includes(q)
        );
      }

      /* FILTERS */

      switch (currentFilter) {
        case 'active':
          result = result.filter(
            (m) => m.isActive
          );
          break;

        case 'pending':
          result = result.filter(
            (m) => !m.isActive
          );
          break;

        case 'managers':
          result = result.filter(
            (m) =>
              m.role === 'manager'
          );
          break;

        case 'agents':
          result = result.filter(
            (m) =>
              m.role === 'agent'
          );
          break;

        case 'high-performers':
          result = result.filter(
            (m) =>
              Number(m.aiScore || 0) >=
              85
          );
          break;

        case 'needs-attention':
          result = result.filter(
            (m) =>
              Number(m.aiScore || 0) <
              70
          );
          break;

        default:
          break;
      }

      return result;
    };
    
    const handleFilter = (
          filterValue
        ) => {
          setFilter(filterValue);

          const filtered =
            applyFilters(
              allMembers,
              search,
              filterValue
            );

          setFilteredMembers(filtered);
        };
  /* =====================================================
    INIT
  ===================================================== */

  useEffect(() => {
      loadMembers();
    }, [teamId]);

  return {
    members,
    loading,

    inviting,
    removing,

    inviteEmail,
    setInviteEmail,

    search,
    setSearch,

    searchMembers,

    inviteMember:
    handleInviteMember,

    removeMember:
    handleRemoveMember,

    reloadMembers:
    loadMembers,

    teamId,
    toast,
    showToast,
    filteredMembers,
    filter,
    setFilter,
    handleFilter,
  };
}