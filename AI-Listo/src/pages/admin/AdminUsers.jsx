import { useState, useEffect } from 'react';
import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  updateAdminUserRole,
  deleteAdminUser,
  hardDeleteAdminUser,
} from '../../api/platformApi';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      showError(t('admin.users.emailPasswordRequired'));
      return;
    }
    if (form.password.length < 6) {
      showError(t('admin.users.passwordMin6'));
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
      showSuccess(t('admin.users.userCreated'));
      onSuccess();
      onClose();
    } catch (err) {
      showError(err.message || t('admin.users.createFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-reject-modal-overlay" onClick={onClose}>
      <div className="admin-reject-modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{t('admin.users.createUser')}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>{t('admin.users.emailLabel')}</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #e5e7eb)' }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>{t('admin.users.passwordLabelCreate')}</label>
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
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>{t('admin.users.role')}</label>
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
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>{t('admin.users.teamIdOptional')}</label>
            <input
              type="text"
              value={form.teamId}
              onChange={(e) => setForm((f) => ({ ...f, teamId: e.target.value }))}
              placeholder={t('admin.users.teamIdPlaceholderCreate')}
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
              {t('admin.users.active')}
            </label>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="crm-btn crm-btn-secondary">
              {t('admin.users.cancel')}
            </button>
            <button type="submit" className="crm-btn crm-btn-primary" disabled={submitting}>
              {submitting ? t('admin.users.creating') : t('admin.users.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditUserModal({ user, onClose, onSuccess }) {
  const { showSuccess, showError } = useNotification();
  const { t } = useTranslation();
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
      showError(t('admin.users.emailRequired'));
      return;
    }
    if (form.password && form.password.length < 6) {
      showError(t('admin.users.passwordMin6IfProvided'));
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
      showSuccess(t('admin.users.userUpdated'));
      onSuccess();
      onClose();
    } catch (err) {
      showError(err.message || t('admin.users.updateFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="admin-reject-modal-overlay" onClick={onClose}>
      <div className="admin-reject-modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{t('admin.users.editUser')}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>{t('admin.users.emailLabel')}</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #e5e7eb)' }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>{t('admin.users.newPasswordLabel')}</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              minLength={6}
              placeholder={t('admin.users.optional')}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #e5e7eb)' }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>{t('admin.users.role')}</label>
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
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>{t('admin.users.teamId')}</label>
            <input
              type="text"
              value={form.teamId}
              onChange={(e) => setForm((f) => ({ ...f, teamId: e.target.value }))}
              placeholder={t('admin.users.teamIdPlaceholderEdit')}
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
              {t('admin.users.active')}
            </label>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="crm-btn crm-btn-secondary">
              {t('admin.users.cancel')}
            </button>
            <button type="submit" className="crm-btn crm-btn-primary" disabled={submitting}>
              {submitting ? t('admin.users.saving') : t('admin.users.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ user, onClose, onConfirm }) {
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

  if (!user) return null;
  return (
    <div className="admin-reject-modal-overlay" onClick={onClose}>
      <div className="admin-reject-modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{t('admin.users.deactivateUser')}</h3>
        <p style={{ color: 'var(--text-muted, #64748b)', marginBottom: '16px' }}>
          {t('admin.users.deactivateWarningPrefix')} <strong>{user.email}</strong>{t('admin.users.deactivateWarningSuffix')}
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} className="crm-btn crm-btn-secondary">
            {t('admin.users.cancel')}
          </button>
          <button type="button" onClick={handleConfirm} className="crm-btn" style={{ background: '#dc2626', color: '#fff' }} disabled={submitting}>
            {submitting ? t('admin.users.deactivating') : t('admin.users.deactivate')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Permanent (hard) delete confirmation. Distinct from Deactivate: this removes
// the account for good. Surfaces the backend's ownership-transfer block as a
// warning instead of a silent failure.
function PermanentDeleteModal({ user, onClose, onConfirm }) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [warning, setWarning] = useState('');
  const handleConfirm = async () => {
    setSubmitting(true);
    setWarning('');
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      // Ownership block or any other reason — keep the modal open and explain.
      setWarning(
        err?.message ||
          t(
            'admin.users.deletePermanentFailed',
            'Could not delete this user. Please try again.',
          ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;
  return (
    <div className="admin-reject-modal-overlay" onClick={onClose}>
      <div className="admin-reject-modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>
          {t('admin.users.deletePermanentTitle', 'Delete user permanently')}
        </h3>
        <p style={{ color: 'var(--text-muted, #64748b)', marginBottom: '12px' }}>
          {t(
            'admin.users.deletePermanentConfirm',
            'Are you sure you want to permanently delete this user?',
          )}
        </p>
        <p style={{ marginBottom: '16px' }}>
          <strong>{user.email}</strong>
          {user.name ? ` (${user.name})` : ''}
        </p>
        {warning && (
          <div
            className="crm-error"
            style={{
              marginBottom: '16px',
              whiteSpace: 'pre-line',
            }}
          >
            {warning}
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} className="crm-btn crm-btn-secondary">
            {t('admin.users.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="crm-btn"
            style={{ background: '#b91c1c', color: '#fff' }}
            disabled={submitting}
          >
            {submitting
              ? t('admin.users.deletingPermanent', 'Deleting…')
              : t('admin.users.deletePermanent', 'Delete permanently')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [permDeleteUser, setPermDeleteUser] = useState(null);
  const [reactivating, setReactivating] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminUsers(roleFilter || undefined);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || t('admin.users.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated() && currentUser) loadUsers();
  }, [isAuthenticated, currentUser, roleFilter]);

  // Client-side search by email or name, so admins can quickly find a user
  // (e.g. a test/dev account) before deleting it.
  const q = search.trim().toLowerCase();
  const filteredUsers = q
    ? users.filter(
        (u) =>
          String(u.email || '').toLowerCase().includes(q) ||
          String(u.name || '').toLowerCase().includes(q),
      )
    : users;

  const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(userId);
    try {
      await updateAdminUserRole(userId, newRole);
      showSuccess(t('admin.users.roleUpdated'));
      loadUsers();
    } catch (err) {
      showError(err.message || t('admin.users.roleUpdateFailed'));
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
    showSuccess(t('admin.users.userDeactivated'));
    loadUsers();
    setDeleteUser(null);
  };

  const handlePermDeleteClick = (u) => {
    setPermDeleteUser(u);
  };

  // Throws on failure (incl. the ownership-transfer 409) so the modal can show
  // the reason and stay open; only clears + reloads on success.
  const handlePermDeleteConfirm = async () => {
    if (!permDeleteUser) return;
    await hardDeleteAdminUser(permDeleteUser.id);
    showSuccess(t('admin.users.userDeletedPermanently', 'User permanently deleted'));
    setPermDeleteUser(null);
    loadUsers();
  };

  const handleReactivate = async (u) => {
    setReactivating(u.id);
    try {
      await updateAdminUser(u.id, { isActive: true });
      showSuccess(t('admin.users.userReactivated'));
      loadUsers();
    } catch (err) {
      showError(err.message || t('admin.users.reactivateFailed'));
    } finally {
      setReactivating(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('admin.users.notAvailable');
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
        <div>{t('admin.users.loading')}</div>
      </div>
    );
  }

  if (!isAuthenticated() || !currentUser) return null;

  return (
    <div className="platform-page" style={{ maxWidth: '100%' }}>
      <div className="platform-header" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1>{t('admin.users.title')}</h1>
          <p className="platform-subtitle">
            {t('admin.users.subtitle')}
          </p>
        </div>
        <button type="button" className="crm-btn crm-btn-primary" onClick={() => setShowCreate(true)}>
          {t('admin.users.createUser')}
        </button>
      </div>

      <div style={{ marginBottom: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {t('admin.users.filterByRole')}
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            style={{ padding: '8px 12px', borderRadius: '8px', minWidth: '160px' }}
          >
            <option value="">{t('admin.users.allRoles')}</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t('admin.users.searchPlaceholder', 'Search by email or name')}
          style={{ padding: '8px 12px', borderRadius: '8px', minWidth: '240px', border: '1px solid #cbd5e1' }}
        />
      </div>

      {error && <div className="crm-error">{error}</div>}

      {loading ? (
        <div className="crm-loading">
          <div className="crm-skeleton"></div>
          <div className="crm-skeleton"></div>
          <div className="crm-skeleton"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="properties-empty">{t('admin.users.noUsersFound')}</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.users.email')}</th>
                <th>{t('admin.users.role')}</th>
                <th>{t('admin.users.status')}</th>
                <th>{t('admin.users.team')}</th>
                <th>{t('admin.users.created')}</th>
                <th>{t('admin.users.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.email}</strong>
                    {u.name && (
                      <div style={{ fontSize: '12px', marginTop: '2px' }}>{u.name}</div>
                    )}
                    <div className="admin-table-muted" style={{ fontSize: '11px', marginTop: '2px' }}>
                      {u.id}
                    </div>
                  </td>
                  <td>{u.role}</td>
                  <td>
                    <span className={`admin-status-badge ${u.isActive ? 'approved' : 'rejected'}`} style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}>
                      {u.isActive ? t('admin.users.active') : t('admin.users.inactive')}
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
                        {t('admin.users.edit')}
                      </button>
                      {u.isActive ? (
                        <button
                          type="button"
                          className="crm-btn admin-action-btn"
                          style={{ background: '#dc2626', color: '#fff' }}
                          onClick={() => handleDeleteClick(u)}
                          disabled={isSelf(u)}
                          title={isSelf(u) ? t('admin.users.cannotDeactivateSelf') : t('admin.users.deactivate')}
                        >
                          {t('admin.users.deactivate')}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="crm-btn admin-action-btn"
                          style={{ background: '#16a34a', color: '#fff' }}
                          onClick={() => handleReactivate(u)}
                          disabled={reactivating === u.id}
                          title={t('admin.users.reactivateUserTitle')}
                        >
                          {reactivating === u.id ? '…' : t('admin.users.reactivate')}
                        </button>
                      )}
                      <button
                        type="button"
                        className="crm-btn admin-action-btn"
                        style={{
                          background: '#fff',
                          color: '#b91c1c',
                          border: '1px solid #fecaca',
                        }}
                        onClick={() => handlePermDeleteClick(u)}
                        disabled={isSelf(u) || u.role === 'super_admin'}
                        title={
                          isSelf(u)
                            ? t('admin.users.cannotDeleteSelf', 'You cannot delete your own account')
                            : u.role === 'super_admin'
                              ? t('admin.users.cannotDeleteSuperAdmin', 'Super Admin cannot be deleted')
                              : t('admin.users.deletePermanent', 'Delete permanently')
                        }
                      >
                        {t('admin.users.delete', 'Delete')}
                      </button>
                    </div>
                    {updating === u.id && <span className="admin-table-muted" style={{ marginLeft: '8px', fontSize: '12px' }}>{t('admin.users.updating')}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && filteredUsers.length > 0 && (
        <AdminPagination
          total={filteredUsers.length}
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
      {permDeleteUser && (
        <PermanentDeleteModal
          user={permDeleteUser}
          onClose={() => setPermDeleteUser(null)}
          onConfirm={handlePermDeleteConfirm}
        />
      )}
    </div>
  );
}
