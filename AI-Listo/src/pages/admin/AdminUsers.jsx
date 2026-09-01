import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronRight,
  CirclePause,
  Copy,
  ExternalLink,
  Filter,
  Info,
  KeyRound,
  LockKeyhole,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUserById,
  getAdminUsers,
  hardDeleteAdminUser,
  reactivateAdminUser,
  resetAdminUserPassword,
  updateAdminUser,
} from '../../api/platformApi';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useTranslation } from 'react-i18next';
import '../platform/platform.css';
import './admin.css';

const ROLE_OPTIONS = ['super_admin', 'admin', 'developer', 'support'];
const STATUS_OPTIONS = ['active', 'inactive'];

const DEFAULT_PERMISSIONS = {
  super_admin: ['*'],
  admin: ['admin:read', 'admin:write', 'internal_users:manage'],
  developer: ['admin:read', 'developer:tools'],
  support: ['admin:read', 'support:customers'],
};

function roleLabel(role) {
  return {
    super_admin: 'Super Admin',
    admin: 'Admin',
    developer: 'Developer',
    support: 'Support',
  }[role] || role || '—';
}

function avatarText(user) {
  const source = user?.name?.trim() || user?.email?.split('@')?.[0] || 'U';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatLastActive(value) {
  if (!value) return 'Never';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Never';
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startThatDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startToday - startThatDay) / 86400000);
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (diffDays === 0) return `Today, ${time}`;
  if (diffDays === 1) return `Yesterday, ${time}`;
  return `${formatDate(d)}, ${time}`;
}

function ModalShell({ title, subtitle, icon: Icon = ShieldCheck, onClose, children, className = '' }) {
  return (
    <div className="admin-reject-modal-overlay iau-modal-overlay" onMouseDown={onClose}>
      <div className={`admin-reject-modal iau-modal ${className}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="iau-modal-head">
          <div className="iau-title-icon"><Icon size={22} /></div>
          <div className="iau-modal-head-copy">
            <h3>{title}</h3>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button type="button" className="iau-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function InternalUserForm({ initial, mode, onClose, onSaved }) {
  const { showSuccess, showError } = useNotification();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(() => ({
    name: initial?.name || '',
    email: initial?.email || '',
    role: initial?.role || 'admin',
    status: initial?.status || 'active',
    permissions: Array.isArray(initial?.permissions)
      ? initial.permissions
      : DEFAULT_PERMISSIONS[initial?.role || 'admin'],
  }));

  const setRole = (role) => {
    setForm((f) => ({ ...f, role, permissions: DEFAULT_PERMISSIONS[role] || [] }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      showError('Name and email are required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        status: form.status,
        permissions: form.permissions,
      };
      if (mode === 'create') await createAdminUser(payload);
      else await updateAdminUser(initial.id, payload);
      showSuccess(mode === 'create' ? 'Internal user added' : 'Internal access updated');
      onSaved();
      onClose();
    } catch (err) {
      showError(err?.message || 'Unable to save internal user');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePermission = (permission) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(permission)
        ? f.permissions.filter((p) => p !== permission)
        : [...f.permissions, permission],
    }));
  };

  const permissionOptions = [...new Set(Object.values(DEFAULT_PERMISSIONS).flat().filter((x) => x !== '*'))];

  return (
    <ModalShell
      title={mode === 'create' ? 'Add Internal User' : 'Edit Access'}
      subtitle={mode === 'create' ? 'Grant Cortexa internal platform access.' : initial?.email}
      onClose={onClose}
    >
      <form className="iau-access-form" onSubmit={submit}>
        <div className="iau-form-grid">
          <label>
            <span>Name</span>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </label>
          <label>
            <span>Email</span>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          </label>
          <label>
            <span>Role</span>
            <div className="iau-modal-select-wrap">
              <select value={form.role} onChange={(e) => setRole(e.target.value)}>
                {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
              </select>
              <ChevronDown size={15} />
            </div>
          </label>
          <label>
            <span>Status</span>
            <div className="iau-modal-select-wrap">
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown size={15} />
            </div>
          </label>
        </div>

        <div className="iau-permissions-block">
          <div className="iau-permissions-title">
            <strong>Permissions</strong>
            <small>{form.role === 'super_admin' ? 'Super Admin has full platform access.' : 'Role defaults can be adjusted here.'}</small>
          </div>
          {form.role === 'super_admin' ? (
            <div className="iau-permission-chip is-selected"><Check size={14} /> Full platform access</div>
          ) : (
            <div className="iau-permission-options">
              {permissionOptions.map((permission) => {
                const active = form.permissions.includes(permission);
                return (
                  <button
                    type="button"
                    key={permission}
                    className={`iau-permission-chip ${active ? 'is-selected' : ''}`}
                    onClick={() => togglePermission(permission)}
                  >
                    {active ? <Check size={14} /> : null}{permission}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {mode === 'create' ? (
          <div className="iau-form-note">
            Existing accounts are reused by email. New identities receive a secure random password and can set a password through the normal password-reset flow.
          </div>
        ) : null}

        <div className="iau-modal-actions">
          <button type="button" className="crm-btn crm-btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="crm-btn crm-btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : mode === 'create' ? 'Add Internal User' : 'Save Changes'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ResetPasswordModal({ user, onClose, onSaved }) {
  const { showSuccess, showError } = useNotification();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return showError('Password must be at least 8 characters');
    if (password !== confirm) return showError('Passwords do not match');
    setSubmitting(true);
    try {
      await resetAdminUserPassword(user.id, password);
      showSuccess('Password reset. Existing sessions were invalidated.');
      onSaved();
      onClose();
    } catch (err) {
      showError(err?.message || 'Unable to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title="Reset Password" subtitle={user.email} icon={KeyRound} onClose={onClose}>
      <form className="iau-access-form" onSubmit={submit}>
        <label className="iau-form-single"><span>New password</span><input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <label className="iau-form-single"><span>Confirm password</span><input type="password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>
        <div className="iau-form-note">Resetting the password also invalidates the user’s existing sessions.</div>
        <div className="iau-modal-actions">
          <button type="button" className="crm-btn crm-btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="crm-btn crm-btn-primary" disabled={submitting}>{submitting ? 'Resetting…' : 'Reset Password'}</button>
        </div>
      </form>
    </ModalShell>
  );
}

function ConfirmModal({ user, type, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);
  const isDelete = type === 'delete';
  const submit = async () => {
    setBusy(true);
    try { await onConfirm(); onClose(); } finally { setBusy(false); }
  };
  return (
    <ModalShell title={isDelete ? 'Delete Internal User' : 'Deactivate Internal User'} subtitle={user.email} icon={isDelete ? Trash2 : CirclePause} onClose={onClose}>
      <div className="iau-confirm-copy">
        <p>{isDelete
          ? 'This removes only the Cortexa internal-access record. The authentication identity, customer workspace, subscriptions, billing, and history are preserved.'
          : 'This immediately removes internal platform access and invalidates current sessions. Customer/workspace access remains intact.'}</p>
        {user.role === 'super_admin' ? <div className="iau-warning-box">The backend will block this action if this is the last active Super Admin.</div> : null}
      </div>
      <div className="iau-modal-actions">
        <button type="button" className="crm-btn crm-btn-secondary" onClick={onClose}>Cancel</button>
        <button type="button" className={`crm-btn ${isDelete ? 'iau-danger-btn' : 'crm-btn-primary'}`} disabled={busy} onClick={submit}>{busy ? 'Working…' : isDelete ? 'Delete Internal User' : 'Deactivate'}</button>
      </div>
    </ModalShell>
  );
}

function TechnicalInformation({ user }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState('');
  const copy = async (key, value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(key);
      setTimeout(() => setCopied(''), 1200);
    } catch {}
  };
  const rows = [
    ['user', 'User ID', user.id],
    ['access', 'Internal Access ID', user.internalAccessId],
    ['workspace', 'Workspace ID', user.teamId],
    ['created', 'Identity Created', user.identityCreatedAt],
    ['last', 'Last Active', user.lastActive],
  ];
  return (
    <div className="iau-technical">
      <button type="button" className="iau-technical-toggle" onClick={() => setOpen((v) => !v)}>
        <span><LockKeyhole size={16} /> Technical Information</span>
        <ChevronRight size={16} className={open ? 'is-open' : ''} />
      </button>
      {open ? (
        <div className="iau-technical-body">
          {rows.map(([key, label, value]) => (
            <div className="iau-tech-row" key={key}>
              <span>{label}</span>
              <code>{key === 'created' || key === 'last' ? formatLastActive(value) : value || '—'}</code>
              {value && !['created', 'last'].includes(key) ? (
                <button type="button" onClick={() => copy(key, value)}>{copied === key ? <Check size={14} /> : <Copy size={14} />}</button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ViewDetailsModal({ user, onClose, onEdit }) {
  const [detail, setDetail] = useState(user);
  useEffect(() => {
    let active = true;
    getAdminUserById(user.id).then((data) => { if (active) setDetail(data || user); }).catch(() => {});
    return () => { active = false; };
  }, [user]);

  return (
    <ModalShell title="Internal User Details" subtitle={detail.email} onClose={onClose} className="iau-view-modal">
      <div className="iau-view-grid">
        <span><small>Name</small><strong>{detail.name || '—'}</strong></span>
        <span><small>Role</small><strong>{roleLabel(detail.role)}</strong></span>
        <span><small>Status</small><strong>{detail.status === 'active' ? 'Active' : 'Inactive'}</strong></span>
        <span><small>Added</small><strong>{formatDate(detail.createdAt)}</strong></span>
        <span><small>Last Active</small><strong>{formatLastActive(detail.lastActive)}</strong></span>
        <span><small>Permissions</small><strong>{Array.isArray(detail.permissions) ? detail.permissions.join(', ') : '—'}</strong></span>
      </div>
      <TechnicalInformation user={detail} />
      {Array.isArray(detail.audit) && detail.audit.length ? (
        <div className="iau-audit-preview">
          <strong>Recent Access Activity</strong>
          {detail.audit.slice(0, 5).map((item) => (
            <div key={item.id}><span>{String(item.action || '').replaceAll('_', ' ')}</span><small>{formatLastActive(item.createdAt)}</small></div>
          ))}
        </div>
      ) : null}
      <div className="iau-modal-actions">
        <button type="button" className="crm-btn crm-btn-secondary" onClick={onClose}>Close</button>
        <button type="button" className="crm-btn crm-btn-primary" onClick={() => onEdit(detail)}>Edit Access</button>
      </div>
    </ModalShell>
  );
}

export default function AdminUsers() {
  const { t } = useTranslation();
  const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(7);
  const [rowMenu, setRowMenu] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const menuRoot = useRef(null);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Failed to load internal users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated?.() && currentUser) loadUsers();
  }, [authLoading, currentUser]);

  useEffect(() => {
    const close = (e) => {
      if (!menuRoot.current?.contains(e.target)) setRowMenu(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => { setPage(1); }, [query, roleFilter, statusFilter]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (statusFilter && u.status !== statusFilter) return false;
      if (q && !`${u.name || ''} ${u.email || ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [users, query, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedUsers = filteredUsers.slice((safePage - 1) * pageSize, safePage * pageSize);
  const firstRow = filteredUsers.length ? (safePage - 1) * pageSize + 1 : 0;
  const lastRow = Math.min(safePage * pageSize, filteredUsers.length);
  const isSelf = (u) => String(currentUser?.id) === String(u.id);

  const deactivate = async (u) => {
    try {
      await deleteAdminUser(u.id);
      showSuccess('Internal access deactivated');
      await loadUsers();
    } catch (err) { showError(err?.message || 'Unable to deactivate internal access'); throw err; }
  };

  const deleteAccess = async (u) => {
    try {
      await hardDeleteAdminUser(u.id);
      showSuccess('Internal user removed. Identity and customer data were preserved.');
      await loadUsers();
    } catch (err) { showError(err?.message || 'Unable to delete internal user'); throw err; }
  };

  const reactivate = async (u) => {
    try {
      await reactivateAdminUser(u.id);
      showSuccess('Internal access reactivated');
      await loadUsers();
    } catch (err) { showError(err?.message || 'Unable to reactivate internal access'); }
  };

  if (authLoading) return null;
  if (!isAuthenticated?.() || !currentUser) return null;

  return (
    <div className="iau-page" ref={menuRoot}>
      <header className="iau-header">
        <div className="iau-title-wrap">
          <div className="iau-title-icon"><ShieldCheck size={28} /></div>
          <div>
            <h1>{t('admin.users.internalUsersAccess', 'Internal Users & Access')}</h1>
            <p>{t('admin.users.internalUsersSubtitle', 'Manage administrative access to the Cortexa platform.')}</p>
          </div>
        </div>
        <button type="button" className="iau-primary-btn" onClick={() => setShowCreate(true)}><Plus size={18} /> Add Internal User</button>
      </header>

      <section className="iau-filter-card">
        <div className="iau-search-box"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or email..." /></div>
        <div className="iau-select-wrap"><select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}><option value="">All Roles</option>{ROLE_OPTIONS.map((r) => <option value={r} key={r}>{roleLabel(r)}</option>)}</select><ChevronDown size={16} /></div>
        <div className="iau-select-wrap"><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">All Statuses</option>{STATUS_OPTIONS.map((s) => <option value={s} key={s}>{s === 'active' ? 'Active' : 'Inactive'}</option>)}</select><ChevronDown size={16} /></div>
        <button type="button" className="iau-filter-btn" onClick={() => { setRoleFilter(''); setStatusFilter(''); setQuery(''); }}><Filter size={17} /> Filters</button>
      </section>

      {error ? <div className="crm-error">{error}</div> : null}

      <section className="iau-table-card">
        {loading ? <div className="iau-loading-list"><div className="crm-skeleton" /><div className="crm-skeleton" /><div className="crm-skeleton" /></div> : filteredUsers.length === 0 ? <div className="iau-empty">No internal users found.</div> : (
          <>
            <div className="iau-table-scroll">
              <table className="iau-table">
                <thead><tr><th className="iau-sort-th">Internal User <ArrowUpDown size={12} /></th><th>Role</th><th>Status</th><th>Last Active</th><th className="iau-sort-th">Added <ArrowUpDown size={12} /></th><th className="iau-actions-th">Actions</th></tr></thead>
                <tbody>
                  {paginatedUsers.map((u, idx) => (
                    <tr key={u.id}>
                      <td data-label="Internal User" className="iau-mobile-user-cell"><div className="iau-user-cell"><span className={`iau-avatar iau-avatar--${idx % 6}`}>{avatarText(u)}</span><span className="iau-user-copy"><strong>{u.name || u.email?.split('@')?.[0] || 'User'}</strong><small>{u.email}</small></span></div></td>
                      <td data-label="Role"><span className={`iau-role-badge iau-role-badge--${u.role}`}><ShieldCheck size={14} /> {roleLabel(u.role)}</span></td>
                      <td data-label="Status"><span className={`iau-status-pill ${u.status === 'active' ? 'is-active' : 'is-inactive'}`}><span className="iau-status-dot" />{u.status === 'active' ? 'Active' : 'Inactive'}</span></td>
                      <td data-label="Last Active"><span className="iau-last-active"><span className={`iau-live-dot ${u.status === 'active' ? 'is-live' : ''}`} />{formatLastActive(u.lastActive)}</span></td>
                      <td data-label="Added" className="iau-date-cell">{formatDate(u.createdAt)}</td>
                      <td data-label="Actions" className="iau-actions-cell">
                        <div className="iau-row-menu-wrap" onClick={(e) => e.stopPropagation()}>
                          <button type="button" className="iau-row-menu-btn" onClick={() => setRowMenu(rowMenu === u.id ? null : u.id)}><MoreVertical size={19} /></button>
                          {rowMenu === u.id ? (
                            <div className="iau-row-menu">
                              <button type="button" onClick={() => { setViewUser(u); setRowMenu(null); }}><UserRound size={17} /> View Details</button>
                              <button type="button" onClick={() => { setEditUser(u); setRowMenu(null); }}><Pencil size={17} /> Edit Access</button>
                              <button type="button" onClick={() => { setResetUser(u); setRowMenu(null); }}><LockKeyhole size={17} /> Reset Password</button>
                              {u.status === 'active' ? (
                                <button type="button" className="danger" disabled={isSelf(u)} onClick={() => { setConfirmAction({ type: 'deactivate', user: u }); setRowMenu(null); }}><CirclePause size={17} /> Deactivate</button>
                              ) : (
                                <button type="button" className="success" onClick={() => { reactivate(u); setRowMenu(null); }}><RotateCcw size={17} /> Reactivate</button>
                              )}
                              <button type="button" className="danger" disabled={isSelf(u)} onClick={() => { setConfirmAction({ type: 'delete', user: u }); setRowMenu(null); }}><Trash2 size={17} /> Delete User</button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <footer className="iau-table-footer"><span>Showing {firstRow} to {lastRow} of {filteredUsers.length} users</span><div className="iau-pagination"><button type="button" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button><button type="button" className="active">{safePage}</button><button type="button" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>›</button></div></footer>
          </>
        )}
      </section>

      <aside className="iau-info-card"><div className="iau-info-main"><Info size={20} /><div><strong>About Internal Users</strong><p>These users have access to the Cortexa platform for administrative, development, or support purposes. Customers and their team members are managed from the Customers section.</p></div></div><button type="button" className="iau-learn-link">Learn more about roles & permissions <ExternalLink size={15} /></button></aside>

      {showCreate ? <InternalUserForm mode="create" onClose={() => setShowCreate(false)} onSaved={loadUsers} /> : null}
      {editUser ? <InternalUserForm mode="edit" initial={editUser} onClose={() => setEditUser(null)} onSaved={loadUsers} /> : null}
      {viewUser ? <ViewDetailsModal user={viewUser} onClose={() => setViewUser(null)} onEdit={(u) => { setViewUser(null); setEditUser(u); }} /> : null}
      {resetUser ? <ResetPasswordModal user={resetUser} onClose={() => setResetUser(null)} onSaved={loadUsers} /> : null}
      {confirmAction ? <ConfirmModal user={confirmAction.user} type={confirmAction.type} onClose={() => setConfirmAction(null)} onConfirm={() => confirmAction.type === 'delete' ? deleteAccess(confirmAction.user) : deactivate(confirmAction.user)} /> : null}
    </div>
  );
}
