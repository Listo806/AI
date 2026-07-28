import {
  ArrowLeft,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  fetchTeams,
  removeTeam,
  updateExistingTeam,
  updateTeamSeatLimit,
} from "./services/team.service";

import "./team.css";

export default function TeamManagePage() {
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");

  const [search, setSearch] = useState("");
  const [ownershipFilter, setOwnershipFilter] = useState("all");

  const [page, setPage] = useState(1);
  const limit = 8;

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

  const loadTeams = async () => {
    try {
      setLoading(true);

      const response = await fetchTeams();

      const rows = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      setTeams(rows);
    } catch (error) {
      console.error("LOAD MANAGE TEAMS ERROR", error);

      showToast(error?.message || "Unable to load teams", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, ownershipFilter]);

  const filteredTeams = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return teams.filter((team) => {
      const matchesSearch =
        !keyword ||
        String(team?.name || "")
          .toLowerCase()
          .includes(keyword) ||
        String(team?.ownerName || "")
          .toLowerCase()
          .includes(keyword) ||
        String(team?.ownerEmail || "")
          .toLowerCase()
          .includes(keyword);

      const matchesOwnership =
        ownershipFilter === "all" ||
        (ownershipFilter === "owned" && team?.isOwner !== false) ||
        (ownershipFilter === "member" && team?.isOwner === false);

      return matchesSearch && matchesOwnership;
    });
  }, [teams, search, ownershipFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTeams.length / limit));

  const paginatedTeams = filteredTeams.slice((page - 1) * limit, page * limit);

  const stats = useMemo(() => {
    return teams.reduce(
      (result, team) => {
        result.totalTeams += 1;
        result.totalMembers += Number(team?.memberCount || 0);
        result.pendingInvites += Number(team?.pendingInviteCount || 0);
        result.totalSeats += Number(team?.seatLimit || 0);

        return result;
      },
      {
        totalTeams: 0,
        totalMembers: 0,
        pendingInvites: 0,
        totalSeats: 0,
      },
    );
  }, [teams]);

  const handleViewTeam = (team) => {
    navigate(`/dashboard/team?teamId=${encodeURIComponent(team.id)}`);
  };

  const handleViewMembers = (team) => {
    navigate(`/dashboard/team/members?teamId=${encodeURIComponent(team.id)}`);
  };

  const handleViewInvites = (team) => {
    navigate(`/dashboard/team/invites?teamId=${encodeURIComponent(team.id)}`);
  };

  const handleEditTeam = async (team) => {
    if (team?.isOwner === false) {
      showToast("Only the team owner can edit this team", "error");

      return;
    }

    const nextName = window.prompt("Enter the new team name", team?.name || "");

    if (!nextName?.trim()) {
      return;
    }

    if (nextName.trim() === team?.name) {
      return;
    }

    try {
      setActionLoading(`edit-${team.id}`);

      await updateExistingTeam(team.id, {
        name: nextName.trim(),
      });

      setTeams((current) =>
        current.map((item) =>
          item.id === team.id
            ? {
                ...item,
                name: nextName.trim(),
              }
            : item,
        ),
      );

      showToast("Team updated successfully");
    } catch (error) {
      console.error("UPDATE TEAM ERROR", error);

      showToast(error?.message || "Unable to update team", "error");
    } finally {
      setActionLoading("");
    }
  };

  const handleAddSeat = async (team) => {
    if (team?.isOwner === false) {
      showToast("Only the team owner can add seats", "error");

      return;
    }

    const currentLimit = Number(team?.seatLimit || 0);

    const nextLimit = currentLimit + 1;

    try {
      setActionLoading(`seat-${team.id}`);

      await updateTeamSeatLimit(team.id, nextLimit);

      setTeams((current) =>
        current.map((item) =>
          item.id === team.id
            ? {
                ...item,
                seatLimit: nextLimit,
                availableSeats: Number(item?.availableSeats || 0) + 1,
              }
            : item,
        ),
      );

      showToast(`Seat limit increased to ${nextLimit}`);
    } catch (error) {
      console.error("ADD TEAM SEAT ERROR", error);

      showToast(error?.message || "Unable to add seat", "error");
    } finally {
      setActionLoading("");
    }
  };

  const handleDeleteTeam = async (team) => {
    if (team?.isOwner === false) {
      showToast("Only the team owner can delete this team", "error");

      return;
    }

    const confirmed = window.confirm(
      `Delete "${team.name}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(`delete-${team.id}`);

      await removeTeam(team.id);

      setTeams((current) => current.filter((item) => item.id !== team.id));

      showToast("Team deleted successfully");
    } catch (error) {
      console.error("DELETE TEAM ERROR", error);

      showToast(error?.message || "Unable to delete team", "error");
    } finally {
      setActionLoading("");
    }
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

          <h1>Manage Teams</h1>

          <p>Manage team details, members, seats and invitations.</p>
        </div>

        {/*<button
          type="button"
          className="team-primary-action"
          onClick={() => navigate("/dashboard/team")}
        >
          <Plus size={18} />
          Create Team
        </button>*/}
      </div>

      <div className="team-subpage-stats">
        <TeamManageStat
          icon={Building2}
          label="Total Teams"
          value={stats.totalTeams}
        />

        <TeamManageStat
          icon={Users}
          label="Active Members"
          value={stats.totalMembers}
        />

        <TeamManageStat
          icon={Mail}
          label="Pending Invites"
          value={stats.pendingInvites}
        />

        <TeamManageStat
          icon={Plus}
          label="Total Seats"
          value={stats.totalSeats}
        />
      </div>

      <div className="team-subpage-panel">
        <div className="team-subpage-toolbar">
          <div className="team-subpage-search">
            <Search size={18} />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search teams..."
            />
          </div>

          <select
            value={ownershipFilter}
            onChange={(event) => setOwnershipFilter(event.target.value)}
            className="team-subpage-select"
          >
            <option value="all">All teams</option>

            <option value="owned">Teams I own</option>

            <option value="member">Teams I joined</option>
          </select>
        </div>

        <div className="team-subpage-table-wrap">
          <table className="team-subpage-table">
            <thead>
              <tr>
                <th>Team</th>
                <th>Owner</th>
                <th>Members</th>
                <th>Seats</th>
                <th>Pending Invites</th>
                <th>Status</th>
                <th className="team-actions-column">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7">
                    <div className="team-empty-state">Loading teams...</div>
                  </td>
                </tr>
              ) : paginatedTeams.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="team-empty-state">
                      <Building2 size={32} />

                      <strong>No teams found</strong>

                      <span>Try changing your search or filters.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTeams.map((team) => {
                  const memberCount = Number(team?.memberCount || 0);

                  const seatLimit = Number(team?.seatLimit || 0);

                  const isFull = seatLimit > 0 && memberCount >= seatLimit;

                  return (
                    <tr key={team.id}>
                      <td>
                        <div className="team-name-cell">
                          <div className="team-name-avatar">
                            {String(team?.name || "T")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>{team?.name || "Untitled Team"}</strong>

                            <span>
                              {team?.isOwner === false ? "Member" : "Owner"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="team-owner-cell">
                          <strong>{team?.ownerName || "Team Owner"}</strong>

                          <span>{team?.ownerEmail || "—"}</span>
                        </div>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="team-table-link"
                          onClick={() => handleViewMembers(team)}
                        >
                          {memberCount} members
                        </button>
                      </td>

                      <td>
                        <div className="team-seat-cell">
                          <strong>
                            {memberCount}/{seatLimit}
                          </strong>

                          <span>
                            {Math.max(0, seatLimit - memberCount)} available
                          </span>
                        </div>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="team-table-link"
                          onClick={() => handleViewInvites(team)}
                        >
                          {Number(team?.pendingInviteCount || 0)} pending
                        </button>
                      </td>

                      <td>
                        <span
                          className={`team-status-pill ${
                            isFull ? "is-warning" : "is-active"
                          }`}
                        >
                          {isFull ? "Full" : "Active"}
                        </span>
                      </td>

                      <td>
                        <div className="team-table-actions">
                          <button
                            type="button"
                            title="View team"
                            onClick={() => handleViewTeam(team)}
                          >
                            <Eye size={17} />
                          </button>

                          <button
                            type="button"
                            title="Edit team"
                            disabled={
                              team?.isOwner === false ||
                              actionLoading === `edit-${team.id}`
                            }
                            onClick={() => handleEditTeam(team)}
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            title="Add seat"
                            disabled={
                              team?.isOwner === false ||
                              actionLoading === `seat-${team.id}`
                            }
                            onClick={() => handleAddSeat(team)}
                          >
                            <Plus size={17} />
                          </button>

                          <button
                            type="button"
                            title="Pending invites"
                            onClick={() => handleViewInvites(team)}
                          >
                            <Mail size={17} />
                          </button>

                          <button
                            type="button"
                            title="Delete team"
                            className="is-danger"
                            disabled={
                              team?.isOwner === false ||
                              actionLoading === `delete-${team.id}`
                            }
                            onClick={() => handleDeleteTeam(team)}
                          >
                            <Trash2 size={17} />
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
            Showing {filteredTeams.length ? (page - 1) * limit + 1 : 0}–
            {Math.min(page * limit, filteredTeams.length)} of{" "}
            {filteredTeams.length}
          </span>

          <div>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft size={17} />
            </button>

            <strong>
              Page {page} of {totalPages}
            </strong>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
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

function TeamManageStat({ icon: Icon, label, value }) {
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
