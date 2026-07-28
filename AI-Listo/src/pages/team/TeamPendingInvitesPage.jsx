import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Mail,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  cancelPendingTeamInvite,
  fetchPendingTeamInvites,
  fetchTeams,
  resendPendingTeamInvite,
} from "./services/team.service";

import "./team.css";

export default function TeamPendingInvitesPage() {
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();

  const initialTeamId = searchParams.get("teamId") || "";

  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(initialTeamId);

  const [invites, setInvites] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");

  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({
      message,
      type,
    });

    window.setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const response = await fetchTeams();

        const rows = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];

        setTeams(rows);

        if (!selectedTeamId && rows.length > 0) {
          setSelectedTeamId(rows[0].id);
        }
      } catch (error) {
        console.error("LOAD INVITE TEAMS ERROR", error);

        showToast(error?.message || "Unable to load teams", "error");
      }
    };

    loadTeams();
  }, []);

  useEffect(() => {
    if (!selectedTeamId) {
      return;
    }

    setSearchParams(
      {
        teamId: selectedTeamId,
      },
      {
        replace: true,
      },
    );
  }, [selectedTeamId, setSearchParams]);

  const loadInvites = useCallback(
    async (requestedPage = 1) => {
      if (!selectedTeamId) {
        setInvites([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response = await fetchPendingTeamInvites(selectedTeamId, {
          page: requestedPage,
          limit: pagination.limit,
          search: search.trim(),
          role,
        });
        console.log('fetchPendingTeamInvites:');
        console.log(response);
        setInvites(Array.isArray(response?.data) ? response.data : []);

        setPagination((current) => ({
          ...current,
          ...(response?.pagination || {}),
        }));
      } catch (error) {
        console.error("LOAD PENDING INVITES ERROR", error);

        setInvites([]);

        showToast(error?.message || "Unable to load invitations", "error");
      } finally {
        setLoading(false);
      }
    },
    [selectedTeamId, search, role, pagination.limit],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadInvites(1);
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [selectedTeamId, search, role, loadInvites]);

  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === selectedTeamId) || null,
    [teams, selectedTeamId],
  );

  const stats = useMemo(() => {
    const expired = invites.filter(
      (invite) =>
        invite?.isExpired ||
        (invite?.expiresAt &&
          new Date(invite.expiresAt).getTime() < Date.now()),
    ).length;

    return {
      pending: Number(pagination?.total || 0),
      expiringSoon: invites.filter((invite) => {
        if (!invite?.expiresAt) {
          return false;
        }

        const difference = new Date(invite.expiresAt).getTime() - Date.now();

        return difference > 0 && difference <= 2 * 24 * 60 * 60 * 1000;
      }).length,
      expired,
      availableSeats: Number(selectedTeam?.availableSeats || 0),
    };
  }, [invites, pagination.total, selectedTeam]);

  const handleResend = async (invite) => {
    try {
      setActionLoading(`resend-${invite.id}`);

      await resendPendingTeamInvite(selectedTeamId, invite.id);

      showToast(`Invitation resent to ${invite.email}`);

      await loadInvites(pagination.page);
    } catch (error) {
      console.error("RESEND TEAM INVITE ERROR", error);

      showToast(error?.message || "Unable to resend invitation", "error");
    } finally {
      setActionLoading("");
    }
  };

  const handleCancel = async (invite) => {
    const confirmed = window.confirm(
      `Cancel the invitation for ${invite.email}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(`cancel-${invite.id}`);

      await cancelPendingTeamInvite(selectedTeamId, invite.id);

      showToast("Invitation cancelled successfully");

      const nextPage =
        invites.length === 1 && pagination.page > 1
          ? pagination.page - 1
          : pagination.page;

      await loadInvites(nextPage);
    } catch (error) {
      console.error("CANCEL TEAM INVITE ERROR", error);

      showToast(error?.message || "Unable to cancel invitation", "error");
    } finally {
      setActionLoading("");
    }
  };

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  const getExpiryText = (invite) => {
    if (!invite?.expiresAt) {
      return "No expiration";
    }

    const expiresAt = new Date(invite.expiresAt).getTime();

    const difference = expiresAt - Date.now();

    if (invite?.isExpired || difference <= 0) {
      return "Expired";
    }

    const days = Math.ceil(difference / (24 * 60 * 60 * 1000));

    if (days === 1) {
      return "Expires in 1 day";
    }

    return `Expires in ${days} days`;
  };

  return (
    <div className="team-subpage">
      <div className="team-subpage-header">
        <div>
          <button
            type="button"
            className="team-subpage-back"
            onClick={() => navigate("/dashboard/team")}
          >
            <ArrowLeft size={17} />
            Back to Team Workspace
          </button>

          <h1>Pending Invitations</h1>

          <p>Review, resend or cancel pending team invitations.</p>
        </div>

        {/*<button
          type="button"
          className="team-primary-action"
          onClick={() =>
            navigate(
              `/dashboard/team?teamId=${encodeURIComponent(
                selectedTeamId || "",
              )}`,
            )
          }
        >
          <Mail size={18} />
          Invite Team Member
        </button>*/}
      </div>

      <div className="team-subpage-stats">
        <InviteStat icon={Mail} label="Pending Invites" value={stats.pending} />

        <InviteStat
          icon={CalendarClock}
          label="Expiring Soon"
          value={stats.expiringSoon}
        />

        <InviteStat icon={Clock3} label="Expired" value={stats.expired} />

        <InviteStat
          icon={Users}
          label="Available Seats"
          value={stats.availableSeats}
        />
      </div>

      <div className="team-subpage-panel">
        <div className="team-subpage-toolbar">
          <div className="team-subpage-search">
            <Search size={18} />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search email..."
            />
          </div>

          <div className="team-subpage-toolbar-right">
            <select
              value={selectedTeamId}
              onChange={(event) => setSelectedTeamId(event.target.value)}
              className="team-subpage-select"
            >
              {teams.length === 0 && (
                <option value="">No teams available</option>
              )}

              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>

            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="team-subpage-select"
            >
              <option value="all">All roles</option>

              <option value="admin">Admin</option>

              <option value="manager">Manager</option>

              <option value="agent">Agent</option>

              <option value="viewer">Viewer</option>
            </select>
          </div>
        </div>

        <div className="team-subpage-table-wrap">
          <table className="team-subpage-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Team</th>
                <th>Role</th>
                <th>Invited By</th>
                <th>Sent</th>
                <th>Expiration</th>
                <th>Status</th>
                <th className="team-actions-column">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8">
                    <div className="team-empty-state">
                      Loading invitations...
                    </div>
                  </td>
                </tr>
              ) : invites.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="team-empty-state">
                      <CheckCircle2 size={34} />

                      <strong>No pending invitations</strong>

                      <span>
                        All invitations have been accepted or cancelled.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                invites.map((invite) => {
                  const expired =
                    invite?.isExpired ||
                    (invite?.expiresAt &&
                      new Date(invite.expiresAt).getTime() < Date.now());

                  return (
                    <tr key={invite.id}>
                      <td>
                        <div className="team-invite-email">
                          <div>
                            <Mail size={17} />
                          </div>

                          <strong>{invite.email}</strong>
                        </div>
                      </td>

                      <td>{invite?.teamName || selectedTeam?.name || "—"}</td>

                      <td>
                        <span className="team-role-pill">
                          {invite?.role || "agent"}
                        </span>
                      </td>

                      <td>
                        <div className="team-owner-cell">
                          <strong>
                            {invite?.invitedByName || "Team Owner"}
                          </strong>

                          <span>{invite?.invitedByEmail || "—"}</span>
                        </div>
                      </td>

                      <td>{formatDate(invite?.createdAt)}</td>

                      <td>
                        <div className="team-expiry-cell">
                          <strong className={expired ? "is-expired" : ""}>
                            {getExpiryText(invite)}
                          </strong>

                          <span>{formatDate(invite?.expiresAt)}</span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`team-status-pill ${
                            expired ? "is-warning" : "is-pending"
                          }`}
                        >
                          {expired ? "Expired" : "Pending"}
                        </span>
                      </td>

                      <td>
                        <div className="team-invite-actions">
                          <button
                            type="button"
                            className="team-resend-btn"
                            disabled={actionLoading === `resend-${invite.id}`}
                            onClick={() => handleResend(invite)}
                          >
                            <RefreshCw size={16} />

                            {actionLoading === `resend-${invite.id}`
                              ? "Sending..."
                              : "Resend"}
                          </button>

                          <button
                            type="button"
                            className="team-cancel-btn"
                            disabled={actionLoading === `cancel-${invite.id}`}
                            onClick={() => handleCancel(invite)}
                          >
                            <Trash2 size={16} />
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="team-subpage-pagination">
          <span>
            Showing {invites.length} of {pagination.total} invitations
          </span>

          <div>
            <button
              type="button"
              disabled={pagination.page <= 1 || loading}
              onClick={() => loadInvites(pagination.page - 1)}
            >
              <ChevronLeft size={17} />
            </button>

            <strong>
              Page {pagination.page} of {Math.max(1, pagination.totalPages)}
            </strong>

            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => loadInvites(pagination.page + 1)}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div
          className={`team-page-toast ${
            toast.type === "error" ? "is-error" : "is-success"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

function InviteStat({ icon: Icon, label, value }) {
  return (
    <div className="team-subpage-stat-card">
      <div className="team-subpage-stat-icon">
        <Icon size={20} />
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}
