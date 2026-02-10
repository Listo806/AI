import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getMyTeams,
  getTeamSeats,
  getTeamMembers,
  createTeam,
  updateTeam,
  deleteTeam as deleteTeamApi,
  inviteTeamMemberByEmail,
  removeTeamMember,
} from '../../api/platformApi';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import './team.css';

export default function Team() {
  const { t } = useTranslation();
  const { user: currentUser, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [seats, setSeats] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createSeatLimit, setCreateSeatLimit] = useState(1);
  const [creating, setCreating] = useState(false);

  const [showEditForm, setShowEditForm] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSeatLimit, setEditSeatLimit] = useState(1);
  const [saving, setSaving] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [deleteConfirmTeam, setDeleteConfirmTeam] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const team = selectedTeam || (teams && teams[0]) || null;
  const isOwner = team && currentUser?.id === team.ownerId;

  const loadTeams = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyTeams();
      const list = Array.isArray(data) ? data : [];
      setTeams(list);
      setSelectedTeam((prev) => {
        if (!list?.length) return null;
        if (prev && list.some((t) => t.id === prev.id)) return prev;
        return list[0];
      });
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const loadSeatsAndMembers = async () => {
    if (!team?.id) {
      setSeats(null);
      setMembers([]);
      return;
    }
    try {
      const [seatsRes, membersRes] = await Promise.all([
        getTeamSeats(team.id),
        getTeamMembers(team.id),
      ]);
      setSeats(seatsRes || null);
      setMembers(Array.isArray(membersRes) ? membersRes : []);
    } catch (err) {
      setSeats(null);
      setMembers([]);
    }
  };

  useEffect(() => {
    if (isAuthenticated() && currentUser) loadTeams();
  }, [isAuthenticated, currentUser]);

  useEffect(() => {
    if (team?.id) loadSeatsAndMembers();
    else {
      setSeats(null);
      setMembers([]);
    }
  }, [team?.id]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!createName?.trim()) {
      showError(t('team.nameRequired') || 'Team name is required');
      return;
    }
    setCreating(true);
    try {
      const created = await createTeam({
        name: createName.trim(),
        seatLimit: createSeatLimit >= 1 ? createSeatLimit : 1,
      });
      showSuccess(t('team.created') || 'Team created');
      setShowCreateForm(false);
      setCreateName('');
      setCreateSeatLimit(1);
      await loadTeams();
      if (created?.id) setSelectedTeam(created);
    } catch (err) {
      showError(err.message || t('common.error'));
    } finally {
      setCreating(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!team?.id || !editName?.trim()) return;
    setSaving(true);
    try {
      await updateTeam(team.id, {
        name: editName.trim(),
        seatLimit: editSeatLimit >= 1 ? editSeatLimit : 1,
      });
      showSuccess(t('team.updated') || 'Team updated');
      setShowEditForm(false);
      await loadTeams();
      await loadSeatsAndMembers();
    } catch (err) {
      showError(err.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!team?.id || !inviteEmail?.trim()) return;
    setInviting(true);
    try {
      await inviteTeamMemberByEmail(team.id, inviteEmail.trim());
      showSuccess(t('team.memberAdded') || 'Member added');
      setInviteEmail('');
      await loadSeatsAndMembers();
    } catch (err) {
      showError(err.message || t('common.error'));
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!team?.id) return;
    setRemoving(userId);
    try {
      await removeTeamMember(team.id, userId);
      showSuccess(t('team.memberRemoved') || 'Member removed');
      await loadSeatsAndMembers();
    } catch (err) {
      showError(err.message || t('common.error'));
    } finally {
      setRemoving(null);
    }
  };

  const openEdit = () => {
    setEditName(team?.name ?? '');
    setEditSeatLimit(team?.seatLimit ?? 1);
    setShowEditForm(true);
  };

  const handleDeleteTeam = async () => {
    if (!deleteConfirmTeam?.id) return;
    setDeleting(true);
    try {
      await deleteTeamApi(deleteConfirmTeam.id);
      showSuccess(t('team.deleted') || 'Team deleted');
      setDeleteConfirmTeam(null);
      await loadTeams();
    } catch (err) {
      showError(err.message || t('common.error'));
    } finally {
      setDeleting(false);
    }
  };

  if (!isAuthenticated() || !currentUser) return null;

  if (loading) {
    return (
      <div className="team-page">
        <div className="team-seats-summary">
          <div className="crm-loading"><div className="crm-skeleton" /></div>
        </div>
      </div>
    );
  }

  const usedSeats = seats?.used ?? 0;
  const totalSeats = seats?.total ?? 0;
  const availableSeats = seats?.available ?? 0;

  return (
    <div className="team-page">
      <div className="team-header">
        <div>
          <h1 className="team-title">{t('team.title')}</h1>
          <p className="team-description">{t('team.description')}</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {teams.length > 1 && team && (
            <select
              value={team.id}
              onChange={(e) => setSelectedTeam(teams.find((t) => t.id === e.target.value))}
              className="team-input"
              style={{ minWidth: 180 }}
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
          {!showCreateForm && (
            <button type="button" className="team-add-btn" onClick={() => setShowCreateForm(true)}>
              + {t('team.createTeam')}
            </button>
          )}
          {team && isOwner && !showCreateForm && !showEditForm && (
            <>
              <button type="button" className="team-add-btn" onClick={() => setShowEditForm(true)}>
                {t('team.editTeam')}
              </button>
              <button
                type="button"
                className="team-add-btn"
                style={{ background: 'var(--error, #dc2626)', color: '#fff' }}
                onClick={() => setDeleteConfirmTeam(team)}
              >
                {t('team.deleteTeam')}
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="crm-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Create team form */}
      {showCreateForm && (
        <div className="team-seats-summary" style={{ marginBottom: 24 }}>
          <h3 className="team-seats-title">{t('team.createTeam')}</h3>
          <form onSubmit={handleCreateTeam}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>{t('team.teamName')}</label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                required
                className="team-input"
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>{t('team.seatLimit')}</label>
              <input
                type="number"
                min={1}
                value={createSeatLimit}
                onChange={(e) => setCreateSeatLimit(parseInt(e.target.value, 10) || 1)}
                className="team-input"
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="team-add-btn" disabled={creating}>
                {creating ? t('common.loading') : t('team.create')}
              </button>
              <button
                type="button"
                className="team-add-btn"
                style={{ background: 'var(--border)', color: 'var(--text)' }}
                onClick={() => { setShowCreateForm(false); setCreateName(''); }}
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit team form */}
      {showEditForm && team && (
        <div className="team-seats-summary" style={{ marginBottom: 24 }}>
          <h3 className="team-seats-title">{t('team.editTeam')}</h3>
          <form onSubmit={handleSaveEdit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>{t('team.teamName')}</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="team-input"
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>{t('team.seatLimit')}</label>
              <input
                type="number"
                min={1}
                value={editSeatLimit}
                onChange={(e) => setEditSeatLimit(parseInt(e.target.value, 10) || 1)}
                className="team-input"
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="team-add-btn" disabled={saving}>
                {saving ? t('common.loading') : t('common.save')}
              </button>
              <button
                type="button"
                className="team-add-btn"
                style={{ background: 'var(--border)', color: 'var(--text)' }}
                onClick={() => setShowEditForm(false)}
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* No team */}
      {!team && !showCreateForm && (
        <div className="team-empty-state">
          <div className="team-empty-icon">👥</div>
          <h3 className="team-empty-title">{t('team.noTeam')}</h3>
          <p className="team-empty-text">{t('team.createTeamDescription')}</p>
          <button
            type="button"
            className="team-add-btn"
            style={{ marginTop: 16 }}
            onClick={() => setShowCreateForm(true)}
          >
            + {t('team.createTeam')}
          </button>
        </div>
      )}

      {/* Team overview + members */}
      {team && !showCreateForm && (
        <>
          <div className="team-seats-summary" style={{ marginBottom: 24 }}>
            <h3 className="team-seats-title">
              {team.name}
              {isOwner && (
                <span className="team-owner-badge" style={{ marginLeft: 8, fontSize: 12, fontWeight: 500 }}>
                  {t('team.youAreOwner')}
                </span>
              )}
            </h3>
            <div className="team-seats-display">
              <span className="team-seats-used">{t('team.used')}: {usedSeats}</span>
              <span className="team-seats-separator">/</span>
              <span className="team-seats-available">{t('team.available')}: {availableSeats}</span>
              <span className="team-seats-separator">({t('team.total')} {totalSeats})</span>
            </div>
            {/* Billing/subscriptions helper hidden per request */}
          </div>

          {/* Invite by email (owner only) */}
          {isOwner && (
            <div className="team-seats-summary" style={{ marginBottom: 24 }}>
              <h3 className="team-seats-title">{t('team.inviteByEmail')}</h3>
              <form onSubmit={handleInvite} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={t('team.emailPlaceholder') || 'user@example.com'}
                  className="team-input"
                  style={{ flex: 1, minWidth: 200 }}
                />
                <button type="submit" className="team-add-btn" disabled={inviting || !inviteEmail?.trim()}>
                  {inviting ? t('common.loading') : t('team.addMember')}
                </button>
              </form>
            </div>
          )}

          {/* Members list */}
          <div className="team-members-list">
            <h3 className="team-seats-title">{t('team.members')}</h3>
            {members.length === 0 ? (
              <p className="team-empty-text" style={{ margin: 0 }}>{t('team.noMembers')}</p>
            ) : (
              <table className="admin-table" style={{ width: '100%', marginTop: 12 }}>
                <thead>
                  <tr>
                    <th>{t('team.email')}</th>
                    <th>{t('team.role')}</th>
                    <th>{t('team.status')}</th>
                    {isOwner && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td>
                        {m.email}
                        {m.isOwner && (
                          <span className="admin-status-badge approved" style={{ marginLeft: 8, fontSize: 11 }}>
                            {t('team.owner')}
                          </span>
                        )}
                      </td>
                      <td className="admin-table-muted">{m.role}</td>
                      <td>{m.isActive ? t('team.active') : t('team.inactive')}</td>
                      {isOwner && (
                        <td>
                          {!m.isOwner && m.id !== currentUser?.id && (
                            <button
                              type="button"
                              className="crm-btn crm-btn-secondary admin-action-btn"
                              onClick={() => handleRemoveMember(m.id)}
                              disabled={removing === m.id}
                            >
                              {removing === m.id ? '…' : t('team.remove')}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Delete team confirmation */}
      {deleteConfirmTeam && (
        <div className="admin-reject-modal-overlay" onClick={() => setDeleteConfirmTeam(null)}>
          <div className="admin-reject-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{t('team.deleteTeam')}</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
              {t('team.deleteConfirm')} <strong>{deleteConfirmTeam.name}</strong>? {t('team.deleteConfirmMembers')}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="crm-btn crm-btn-secondary" onClick={() => setDeleteConfirmTeam(null)}>
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="crm-btn"
                style={{ background: '#dc2626', color: '#fff' }}
                onClick={handleDeleteTeam}
                disabled={deleting}
              >
                {deleting ? t('common.loading') : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
