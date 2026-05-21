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

        setMembers(membersRes || []);
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

    if (!value?.trim()) {
      loadMembers();
      return;
    }

    const keyword =
      value.toLowerCase();

    const filtered =
      members.filter((member) => {
        return (
          member.email
            ?.toLowerCase()
            .includes(keyword) ||
          member.role
            ?.toLowerCase()
            .includes(keyword)
        );
      });

    setMembers(filtered);
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
  };
}