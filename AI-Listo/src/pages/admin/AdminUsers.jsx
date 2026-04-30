import { useState, useEffect } from 'react';
import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  updateAdminUserRole,
  deleteAdminUser,
} from '../../api/platformApi';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import AdminPagination from './AdminPagination';
import '../platform/platform.css';
import './admin.css';

const ROLE_OPTIONS = [
  'owner',
  'agent',
  'admin',
  'va',
  'va_uploader',
  'user',
  'super_admin',
  'developer',
  'wholesaler',
  'investor',
];

const ROLE_OPTIONS_CREATE = ROLE_OPTIONS.filter((r) => r !== 'super_admin');

function CreateUserModal({ onClose, onSuccess }) {
  const { showSuccess, showError } = useNotification();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'user',
    teamId: '',
    isActive: true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email?.trim() || !form.password?.trim()) {
      showError('Email and password are required');
      return;
    }
    if (form.password.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    try {
      await createAdminUser({
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        teamId: form.teamId?.trim() || null,
        isActive: form.isActive,
      });
      showSuccess('User created');
      onSuccess();
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-reject-modal-overlay" onClick={onClose}>
      <div className="admin-reject-modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Create user</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #e5e7eb)' }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Password * (min 6)</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              minLength={6}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #e5e7eb)' }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #e5e7eb)' }}
            >
              {ROLE_OPTIONS_CREATE.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Team ID (optional)</label>
            <input
              type="text"
              value={form.teamId}
              onChange={(e) => setForm((f) => ({ ...f, teamId: e.target.value }))}
              placeholder="UUID or leave empty"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #e5e7eb)' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              Active
            </label>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="crm-btn crm-btn-secondary">
              Cancel
            </button>
            <button type="submit" className="crm-btn crm-btn-primary" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditUserModal({ user, onClose, onSuccess }) {
  const { showSuccess, showError } = useNotification();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: user?.email ?? '',
    role: user?.role ?? 'user',
    teamId: user?.teamId ?? '',
    isActive: user?.isActive ?? true,
    password: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        email: user.email ?? '',
        role: user.role ?? 'user',
        teamId: user.teamId ?? '',
        isActive: user.isActive ?? true,
        password: '',
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email?.trim()) {
      showError('Email is required');
      return;
    }
    if (form.password && form.password.length < 6) {
      showError('Password must be at least 6 characters if provided');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        email: form.email.trim(),
        role: form.role,
        teamId: form.teamId?.trim() || null,
        isActive: form.isActive,
      };
      if (form.password) payload.password = form.password;
      await updateAdminUser(user.id, payload);
      showSuccess('User updated');
      onSuccess();
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="admin-reject-modal-overlay" onClick={onClose}>
      <div className="admin-reject-modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Edit user</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #e5e7eb)' }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>New password (leave blank to keep)</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              minLength={6}
              placeholder="Optional"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #e5e7eb)' }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #e5e7eb)' }}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Team ID</label>
            <input
              type="text"
              value={form.teamId}
              onChange={(e) => setForm((f) => ({ ...f, teamId: e.target.value }))}
              placeholder="UUID or empty"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #e5e7eb)' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              Active
            </label>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="crm-btn crm-btn-secondary">
              Cancel
            </button>
            <button type="submit" className="crm-btn crm-btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ user, onClose, onConfirm }) {
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

  if (!user) return null;
  return (
    <div className="admin-reject-modal-overlay" onClick={onClose}>
      <div className="admin-reject-modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Deactivate user</h3>
        <p style={{ color: 'var(--text-muted, #64748b)', marginBottom: '16px' }}>
          This will deactivate <strong>{user.email}</strong>. They will not be able to log in until an admin reactivates them.
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} className="crm-btn crm-btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} className="crm-btn" style={{ background: '#dc2626', color: '#fff' }} disabled={submitting}>
            {submitting ? 'Deactivating…' : 'Deactivate'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [updating, setUpdating] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [reactivating, setReactivating] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminUsers(roleFilter || undefined);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated() && currentUser) loadUsers();
  }, [isAuthenticated, currentUser, roleFilter]);

  const paginatedUsers = users.slice((page - 1) * pageSize, page * pageSize);

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(userId);
    try {
      await updateAdminUserRole(userId, newRole);
      showSuccess('Role updated');
      loadUsers();
    } catch (err) {
      showError(err.message || 'Failed to update role');
    } finally {
      setUpdating(null);
    }
  };

  const handleEdit = (u) => {
    setEditUser(u);
  };

  const handleDeleteClick = (u) => {
    setDeleteUser(u);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteUser) return;
    await deleteAdminUser(deleteUser.id);
    showSuccess('User deactivated');
    loadUsers();
    setDeleteUser(null);
  };

  const handleReactivate = async (u) => {
    setReactivating(u.id);
    try {
      await updateAdminUser(u.id, { isActive: true });
      showSuccess('User reactivated');
      loadUsers();
    } catch (err) {
      showError(err.message || 'Failed to reactivate');
    } finally {
      setReactivating(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isSelf = (u) => currentUser?.id === u.id;
  const isSuperAdminSelf = (u) => isSelf(u) && u.role === 'super_admin';

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
          <h1>Admin: Users</h1>
          <p className="platform-subtitle">
            Create, edit, and manage users. Role changes take effect on next login.
          </p>
        </div>
        <button type="button" className="crm-btn crm-btn-primary" onClick={() => setShowCreate(true)}>
          Create user
        </button>
      </div>

      <div style={{ marginBottom: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Filter by role:
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            style={{ padding: '8px 12px', borderRadius: '8px', minWidth: '160px' }}
          >
            <option value="">All roles</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
      </div>

      {error && <div className="crm-error">{error}</div>}

      {loading ? (
        <div className="crm-loading">
          <div className="crm-skeleton"></div>
          <div className="crm-skeleton"></div>
          <div className="crm-skeleton"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="properties-empty">No users found.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Team</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.email}</strong>
                    <div className="admin-table-muted" style={{ fontSize: '11px', marginTop: '2px' }}>
                      {u.id}
                    </div>
                  </td>
                  <td>{u.role}</td>
                  <td>
                    <span className={`admin-status-badge ${u.isActive ? 'approved' : 'rejected'}`} style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="admin-table-muted">{u.teamId || '—'}</td>
                  <td className="admin-table-muted">{formatDate(u.createdAt)}</td>
                  <td>
                    <div className="admin-table-actions">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={updating === u.id || isSuperAdminSelf(u)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ padding: '6px 10px', borderRadius: '6px', minWidth: '120px', fontSize: '13px' }}
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="crm-btn crm-btn-secondary admin-action-btn"
                        onClick={() => handleEdit(u)}
                      >
                        Edit
                      </button>
                      {u.isActive ? (
                        <button
                          type="button"
                          className="crm-btn admin-action-btn"
                          style={{ background: '#dc2626', color: '#fff' }}
                          onClick={() => handleDeleteClick(u)}
                          disabled={isSelf(u)}
                          title={isSelf(u) ? 'You cannot deactivate yourself' : 'Deactivate'}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="crm-btn admin-action-btn"
                          style={{ background: '#16a34a', color: '#fff' }}
                          onClick={() => handleReactivate(u)}
                          disabled={reactivating === u.id}
                          title="Reactivate user"
                        >
                          {reactivating === u.id ? '…' : 'Reactivate'}
                        </button>
                      )}
                    </div>
                    {updating === u.id && <span className="admin-table-muted" style={{ marginLeft: '8px', fontSize: '12px' }}>Updating...</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && users.length > 0 && (
        <AdminPagination
          total={users.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        />
      )}

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onSuccess={loadUsers}
        />
      )}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSuccess={loadUsers}
        />
      )}
      {deleteUser && deleteUser.isActive && (
        <DeleteConfirmModal
          user={deleteUser}
          onClose={() => setDeleteUser(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
