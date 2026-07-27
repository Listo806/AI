import { useEffect, useState, useCallback } from "react";

import {
  fetchTeamMembers,
  fetchTeamMembersDashboard,
  inviteMember,
  removeMember,
} from "../services/team.service";

export default function useTeamMembers({
  teamId,
  onReload,
  mode = "members",
}) {
  /* =====================================================
    STATE
  ===================================================== */

  const [loading, setLoading] = useState(true);

  const [inviting, setInviting] = useState(false);

  const [removing, setRemoving] = useState(false);

  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [filter, setFilter] = useState("all");

  const [filterDashboard, setFilterDashboard] = useState("all");

  const [inviteEmail, setInviteEmail] = useState("");

  const [allMembers, setAllMembers] = useState([]);

  const [toast, setToast] = useState(null);

  const [page, setPage] = useState(1);

  const [limit, setLimit] = useState(10);

  const [dashboardLimit, setDashboardLimit] = useState(5);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  /* =====================================================
    TOAST
  ===================================================== */

  const showToast = useCallback((message, type = "success") => {
    setToast({
      message,
      type,
    });

    window.setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  /* =====================================================
    MEMBERS
  ===================================================== */

  const members = allMembers;

  /* =====================================================
    LOAD FULL MEMBERS PAGE
  ===================================================== */

  const loadMembers = useCallback(async () => {
    if (!teamId) {
      setAllMembers([]);

      setPagination({
        page: 1,
        limit,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      });

      setLoading(false);

      return;
    }

    try {
      setLoading(true);

      const response = await fetchTeamMembers(teamId, {
        page,
        limit,
        search: debouncedSearch,
        filter,
      });

      const payload =
        response?.data?.pagination
          ? response.data
          : response;

      const membersData = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

      const paginationData = payload?.pagination || {};

      const total = Number(
        paginationData.total ?? membersData.length ?? 0,
      );

      const currentPage = Number(
        paginationData.page ?? page ?? 1,
      );

      const currentLimit = Number(
        paginationData.limit ?? limit ?? 10,
      );

      const totalPages = Math.max(
        1,
        Number(
          paginationData.totalPages ??
            Math.ceil(total / currentLimit),
        ),
      );

      setAllMembers(membersData);

      setPagination({
        page: currentPage,
        limit: currentLimit,
        total,
        totalPages,
        hasNextPage:
          paginationData.hasNextPage ??
          currentPage < totalPages,
        hasPrevPage:
          paginationData.hasPrevPage ??
          currentPage > 1,
      });
    } catch (error) {
      console.error("LOAD MEMBERS ERROR", error);

      showToast(
        error?.message || "Failed to load members",
        "error",
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
    showToast,
  ]);

  /* =====================================================
    LOAD DASHBOARD MEMBERS
  ===================================================== */

  const loadMembersDashboard = useCallback(async () => {
    if (!teamId) {
      setAllMembers([]);

      setPagination({
        page: 1,
        limit: dashboardLimit,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      });

      setLoading(false);

      return;
    }

    try {
      setLoading(true);

      const response = await fetchTeamMembersDashboard(
        teamId,
        {
          page,
          limit: dashboardLimit,
          search: debouncedSearch,
          filter: filterDashboard,
        },
      );

      /*
       * Hỗ trợ các response:
       *
       * [...]
       *
       * { data: [...] }
       *
       * { data: { data: [...] } }
       *
       * { members: [...] }
       */
      const payload =
        response?.data &&
        !Array.isArray(response.data) &&
        Array.isArray(response.data.data)
          ? response.data
          : response;

      const membersData = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.members)
            ? payload.members
            : [];

      const paginationData =
        payload?.pagination ||
        response?.pagination ||
        {};

      const total = Number(
        paginationData.total ?? membersData.length ?? 0,
      );

      const currentPage = Number(
        paginationData.page ?? page ?? 1,
      );

      const currentLimit = Number(
        paginationData.limit ??
          dashboardLimit ??
          5,
      );

      const totalPages = Math.max(
        1,
        Number(
          paginationData.totalPages ??
            Math.ceil(total / currentLimit),
        ),
      );

      setAllMembers(membersData);

      setPagination({
        page: currentPage,
        limit: currentLimit,
        total,
        totalPages,
        hasNextPage:
          paginationData.hasNextPage ??
          currentPage < totalPages,
        hasPrevPage:
          paginationData.hasPrevPage ??
          currentPage > 1,
      });
    } catch (error) {
      console.error(
        "LOAD DASHBOARD MEMBERS ERROR",
        error,
      );

      showToast(
        error?.message ||
          "Failed to load dashboard members",
        "error",
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
    showToast,
  ]);

  /* =====================================================
    CURRENT RELOAD
  ===================================================== */

  const reloadMembers = useCallback(async () => {
    if (mode === "dashboard") {
      return loadMembersDashboard();
    }

    return loadMembers();
  }, [
    mode,
    loadMembers,
    loadMembersDashboard,
  ]);

  /* =====================================================
    UPDATE MEMBER ROLE LOCALLY
  ===================================================== */

  const updateMemberRoleLocally = useCallback(
    (memberId, role) => {
      if (!memberId || !role) return;

      setAllMembers((currentMembers) =>
        currentMembers.map((member) => {
          const currentMemberId =
            member.id || member._id;

          if (
            String(currentMemberId) !==
            String(memberId)
          ) {
            return member;
          }

          return {
            ...member,

            /*
             * Role tài khoản đang được hiển thị
             * trong TeamMembersTable.
             */
            role,
          };
        }),
      );
    },
    [],
  );

  /* =====================================================
    REPLACE MEMBER LOCALLY
  ===================================================== */

  const replaceMemberLocally = useCallback(
    (updatedMember) => {
      const updatedMemberId =
        updatedMember?.id || updatedMember?._id;

      if (!updatedMemberId) return;

      setAllMembers((currentMembers) =>
        currentMembers.map((member) => {
          const currentMemberId =
            member.id || member._id;

          if (
            String(currentMemberId) !==
            String(updatedMemberId)
          ) {
            return member;
          }

          return {
            ...member,
            ...updatedMember,
          };
        }),
      );
    },
    [],
  );

  /* =====================================================
    INVITE MEMBER
  ===================================================== */

  const handleInviteMember = async (
    payload = {},
  ) => {
    const email = payload.email || inviteEmail;

    const role = payload.role || "agent";

    if (!teamId) {
      showToast("No team selected", "error");

      return false;
    }

    if (!email?.trim()) {
      showToast("Email is required", "error");

      return false;
    }

    try {
      setInviting(true);

      await inviteMember(teamId, {
        email: email.trim(),
        role,
      });

      showToast(
        "Invitation sent successfully",
      );

      setInviteEmail("");

      await Promise.all([
        reloadMembers(),
        onReload?.(),
      ]);

      return true;
    } catch (error) {
      console.error(
        "INVITE MEMBER ERROR",
        error,
      );

      showToast(
        error?.message ||
          "Failed to invite member",
        "error",
      );

      return false;
    } finally {
      setInviting(false);
    }
  };

  /* =====================================================
    REMOVE MEMBER
  ===================================================== */

  const handleRemoveMember = async (
    memberId,
  ) => {
    if (!teamId) {
      showToast("No team selected", "error");

      return false;
    }

    try {
      setRemoving(true);

      await removeMember(teamId, memberId);

      /*
       * Xóa ngay trên giao diện.
       */
      setAllMembers((currentMembers) =>
        currentMembers.filter((member) => {
          const currentMemberId =
            member.id || member._id;

          return (
            String(currentMemberId) !==
            String(memberId)
          );
        }),
      );

      showToast(
        "Member removed successfully",
      );

      await Promise.all([
        reloadMembers(),
        onReload?.(),
      ]);

      return true;
    } catch (error) {
      console.error(
        "REMOVE MEMBER ERROR",
        error,
      );

      showToast(
        error?.message ||
          "Failed to remove member",
        "error",
      );

      return false;
    } finally {
      setRemoving(false);
    }
  };

  /* =====================================================
    SEARCH DEBOUNCE
  ===================================================== */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [search]);

  /* =====================================================
    RESET PAGE
  ===================================================== */

  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    filter,
    filterDashboard,
  ]);

  /* =====================================================
    LOAD EFFECT
  ===================================================== */

  useEffect(() => {
    if (!teamId) {
      setAllMembers([]);
      setLoading(false);
      return;
    }

    reloadMembers();
  }, [teamId, reloadMembers]);

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

    inviteMember: handleInviteMember,

    removeMember: handleRemoveMember,

    reloadMembers,

    updateMemberRoleLocally,

    replaceMemberLocally,
  };
}