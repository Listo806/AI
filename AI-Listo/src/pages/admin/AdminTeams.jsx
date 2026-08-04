import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getAdminTeams,
  getAdminTeamById,
  createAdminTeam,
  updateAdminTeam,
  deleteAdminTeam,
  addAdminTeamMember,
  removeAdminTeamMember,
  getAdminUsers,
} from '../../api/platformApi';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import AdminPagination from './AdminPagination';
import '../platform/platform.css';
import './admin.css';

function CreateTeamModal({ onClose, onSuccess, users }) {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotification();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', seatLimit: 1, ownerId: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      showError(t('admin.teams.teamNameRequired'));
      return;
    }
    if (!form.ownerId) {
      showError(t('admin.teams.selectOwner'));
      return;
    }
    setSubmitting(true);
    try {
      await createAdminTeam({
        name: form.name.trim(),
        seatLimit: form.seatLimit >= 1 ? form.seatLimit : 1,
        ownerId: form.ownerId,
      });
      showSuccess(t('admin.teams.teamCreated'));
      onSuccess();
      onClose();
    } catch (err) {
      showError(err.message || t('admin.teams.createFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-reject-modal-overlay" onClick={onClose}>
      <div className="admin-reject-modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{t('admin.teams.createTeam')}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>{t('admin.plans.name')} *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #e5e7eb)' }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>{t('admin.plans.seatLimit')}</label>
            <input
              type="number"
              min={1}
              value={form.seatLimit}
              onChange={(e) => setForm((f) => ({ ...f, seatLimit: parseInt(e.target.value, 10) || 1 }))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #e5e7eb)' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>{t('admin.teams.owner')} *</label>
            <select
              value={form.ownerId}
              onChange={(e) => setForm((f) => ({ ...f, ownerId: e.target.value }))}
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #e5e7eb)' }}
            >
              <option value="">{t('admin.teams.selectUser')}</option>
              {(users || []).filter((u) => u.isActive).map((u) => (
                <option key={u.id} value={u.id}>{u.email} ({u.role})</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="crm-btn crm-btn-secondary">{t('admin.teams.cancel')}</button>
            <button type="submit" className="crm-btn crm-btn-primary" disabled={submitting}>
              {submitting ? t('admin.teams.creating') : t('admin.teams.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditTeamModal({ team, onClose, onSuccess, users }) {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotification();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: team?.name ?? '',
    seatLimit: team?.seatLimit ?? 1,
    ownerId: team?.ownerId ?? '',
  });

  useEffect(() => {
    if (team) {
      setForm({ name: team.name ?? '', seatLimit: team.seatLimit ?? 1, ownerId: team.ownerId ?? '' });
    }
  }, [team]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      showError(t('admin.teams.teamNameRequired'));
      return;
    }
    if (!form.ownerId) {
      showError(t('admin.teams.selectOwner'));
      return;
    }
    setSubmitting(true);
    try {
      await updateAdminTeam(team.id, {
        name: form.name.trim(),
        seatLimit: form.seatLimit >= 1 ? form.seatLimit : 1,
        ownerId: form.ownerId,
      });
      showSuccess(t('admin.teams.teamUpdated'));
      onSuccess();
      onClose();
    } catch (err) {
      showError(err.message || t('admin.teams.updateFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!team) return null;

  return (
    <div className="admin-reject-modal-overlay" onClick={onClose}>
      <div className="admin-reject-modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{t('admin.teams.editTeam')}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>{t('admin.plans.name')} *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #e5e7eb)' }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>{t('admin.plans.seatLimit')}</label>
            <input
              type="number"
              min={1}
              value={form.seatLimit}
              onChange={(e) => setForm((f) => ({ ...f, seatLimit: parseInt(e.target.value, 10) || 1 }))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #e5e7eb)' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>{t('admin.teams.owner')} *</label>
            <select
              value={form.ownerId}
              onChange={(e) => setForm((f) => ({ ...f, ownerId: e.target.value }))}
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #e5e7eb)' }}
            >
              <option value="">{t('admin.teams.selectUser')}</option>
              {(users || []).filter((u) => u.isActive).map((u) => (
                <option key={u.id} value={u.id}>{u.email} ({u.role})</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="crm-btn crm-btn-secondary">{t('admin.teams.cancel')}</button>
            <button type="submit" className="crm-btn crm-btn-primary" disabled={submitting}>
              {submitting ? t('admin.teams.saving') : t('admin.teams.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteTeamModal({ team, onClose, onConfirm }) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };
  if (!team) return null;
  return (
    <div className="admin-reject-modal-overlay" onClick={onClose}>
      <div className="admin-reject-modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{t('admin.teams.deleteTeam')}</h3>
        <p style={{ color: 'var(--text-muted, #64748b)', marginBottom: '16px' }}>
          {t('admin.teams.deleteConfirmPrefix')} <strong>{team.name}</strong>{t('admin.teams.deleteConfirmSuffix')}
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} className="crm-btn crm-btn-secondary">{t('admin.teams.cancel')}</button>
          <button type="button" onClick={handleConfirm} className="crm-btn" style={{ background: '#dc2626', color: '#fff' }} disabled={submitting}>
            {submitting ? t('admin.teams.deleting') : t('admin.teams.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

function MembersModal({ teamId, onClose, onSuccess }) {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotification();
  const [team, setTeam] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addUserId, setAddUserId] = useState('');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [teamRes, usersRes] = await Promise.all([
          getAdminTeamById(teamId),
          getAdminUsers(),
        ]);
        if (!cancelled) {
          setTeam(teamRes);
          setUsers(Array.isArray(usersRes) ? usersRes : []);
        }
      } catch (e) {
        if (!cancelled) showError(e.message || t('admin.teams.loadFailed'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [teamId]);

  const memberIds = team?.members?.map((m) => m.id) ?? [];
  const availableUsers = users.filter((u) => u.isActive && !memberIds.includes(u.id));

  const handleAdd = async () => {
    if (!addUserId) return;
    setAdding(true);
    try {
      await addAdminTeamMember(teamId, addUserId);
      const updated = await getAdminTeamById(teamId);
      setTeam(updated);
      setAddUserId('');
      showSuccess(t('admin.teams.memberAdded'));
      onSuccess?.();
    } catch (err) {
      showError(err.message || t('admin.teams.addMemberFailed'));
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (userId) => {
    setRemoving(userId);
    try {
      await removeAdminTeamMember(teamId, userId);
      const updated = await getAdminTeamById(teamId);
      setTeam(updated);
      showSuccess(t('admin.teams.memberRemoved'));
      onSuccess?.();
    } catch (err) {
      showError(err.message || t('admin.teams.removeMemberFailed'));
    } finally {
      setRemoving(null);
    }
  };

  if (!teamId) return null;
  return (
    <div className="admin-reject-modal-overlay" onClick={onClose}>
      <div className="admin-reject-modal" style={{ minWidth: '420px', maxWidth: '90vw' }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{team ? t('admin.teams.membersTitleNamed', { name: team.name }) : t('admin.teams.membersTitle')}</h3>
        {loading ? (
          <div className="crm-loading"><div className="crm-skeleton" /></div>
        ) : (
          <>
            <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                value={addUserId}
                onChange={(e) => setAddUserId(e.target.value)}
                style={{ flex: 1, minWidth: '180px', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #e5e7eb)' }}
              >
                <option value="">{t('admin.teams.addMember')}</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.email} ({u.role})</option>
                ))}
              </select>
              <button
                type="button"
                className="crm-btn crm-btn-primary"
                onClick={handleAdd}
                disabled={!addUserId || adding}
              >
                {adding ? t('admin.teams.adding') : t('admin.teams.add')}
              </button>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('admin.teams.email')}</th>
                    <th>{t('admin.teams.role')}</th>
                    <th>{t('admin.plans.status')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(team?.members ?? []).map((m) => (
                    <tr key={m.id}>
                      <td>
                        {m.email}
                        {m.isOwner && <span className="admin-status-badge approved" style={{ marginLeft: '8px', fontSize: '11px' }}>{t('admin.teams.owner')}</span>}
                      </td>
                      <td>{m.role}</td>
                      <td>{m.isActive ? t('admin.plans.active') : t('admin.plans.inactive')}</td>
                      <td>
                        {!m.isOwner && (
                          <button
                            type="button"
                            className="crm-btn crm-btn-secondary admin-action-btn"
                            onClick={() => handleRemove(m.id)}
                            disabled={removing === m.id}
                          >
                            {removing === m.id ? '…' : t('admin.teams.remove')}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(!team?.members?.length) && <p className="admin-table-muted" style={{ marginTop: '8px' }}>{t('admin.teams.noMembers')}</p>}
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={onClose} className="crm-btn crm-btn-secondary">{t('admin.teams.close')}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminTeams() {
  const { t } = useTranslation();
  const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showCreate, setShowCreate] = useState(false);
  const [editTeam, setEditTeam] = useState(null);
  const [deleteTeam, setDeleteTeam] = useState(null);
  const [membersTeamId, setMembersTeamId] = useState(null);

  const loadTeams = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminTeams();
      setTeams(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || t('admin.teams.loadTeamsFailed'));
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await getAdminUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (_) {}
  };

  useEffect(() => {
    if (isAuthenticated() && currentUser) {
      loadTeams();
      loadUsers();
    }
  }, [isAuthenticated, currentUser]);

  const paginatedTeams = teams.slice((page - 1) * pageSize, page * pageSize);

  const handleDeleteConfirm = async () => {
    if (!deleteTeam) return;
    await deleteAdminTeam(deleteTeam.id);
    showSuccess(t('admin.teams.teamDeleted'));
    loadTeams();
    setDeleteTeam(null);
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div>{t('admin.teams.loading')}</div>
      </div>
    );
  }
  if (!isAuthenticated() || !currentUser) return null;

  return (
    <div className="platform-page" style={{ maxWidth: '100%' }}>
      <div className="platform-header" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1>{t('admin.teams.pageTitle')}</h1>
          <p className="platform-subtitle">
            {t('admin.teams.pageSubtitle')}
          </p>
        </div>
        <button type="button" className="crm-btn crm-btn-primary" onClick={() => setShowCreate(true)}>
          {t('admin.teams.createTeam')}
        </button>
      </div>

      {error && <div className="crm-error">{error}</div>}

      {loading ? (
        <div className="crm-loading">
          <div className="crm-skeleton" />
          <div className="crm-skeleton" />
          <div className="crm-skeleton" />
        </div>
      ) : teams.length === 0 ? (
        <div className="properties-empty">{t('admin.teams.noTeams')}</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.plans.name')}</th>
                <th>{t('admin.teams.owner')}</th>
                <th>{t('admin.plans.seats')}</th>
                <th>{t('admin.teams.members')}</th>
                <th>{t('admin.teams.created')}</th>
                <th>{t('admin.teams.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTeams.map((team) => (
                <tr key={team.id}>
                  <td><strong>{team.name}</strong></td>
                  <td className="admin-table-muted">{team.ownerEmail || team.ownerId || '—'}</td>
                  <td>{team.seatLimit ?? '—'}</td>
                  <td>{team.memberCount ?? 0}</td>
                  <td className="admin-table-muted">{formatDate(team.createdAt)}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button type="button" className="crm-btn crm-btn-secondary admin-action-btn" onClick={() => setEditTeam(team)}>
                        {t('admin.teams.edit')}
                      </button>
                      <button type="button" className="crm-btn crm-btn-primary admin-action-btn" onClick={() => setMembersTeamId(team.id)}>
                        {t('admin.teams.members')}
                      </button>
                      <button
                        type="button"
                        className="crm-btn admin-action-btn"
                        style={{ background: '#dc2626', color: '#fff' }}
                        onClick={() => setDeleteTeam(team)}
                      >
                        {t('admin.teams.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && teams.length > 0 && (
        <AdminPagination
          total={teams.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        />
      )}

      {showCreate && (
        <CreateTeamModal onClose={() => setShowCreate(false)} onSuccess={loadTeams} users={users} />
      )}
      {editTeam && (
        <EditTeamModal team={editTeam} onClose={() => setEditTeam(null)} onSuccess={loadTeams} users={users} />
      )}
      {deleteTeam && (
        <DeleteTeamModal team={deleteTeam} onClose={() => setDeleteTeam(null)} onConfirm={handleDeleteConfirm} />
      )}
      {membersTeamId && (
        <MembersModal
          teamId={membersTeamId}
          onClose={() => setMembersTeamId(null)}
          onSuccess={loadTeams}
        />
      )}
    </div>
  );
}
