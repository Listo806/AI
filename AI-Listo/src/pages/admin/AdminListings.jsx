import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getAdminListings,
  getAdminListingById,
  updateAdminListingStatus,
} from '../../api/platformApi';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import AdminPagination from './AdminPagination';
import '../platform/platform.css';
import './admin.css';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'published', label: 'Published' },
];

const ORIGIN_OPTIONS = [
  { value: '', label: 'All origins' },
  { value: 'platform', label: 'Platform' },
  { value: 'va', label: 'VA' },
  { value: 'crm', label: 'CRM' },
];

export default function AdminListings() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: '', origin: '', createdBy: '' });
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [updating, setUpdating] = useState(null); // id of listing being updated
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectModalId, setRejectModalId] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const loadListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const opts = {};
      if (filters.status) opts.status = filters.status;
      if (filters.origin) opts.origin = filters.origin;
      if (filters.createdBy) opts.createdBy = filters.createdBy;
      const data = await getAdminListings(opts);
      setListings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated() && user) loadListings();
  }, [isAuthenticated, user, filters.status, filters.origin, filters.createdBy]);

  const paginatedListings = listings.slice((page - 1) * pageSize, page * pageSize);

  const resetPage = () => setPage(1);

  const loadDetail = async (id) => {
    setSelectedId(id);
    setDetail(null);
    setRejectionReason('');
    try {
      const data = await getAdminListingById(id);
      setDetail(data);
    } catch (err) {
      showError(err.message || 'Failed to load listing');
    }
  };

  const handleStatusChange = async (id, status, reason = null) => {
    setUpdating(id);
    try {
      await updateAdminListingStatus(
        id,
        status,
        status === 'rejected' ? (reason ?? rejectionReason) : null
      );
      showSuccess('Listing updated');
      setDetail(null);
      setSelectedId(null);
      setRejectionReason('');
      setRejectModalId(null);
      loadListings();
    } catch (err) {
      showError(err.message || 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const openRejectModal = (id) => {
    setRejectModalId(id);
    setRejectionReason('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated() || !user) return null;

  return (
    <div className="platform-page" style={{ maxWidth: '1100px' }}>
      <div className="platform-header">
        <h1>Admin: Listings</h1>
        <p className="platform-subtitle">
          Review, approve, reject, or publish listings. Public marketplace shows only published listings.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <select
          value={filters.status}
          onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); resetPage(); }}
          style={{ padding: '8px 12px', borderRadius: '8px' }}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={filters.origin}
          onChange={(e) => { setFilters((f) => ({ ...f, origin: e.target.value })); resetPage(); }}
          style={{ padding: '8px 12px', borderRadius: '8px' }}
        >
          {ORIGIN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Created by (user ID)"
          value={filters.createdBy}
          onChange={(e) => { setFilters((f) => ({ ...f, createdBy: e.target.value })); resetPage(); }}
          style={{ padding: '8px 12px', borderRadius: '8px', minWidth: '180px' }}
        />
      </div>

      {error && <div className="crm-error">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: detail ? '1fr 340px' : '1fr', gap: '24px' }}>
        <div>
          {loading ? (
            <div className="crm-loading">
              <div className="crm-skeleton"></div>
              <div className="crm-skeleton"></div>
              <div className="crm-skeleton"></div>
            </div>
          ) : listings.length === 0 ? (
            <div className="properties-empty">No listings match the filters.</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Origin</th>
                    <th>Uploader</th>
                    <th>Location</th>
                    <th>Price</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedListings.map((item) => (
                    <tr
                      key={item.id}
                      className={`admin-table-row-clickable ${selectedId === item.id ? 'admin-table-row-selected' : ''}`}
                      onClick={() => loadDetail(item.id)}
                    >
                      <td><strong>{item.title || 'Untitled'}</strong></td>
                      <td>
                        <span className={`admin-status-badge ${item.status || 'pending_review'}`}>
                          {item.status || 'pending_review'}
                        </span>
                      </td>
                      <td>{item.origin ? item.origin.charAt(0).toUpperCase() + item.origin.slice(1) : '—'}</td>
                      <td className="admin-table-muted">{item.uploaderEmail || '—'}</td>
                      <td className="admin-table-muted">
                        {[item.address, item.city, item.state].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td>{formatPrice(item.price)}</td>
                      <td className="admin-table-muted">{formatDate(item.createdAt)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="admin-table-actions">
                          {(item.status === 'pending_review' || !item.status) && (
                            <>
                              <button
                                type="button"
                                className="crm-btn crm-btn-primary admin-action-btn"
                                disabled={updating !== null}
                                onClick={() => handleStatusChange(item.id, 'approved')}
                                title="Approve"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="crm-btn crm-btn-danger admin-action-btn"
                                disabled={updating !== null}
                                onClick={() => openRejectModal(item.id)}
                                title="Reject"
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                className="crm-btn crm-btn-secondary admin-action-btn"
                                disabled={updating !== null}
                                onClick={() => handleStatusChange(item.id, 'published')}
                                title="Publish"
                              >
                                Publish
                              </button>
                            </>
                          )}
                          {(item.status === 'approved' || item.status === 'rejected') && (
                            <button
                              type="button"
                              className="crm-btn crm-btn-primary admin-action-btn"
                              disabled={updating !== null}
                              onClick={() => handleStatusChange(item.id, 'published')}
                              title="Publish"
                            >
                              Publish
                            </button>
                          )}
                          {item.status === 'published' && (
                            <>
                              <button
                                type="button"
                                className="crm-btn crm-btn-secondary admin-action-btn"
                                disabled={updating !== null}
                                onClick={() => handleStatusChange(item.id, 'approved')}
                                title="Change to Approved"
                              >
                                Approved
                              </button>
                              <button
                                type="button"
                                className="crm-btn crm-btn-danger admin-action-btn"
                                disabled={updating !== null}
                                onClick={() => openRejectModal(item.id)}
                                title="Reject (unpublish)"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {updating === item.id && (
                            <span className="admin-table-muted" style={{ fontSize: '12px', marginLeft: '4px' }}>Updating...</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && listings.length > 0 && (
            <AdminPagination
              total={listings.length}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            />
          )}
        </div>

        {detail && (
          <div className="platform-form" style={{ alignSelf: 'start' }}>
            <h3>{detail.title || 'Untitled'}</h3>
            <div className="property-meta" style={{ marginBottom: '12px' }}>
              Status: <strong>{detail.status}</strong> · Origin: {detail.origin}
            </div>
            {detail.uploaderEmail && (
              <div style={{ marginBottom: '12px', fontSize: '13px' }}>Uploaded by: {detail.uploaderEmail}</div>
            )}
            <div style={{ marginBottom: '12px' }}>
              {detail.address && <div>{detail.address}</div>}
              {detail.city && <div>{detail.city}, {detail.state} {detail.zipCode}</div>}
              {detail.price && <div>{formatPrice(detail.price)}</div>}
              {detail.description && (
                <p style={{ marginTop: '8px', fontSize: '13px', maxHeight: '120px', overflow: 'auto' }}>{detail.description}</p>
              )}
            </div>

            {detail.status === 'pending_review' && (
              <>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <button
                    type="button"
                    className="crm-btn crm-btn-primary"
                    disabled={updating !== null}
                    onClick={() => handleStatusChange(detail.id, 'approved')}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="crm-btn crm-btn-primary"
                    disabled={updating !== null}
                    onClick={() => handleStatusChange(detail.id, 'published')}
                  >
                    Publish
                  </button>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Rejection reason (if rejecting)</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Optional"
                    rows={2}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px' }}
                  />
                </div>
                <button
                  type="button"
                  className="crm-btn crm-btn-danger"
                  disabled={updating}
                  onClick={() => handleStatusChange(detail.id, 'rejected')}
                >
                  Reject
                </button>
              </>
            )}

            {(detail.status === 'approved' || detail.status === 'rejected') && (
              <button
                type="button"
                className="crm-btn crm-btn-primary"
                disabled={updating !== null}
                onClick={() => handleStatusChange(detail.id, 'published')}
              >
                Publish
              </button>
            )}

            {detail.status === 'published' && (
              <>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <button
                    type="button"
                    className="crm-btn crm-btn-secondary"
                    disabled={updating !== null}
                    onClick={() => handleStatusChange(detail.id, 'approved')}
                  >
                    Change to Approved
                  </button>
                  <button
                    type="button"
                    className="crm-btn crm-btn-danger"
                    disabled={updating !== null}
                    onClick={() => openRejectModal(detail.id)}
                  >
                    Reject (unpublish)
                  </button>
                </div>
              </>
            )}

            <div style={{ marginTop: '16px' }}>
              <Link to={`/listings/${detail.id}`} className="crm-btn crm-btn-secondary" style={{ display: 'inline-block' }}>
                View on Marketplace
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Reject modal */}
      {rejectModalId && (
        <div className="admin-reject-modal-overlay" onClick={() => setRejectModalId(null)}>
          <div className="admin-reject-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reject Listing</h3>
            <p className="admin-table-muted" style={{ marginBottom: '12px' }}>
              Provide a reason for rejection (optional):
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Incomplete information, duplicate listing..."
              rows={3}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', marginBottom: '16px', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="crm-btn crm-btn-secondary"
                onClick={() => setRejectModalId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="crm-btn crm-btn-danger"
                disabled={updating !== null}
                onClick={() => handleStatusChange(rejectModalId, 'rejected', rejectionReason)}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
