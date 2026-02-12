import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getMyVaListings, createVaListing, updateVaListing } from '../../api/platformApi';
import {
  getPropertyMedia,
  uploadPropertyImage,
  setPropertyThumbnail,
  updatePropertyMedia,
  deletePropertyMedia,
  MAX_IMAGES_PER_PROPERTY,
} from '../../api/propertiesApi';
import PropertyImageUpload from '../../components/PropertyImageUpload';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import '../platform/platform.css';
import '../properties/properties.css';

const EMPTY_FORM = {
  title: '',
  description: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  price: '',
  type: 'sale',
  bedrooms: '',
  bathrooms: '',
  squareFeet: '',
  lotSize: '',
  yearBuilt: '',
};

export default function VaUpload() {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [media, setMedia] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [mediaActionId, setMediaActionId] = useState(null);

  useEffect(() => {
    if (isAuthenticated() && user && !authLoading) {
      loadListings();
    }
  }, [isAuthenticated, user, authLoading]);

  useEffect(() => {
    if (editingId) {
      getPropertyMedia(editingId)
        .then((list) => setMedia(Array.isArray(list) ? list.filter((m) => m.type === 'image') : []))
        .catch(() => setMedia([]));
    } else {
      setMedia([]);
    }
  }, [editingId]);

  const loadListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyVaListings();
      setListings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditingId(item.id);
    setFormData({
      title: item.title || '',
      description: item.description || '',
      address: item.address || '',
      city: item.city || '',
      state: item.state || '',
      zipCode: item.zipCode || '',
      price: item.price ?? '',
      type: item.type || 'sale',
      bedrooms: item.bedrooms ?? '',
      bathrooms: item.bathrooms ?? '',
      squareFeet: item.squareFeet ?? '',
      lotSize: item.lotSize ?? '',
      yearBuilt: item.yearBuilt ?? '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const submitData = {
        title: formData.title,
        description: formData.description || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        zipCode: formData.zipCode || null,
        price: formData.price ? parseFloat(formData.price) : null,
        type: formData.type,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
        squareFeet: formData.squareFeet ? parseFloat(formData.squareFeet) : null,
        lotSize: formData.lotSize ? parseFloat(formData.lotSize) : null,
        yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : null,
      };
      if (editingId) {
        await updateVaListing(editingId, submitData);
        showSuccess('Listing updated.');
      } else {
        const created = await createVaListing(submitData);
        showSuccess('Listing submitted! Add images below, then close when done.');
        if (created?.id) {
          setEditingId(created.id);
          setFormData({
            title: created.title || '',
            description: created.description || '',
            address: created.address || '',
            city: created.city || '',
            state: created.state || '',
            zipCode: created.zipCode || '',
            price: created.price ?? '',
            type: created.type || 'sale',
            bedrooms: created.bedrooms ?? '',
            bathrooms: created.bathrooms ?? '',
            squareFeet: created.squareFeet ?? '',
            lotSize: created.lotSize ?? '',
            yearBuilt: created.yearBuilt ?? '',
          });
          loadListings();
          return;
        }
      }
      closeForm();
      loadListings();
    } catch (err) {
      showError(err.message || (editingId ? 'Failed to update listing' : 'Failed to submit listing'));
      setError(err.message);
    } finally {
      setSubmitting(false);
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

  const formatPrice = (price) => {
    if (!price && price !== 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusLabel = (status) => {
    const map = {
      pending_review: 'Pending Review',
      approved: 'Approved',
      rejected: 'Rejected',
      published: 'Published',
    };
    return map[status] || status;
  };

  const getStatusClass = (status) => {
    const map = {
      pending_review: 'draft',
      approved: 'published',
      rejected: 'archived',
      published: 'published',
    };
    return map[status] || 'draft';
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
    <div className="platform-page">
      <div className="platform-header">
        <h1>VA Listing Upload</h1>
        <p className="platform-subtitle">
          Submit listings for review. All VA uploads are set to Pending Review until approved by an admin.
        </p>
        <button
          type="button"
          className="crm-btn crm-btn-primary"
          onClick={() => (showForm ? closeForm() : openAddForm())}
        >
          {showForm ? 'Cancel' : '+ Add New Listing'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="platform-form crm-form">
          <h3>{editingId ? 'Edit Listing' : 'New Listing'}</h3>
          <div className="crm-form-section">
            <div className="crm-form-field">
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={submitting}
              />
            </div>
            <div className="crm-form-field">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                disabled={submitting}
              />
            </div>
            <div className="crm-form-row">
              <div className="crm-form-field">
                <label htmlFor="type">Type *</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                >
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent</option>
                </select>
              </div>
              <div className="crm-form-field">
                <label htmlFor="price">Price</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="crm-form-field">
              <label htmlFor="address">Address</label>
              <input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>
            <div className="crm-form-row">
              <div className="crm-form-field">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>
              <div className="crm-form-field">
                <label htmlFor="state">State</label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  value={formData.state}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>
              <div className="crm-form-field">
                <label htmlFor="zipCode">ZIP</label>
                <input
                  id="zipCode"
                  name="zipCode"
                  type="text"
                  value={formData.zipCode}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="crm-form-row">
              <div className="crm-form-field">
                <label htmlFor="bedrooms">Bedrooms</label>
                <input
                  id="bedrooms"
                  name="bedrooms"
                  type="number"
                  min="0"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>
              <div className="crm-form-field">
                <label htmlFor="bathrooms">Bathrooms</label>
                <input
                  id="bathrooms"
                  name="bathrooms"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>
              <div className="crm-form-field">
                <label htmlFor="squareFeet">Sq Ft</label>
                <input
                  id="squareFeet"
                  name="squareFeet"
                  type="number"
                  min="0"
                  value={formData.squareFeet}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="crm-form-field">
              <label htmlFor="lotSize">Lot Size</label>
              <input
                id="lotSize"
                name="lotSize"
                type="number"
                min="0"
                step="0.01"
                value={formData.lotSize}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>
            <div className="crm-form-field">
              <label htmlFor="yearBuilt">Year Built</label>
              <input
                id="yearBuilt"
                name="yearBuilt"
                type="number"
                min="1800"
                max={new Date().getFullYear()}
                value={formData.yearBuilt}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>
          </div>

          {editingId && (
            <div className="crm-form-section">
              <h3 className="crm-form-section-title">{t('properties.images')}</h3>
              <p className="crm-form-hint" style={{ marginBottom: 12 }}>
                {t('properties.imagesHint', { max: MAX_IMAGES_PER_PROPERTY })}
              </p>
              <div style={{ marginBottom: 16 }}>
                <PropertyImageUpload
                  onUpload={async (files) => {
                    if (!editingId) return;
                    setUploading(true);
                    try {
                      for (const file of files) {
                        await uploadPropertyImage(editingId, file);
                      }
                    } finally {
                      setUploading(false);
                    }
                  }}
                  onSuccess={(count) => {
                    showSuccess(count > 1 ? t('properties.imagesAdded', { count }) : t('properties.imageAdded'));
                    getPropertyMedia(editingId).then((list) =>
                      setMedia(Array.isArray(list) ? list.filter((m) => m.type === 'image') : [])
                    );
                    loadListings();
                  }}
                  onError={(msg) => showError(msg)}
                  uploading={uploading}
                  disabled={submitting}
                  maxFiles={MAX_IMAGES_PER_PROPERTY}
                  currentCount={media.length}
                />
              </div>
              {media.length > 0 && (
                <div className="property-gallery">
                  {media.map((m) => (
                    <div key={m.id} className="property-gallery-card">
                      <img src={m.url} alt="" />
                      <div className="property-gallery-buttons">
                        {!m.isPrimary && (
                          <button
                            type="button"
                            className="crm-btn crm-btn-secondary"
                            style={{ fontSize: 11 }}
                            disabled={mediaActionId !== null}
                            onClick={async () => {
                              setMediaActionId(m.id);
                              try {
                                await updatePropertyMedia(editingId, m.id, { isPrimary: true });
                                showSuccess(t('properties.setAsPrimary'));
                                getPropertyMedia(editingId).then((list) =>
                                  setMedia(Array.isArray(list) ? list.filter((x) => x.type === 'image') : [])
                                );
                              } catch (err) {
                                showError(err.message || t('common.error'));
                              } finally {
                                setMediaActionId(null);
                              }
                            }}
                          >
                            {t('properties.primary')}
                          </button>
                        )}
                        <button
                          type="button"
                          className="crm-btn crm-btn-secondary"
                          style={{ fontSize: 11, gridColumn: m.isPrimary ? '1 / -1' : undefined }}
                          disabled={mediaActionId !== null}
                          onClick={async () => {
                            setMediaActionId(m.id);
                            try {
                              await setPropertyThumbnail(editingId, m.url);
                              showSuccess(t('properties.thumbnailSet'));
                              loadListings();
                            } catch (err) {
                              showError(err.message || t('common.error'));
                            } finally {
                              setMediaActionId(null);
                            }
                          }}
                        >
                          {t('properties.thumbnail')}
                        </button>
                        <div className="property-gallery-buttons-row2">
                          <button
                            type="button"
                            className="crm-btn"
                            style={{ fontSize: 11, background: '#dc2626', color: '#fff' }}
                            disabled={mediaActionId !== null}
                            onClick={async () => {
                              if (!window.confirm(t('properties.removeImageConfirm'))) return;
                              setMediaActionId(m.id);
                              try {
                                await deletePropertyMedia(editingId, m.id);
                                showSuccess(t('properties.imageRemoved'));
                                getPropertyMedia(editingId).then((list) =>
                                  setMedia(Array.isArray(list) ? list.filter((x) => x.type === 'image') : [])
                                );
                                loadListings();
                              } catch (err) {
                                showError(err.message || t('common.error'));
                              } finally {
                                setMediaActionId(null);
                              }
                            }}
                          >
                            {t('common.delete')}
                          </button>
                          {media.indexOf(m) > 0 ? (
                            <button
                              type="button"
                              className="crm-btn crm-btn-secondary"
                              style={{ fontSize: 11 }}
                              disabled={mediaActionId !== null}
                              onClick={async () => {
                                const idx = media.indexOf(m);
                                if (idx <= 0) return;
                                setMediaActionId(m.id);
                                try {
                                  await updatePropertyMedia(editingId, m.id, { displayOrder: idx - 1 });
                                  await updatePropertyMedia(editingId, media[idx - 1].id, { displayOrder: idx });
                                  showSuccess(t('properties.orderUpdated'));
                                  getPropertyMedia(editingId).then((list) =>
                                    setMedia(Array.isArray(list) ? list.filter((x) => x.type === 'image') : [])
                                  );
                                } catch (err) {
                                  showError(err.message || t('common.error'));
                                } finally {
                                  setMediaActionId(null);
                                }
                              }}
                            >
                              {t('properties.moveUp')}
                            </button>
                          ) : (
                            <div />
                          )}
                          {media.indexOf(m) < media.length - 1 ? (
                            <button
                              type="button"
                              className="crm-btn crm-btn-secondary"
                              style={{ fontSize: 11 }}
                              disabled={mediaActionId !== null}
                              onClick={async () => {
                                const idx = media.indexOf(m);
                                if (idx < 0 || idx >= media.length - 1) return;
                                setMediaActionId(m.id);
                                try {
                                  await updatePropertyMedia(editingId, m.id, { displayOrder: idx + 1 });
                                  await updatePropertyMedia(editingId, media[idx + 1].id, { displayOrder: idx });
                                  showSuccess(t('properties.orderUpdated'));
                                  getPropertyMedia(editingId).then((list) =>
                                    setMedia(Array.isArray(list) ? list.filter((x) => x.type === 'image') : [])
                                  );
                                } catch (err) {
                                  showError(err.message || t('common.error'));
                                } finally {
                                  setMediaActionId(null);
                                }
                              }}
                            >
                              {t('properties.moveDown')}
                            </button>
                          ) : (
                            <div />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="crm-form-actions">
            <button type="button" className="crm-btn crm-btn-secondary" onClick={closeForm} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="crm-btn crm-btn-primary" disabled={submitting}>
              {submitting ? (editingId ? 'Updating...' : 'Submitting...') : (editingId ? 'Update' : 'Submit for Review')}
            </button>
          </div>
        </form>
      )}

      {error && <div className="crm-error">{error}</div>}

      <h2 style={{ marginTop: '24px', marginBottom: '16px' }}>My Uploads</h2>
      {loading ? (
        <div className="crm-loading">
          <div className="crm-skeleton"></div>
          <div className="crm-skeleton"></div>
          <div className="crm-skeleton"></div>
        </div>
      ) : listings.length === 0 ? (
        <div className="properties-empty">
          No listings yet. Add your first listing above.
        </div>
      ) : (
        <div className="properties-grid">
          {listings.map((item) => {
            const statusClass = getStatusClass(item.status);
            const canEdit = item.status === 'pending_review';
            return (
              <div key={item.id} className={`property-card ${statusClass}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, flex: 1 }}>
                    {item.title || 'Untitled'}
                  </h3>
                  <span className={`property-status ${statusClass}`}>{getStatusLabel(item.status)}</span>
                </div>
                <div className="property-meta" style={{ marginBottom: '8px' }}>
                  {item.address && `${item.address}, `}
                  {item.city && `${item.city}, `}
                  {item.state}
                  {item.zipCode && ` ${item.zipCode}`}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 16px', marginBottom: '10px', fontSize: '12px', color: 'var(--property-text-muted, #64748b)' }}>
                  {item.price != null && <span><strong>Price:</strong> {formatPrice(item.price)}</span>}
                  {item.bedrooms != null && <span><strong>Beds:</strong> {item.bedrooms}</span>}
                  {item.bathrooms != null && <span><strong>Baths:</strong> {item.bathrooms}</span>}
                  {item.squareFeet != null && <span><strong>Sq Ft:</strong> {item.squareFeet.toLocaleString()}</span>}
                </div>
                <div className="property-meta" style={{ fontSize: '11px' }}>
                  Submitted {formatDate(item.createdAt)}
                  {item.rejectionReason && (
                    <div style={{ marginTop: '8px', color: 'var(--status-archived, #ef4444)' }}>
                      Rejection: {item.rejectionReason}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  {canEdit && (
                    <button
                      type="button"
                      className="crm-btn crm-btn-secondary"
                      style={{ flex: 1, minWidth: 80 }}
                      onClick={() => openEditForm(item)}
                    >
                      Edit
                    </button>
                  )}
                  <Link
                    to={`/listings/${item.id}`}
                    className="crm-btn crm-btn-secondary"
                    style={{ flex: 1, minWidth: 80, textAlign: 'center' }}
                  >
                    View
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
