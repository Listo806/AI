import { useState, useEffect } from 'react';
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
  const { showSuccess, showError } = useNotification();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', seatLimit: 1, ownerId: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      showError('Team name is required');
      return;
    }
    if (!form.ownerId) {
      showError('Please select an owner');
      return;
    }
    setSubmitting(true);
    try {
      await createAdminTeam({
        name: form.name.trim(),
        seatLimit: form.seatLimit >= 1 ? form.seatLimit : 1,
        ownerId: form.ownerId,
      });
      showSuccess('Team created');
      onSuccess();
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to create team');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-reject-modal-overlay" onClick={onClose}>
      <div className="admin-reject-modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Create team</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #e5e7eb)' }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Seat limit</label>
            <input
              type="number"
              min={1}
              value={form.seatLimit}
              onChange={(e) => setForm((f) => ({ ...f, seatLimit: parseInt(e.target.value, 10) || 1 }))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #e5e7eb)' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Owner *</label>
            <select
              value={form.ownerId}
              onChange={(e) => setForm((f) => ({ ...f, ownerId: e.target.value }))}
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #e5e7eb)' }}
            >
              <option value="">Select user</option>
              {(users || []).filter((u) => u.isActive).map((u) => (
                <option key={u.id} value={u.id}>{u.email} ({u.role})</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="crm-btn crm-btn-secondary">Cancel</button>
            <button type="submit" className="crm-btn crm-btn-primary" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditTeamModal({ team, onClose, onSuccess, users }) {
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
      showError('Team name is required');
      return;
    }
    if (!form.ownerId) {
      showError('Please select an owner');
      return;
    }
    setSubmitting(true);
    try {
      await updateAdminTeam(team.id, {
        name: form.name.trim(),
        seatLimit: form.seatLimit >= 1 ? form.seatLimit : 1,
        ownerId: form.ownerId,
      });
      showSuccess('Team updated');
      onSuccess();
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to update team');
    } finally {
      setSubmitting(false);
    }
  };

  if (!team) return null;

  return (
    <div className="admin-reject-modal-overlay" onClick={onClose}>
      <div className="admin-reject-modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Edit team</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #e5e7eb)' }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Seat limit</label>
            <input
              type="number"
              min={1}
              value={form.seatLimit}
              onChange={(e) => setForm((f) => ({ ...f, seatLimit: parseInt(e.target.value, 10) || 1 }))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #e5e7eb)' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Owner *</label>
            <select
              value={form.ownerId}
              onChange={(e) => setForm((f) => ({ ...f, ownerId: e.target.value }))}
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #e5e7eb)' }}
            >
              <option value="">Select user</option>
              {(users || []).filter((u) => u.isActive).map((u) => (
                <option key={u.id} value={u.id}>{u.email} ({u.role})</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="crm-btn crm-btn-secondary">Cancel</button>
            <button type="submit" className="crm-btn crm-btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteTeamModal({ team, onClose, onConfirm }) {
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
        <h3 style={{ marginTop: 0 }}>Delete team</h3>
        <p style={{ color: 'var(--text-muted, #64748b)', marginBottom: '16px' }}>
          Delete <strong>{team.name}</strong>? All members will be unlinked from this team. This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} className="crm-btn crm-btn-secondary">Cancel</button>
          <button type="button" onClick={handleConfirm} className="crm-btn" style={{ background: '#dc2626', color: '#fff' }} disabled={submitting}>
            {submitting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function MembersModal({ teamId, onClose, onSuccess }) {
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
        if (!cancelled) showError(e.message || 'Failed to load');
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
      showSuccess('Member added');
      onSuccess?.();
    } catch (err) {
      showError(err.message || 'Failed to add member');
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
      showSuccess('Member removed');
      onSuccess?.();
    } catch (err) {
      showError(err.message || 'Failed to remove member');
    } finally {
      setRemoving(null);
    }
  };

  if (!teamId) return null;
  return (
    <div className="admin-reject-modal-overlay" onClick={onClose}>
      <div className="admin-reject-modal" style={{ minWidth: '420px', maxWidth: '90vw' }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Team members{team ? `: ${team.name}` : ''}</h3>
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
                <option value="">Add member…</option>
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
                {adding ? 'Adding…' : 'Add'}
              </button>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(team?.members ?? []).map((m) => (
                    <tr key={m.id}>
                      <td>
                        {m.email}
                        {m.isOwner && <span className="admin-status-badge approved" style={{ marginLeft: '8px', fontSize: '11px' }}>Owner</span>}
                      </td>
                      <td>{m.role}</td>
                      <td>{m.isActive ? 'Active' : 'Inactive'}</td>
                      <td>
                        {!m.isOwner && (
                          <button
                            type="button"
                            className="crm-btn crm-btn-secondary admin-action-btn"
                            onClick={() => handleRemove(m.id)}
                            disabled={removing === m.id}
                          >
                            {removing === m.id ? '…' : 'Remove'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(!team?.members?.length) && <p className="admin-table-muted" style={{ marginTop: '8px' }}>No members yet.</p>}
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={onClose} className="crm-btn crm-btn-secondary">Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminTeams() {
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
      setError(err.message || 'Failed to load teams');
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
    showSuccess('Team deleted');
    loadTeams();
    setDeleteTeam(null);
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div>Loading...</div>
      </div>
    );
  }
  if (!isAuthenticated() || !currentUser) return null;

  return (
    <div className="platform-page" style={{ maxWidth: '100%' }}>
      <div className="platform-header" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1>Admin: Teams</h1>
          <p className="platform-subtitle">
            Create, edit, and manage teams. Add or remove members.
          </p>
        </div>
        <button type="button" className="crm-btn crm-btn-primary" onClick={() => setShowCreate(true)}>
          Create team
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
        <div className="properties-empty">No teams yet.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Owner</th>
                <th>Seats</th>
                <th>Members</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTeams.map((t) => (
                <tr key={t.id}>
                  <td><strong>{t.name}</strong></td>
                  <td className="admin-table-muted">{t.ownerEmail || t.ownerId || '—'}</td>
                  <td>{t.seatLimit ?? '—'}</td>
                  <td>{t.memberCount ?? 0}</td>
                  <td className="admin-table-muted">{formatDate(t.createdAt)}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button type="button" className="crm-btn crm-btn-secondary admin-action-btn" onClick={() => setEditTeam(t)}>
                        Edit
                      </button>
                      <button type="button" className="crm-btn crm-btn-primary admin-action-btn" onClick={() => setMembersTeamId(t.id)}>
                        Members
                      </button>
                      <button
                        type="button"
                        className="crm-btn admin-action-btn"
                        style={{ background: '#dc2626', color: '#fff' }}
                        onClick={() => setDeleteTeam(t)}
                      >
                        Delete
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
