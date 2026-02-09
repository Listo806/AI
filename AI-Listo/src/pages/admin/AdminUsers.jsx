import { useState, useEffect } from 'react';
import { getAdminUsers, updateAdminUserRole } from '../../api/platformApi';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import AdminPagination from './AdminPagination';
import '../platform/platform.css';
import './admin.css';

const ROLE_OPTIONS = [
  'owner', 'agent', 'admin', 'va', 'va_uploader', 'user', 'super_admin',
  'developer', 'wholesaler', 'investor',
];

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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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
      <div className="platform-header">
        <h1>Admin: Users</h1>
        <p className="platform-subtitle">
          Manage user roles. Changes take effect on next login.
        </p>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ marginRight: '8px' }}>Filter by role:</label>
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
                  <td className="admin-table-muted">{u.teamId || '—'}</td>
                  <td className="admin-table-muted">{formatDate(u.createdAt)}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={updating === u.id || (currentUser.id === u.id && u.role === 'super_admin')}
                      onClick={(e) => e.stopPropagation()}
                      style={{ padding: '6px 10px', borderRadius: '6px', minWidth: '120px', fontSize: '13px' }}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
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
    </div>
  );
}
