import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/apiClient';
import { getPropertyMedia, updatePropertyMedia, deletePropertyMedia, setPropertyThumbnail, uploadPropertyImage, MAX_IMAGES_PER_PROPERTY } from '../../api/propertiesApi';
import PropertyImageUpload from '../../components/PropertyImageUpload';
import './properties.css';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import PropertyMap from '../../components/PropertyMap';

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [property, setProperty] = useState(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignedAgentId, setAssignedAgentId] = useState(null);
  const [crmStatusUpdating, setCrmStatusUpdating] = useState(false);
  const [assignAgentUpdating, setAssignAgentUpdating] = useState(false);
  const [mediaActionId, setMediaActionId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (isAuthenticated() && user) {
      loadProperty();
    }
  }, [id, isAuthenticated, user]);

  const loadCrmFeedItem = async () => {
    if (!id || !user) return;
    try {
      const feed = await apiClient.request('/crm/properties/feed');
      const list = Array.isArray(feed) ? feed : feed?.data ?? [];
      const item = list.find((p) => p.id === id);
      if (item?.assigned_agent_id) setAssignedAgentId(item.assigned_agent_id);
      else setAssignedAgentId(null);
    } catch {
      setAssignedAgentId(null);
    }
  };

  const loadMedia = async () => {
    if (!id) return;
    try {
      const list = await getPropertyMedia(id);
      setMedia(Array.isArray(list) ? list : []);
    } catch {
      setMedia([]);
    }
  };

  const loadProperty = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.request(`/properties/${id}`);
      setProperty(data);
      loadCrmFeedItem();
      await loadMedia();
    } catch (err) {
      setError(t('properties.loadFailed') + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('properties.deletePropertyConfirm'))) {
      return;
    }

    try {
      await apiClient.request(`/properties/${id}`, { method: 'DELETE' });
      navigate('/dashboard/properties');
    } catch (err) {
      alert(t('properties.deleteFailed') + ': ' + err.message);
    }
  };

  const handlePublish = async () => {
    try {
      await apiClient.request(`/properties/${id}/publish`, { method: 'POST' });
      loadProperty(); // Reload to get updated status
    } catch (err) {
      alert(t('properties.publishFailed') + ': ' + err.message);
    }
  };

  const mapStatusToCrm = (s) => (s === 'published' ? 'available' : s === 'reserved' ? 'reserved' : s === 'sold' ? 'sold' : 'available');
  const currentCrmStatus = mapStatusToCrm(property?.status);

  const handleCrmStatusChange = async (status) => {
    if (!id || crmStatusUpdating) return;
    setCrmStatusUpdating(true);
    try {
      await apiClient.request(`/crm/properties/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      loadProperty();
    } catch (err) {
      alert(t('properties.crmStatusUpdateFailed') + ': ' + err.message);
    } finally {
      setCrmStatusUpdating(false);
    }
  };

  const handleAssignAgent = async (agentId) => {
    if (!id || assignAgentUpdating) return;
    setAssignAgentUpdating(true);
    try {
      await apiClient.request(`/crm/properties/${id}/assign-agent`, {
        method: 'POST',
        body: JSON.stringify({ agent_id: agentId || null }),
      });
      setAssignedAgentId(agentId || null);
    } catch (err) {
      alert(t('properties.assignAgentFailed') + ': ' + err.message);
    } finally {
      setAssignAgentUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  const getStatusBadgeClass = (status) => {
    return `crm-item-badge badge-${status || 'draft'}`;
  };

  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div>{t('common.loading')}</div>
      </div>
    );
  }

  if (!isAuthenticated() || !user) {
    return null;
  }

  if (error || !property) {
    return (
      <div>
        <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>Property Details</h1>
        <div className="crm-error">
          {error || 'Property not found'}
        </div>
        <Link to="/dashboard/properties" className="crm-btn crm-btn-secondary" style={{ marginTop: '16px' }}>
          {t('properties.backToProperties')}
        </Link>
      </div>
    );
  }

  const images = media.filter((m) => m.type === 'image');

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 600 }}>{property.title}</h1>
        <span className={getStatusBadgeClass(property.status)}>
          {property.status === 'published' ? t('properties.published') : property.status === 'draft' ? t('properties.draft') : property.status === 'sold' ? t('properties.sold') : property.status === 'rented' ? t('properties.rented') : property.status === 'archived' ? t('properties.archived') : (property.status || 'draft')}
        </span>
      </div>

      {/* Thumbnail / hero image */}
      {(property.thumbnailUrl || images.length > 0) && (
        <div style={{ marginBottom: '24px', borderRadius: '12px', overflow: 'hidden', aspectRatio: '16/10', maxHeight: 400, background: 'var(--border)' }}>
          <img
            src={property.thumbnailUrl || images[0]?.url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      <div className="crm-section" style={{ marginBottom: '24px' }}>
        <h3 className="crm-section-title">Basic Information</h3>
        <div className="crm-item-details" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div><strong>Type:</strong> {property.type === 'sale' ? 'For Sale' : 'For Rent'}</div>
          {property.price && <div><strong>Price:</strong> {formatPrice(property.price)}</div>}
          {property.bedrooms && <div><strong>Bedrooms:</strong> {property.bedrooms}</div>}
          {property.bathrooms && <div><strong>Bathrooms:</strong> {property.bathrooms}</div>}
          {property.squareFeet && <div><strong>Square Feet:</strong> {property.squareFeet.toLocaleString()}</div>}
          {property.lotSize && <div><strong>Lot Size:</strong> {property.lotSize}</div>}
          {property.yearBuilt && <div><strong>Year Built:</strong> {property.yearBuilt}</div>}
        </div>
      </div>

      {property.description && (
        <div className="crm-section" style={{ marginBottom: '24px' }}>
          <h3 className="crm-section-title">Description</h3>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{property.description}</p>
        </div>
      )}

      <div className="crm-section" style={{ marginBottom: '24px' }}>
        <h3 className="crm-section-title">Location</h3>
        <div className="crm-item-details">
          {property.address && <div><strong>Address:</strong> {property.address}</div>}
          {(property.city || property.state || property.zipCode) && (
            <div>
              <strong>City, State ZIP:</strong>{' '}
              {[property.city, property.state, property.zipCode].filter(Boolean).join(', ')}
            </div>
          )}
          {(property.latitude && property.longitude) && (
            <div>
              <strong>Coordinates:</strong> {property.latitude}, {property.longitude}
            </div>
          )}
        </div>
      </div>

      {/* Gallery */}
      <div className="crm-section" style={{ marginBottom: '24px' }}>
        <h3 className="crm-section-title">{t('properties.images')}</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          {t('properties.galleryHint', { max: MAX_IMAGES_PER_PROPERTY })}
        </p>
        <div style={{ marginBottom: 16 }}>
          <PropertyImageUpload
            onUpload={async (files) => {
              if (!id) return;
              setUploading(true);
              try {
                for (const file of files) {
                  await uploadPropertyImage(id, file);
                }
              } finally {
                setUploading(false);
              }
            }}
            onSuccess={(count) => {
              showSuccess(count > 1 ? t('properties.imagesAdded', { count }) : t('properties.imageAdded'));
              loadMedia();
              loadProperty();
            }}
            onError={(msg) => showError(msg)}
            uploading={uploading}
            disabled={false}
            maxFiles={MAX_IMAGES_PER_PROPERTY}
            currentCount={images.length}
          />
        </div>
        {images.length > 0 && (
          <div className="property-gallery">
            {images.map((m) => (
              <div key={m.id} className="property-gallery-card">
                <img src={m.url} alt="" />
                <div className="property-gallery-buttons">
                  {/* Row 1: Primary | Thumbnail - Thumbnail spans full width when Primary hidden */}
                  {!m.isPrimary && (
                    <button
                      type="button"
                      className="crm-btn crm-btn-secondary"
                      style={{ fontSize: 11 }}
                      disabled={mediaActionId !== null}
                      onClick={async () => {
                        setMediaActionId(m.id);
                        try {
                          await updatePropertyMedia(id, m.id, { isPrimary: true });
                          showSuccess(t('properties.setAsPrimary'));
                          await loadMedia();
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
                        await setPropertyThumbnail(id, m.url);
                        showSuccess(t('properties.setAsThumbnail'));
                        await loadProperty();
                      } catch (err) {
                        showError(err.message || t('common.error'));
                      } finally {
                        setMediaActionId(null);
                      }
                    }}
                  >
                    {t('properties.thumbnail')}
                  </button>
                  {/* Row 2: Delete | Up | Down */}
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
                          await deletePropertyMedia(id, m.id);
                          showSuccess(t('properties.imageRemoved'));
                          await loadMedia();
                          await loadProperty();
                        } catch (err) {
                          showError(err.message || t('common.error'));
                        } finally {
                          setMediaActionId(null);
                        }
                      }}
                    >
                      {t('common.delete')}
                    </button>
                    {images.indexOf(m) > 0 ? (
                      <button
                        type="button"
                        className="crm-btn crm-btn-secondary"
                        style={{ fontSize: 11 }}
                        disabled={mediaActionId !== null}
                        onClick={async () => {
                          const idx = images.indexOf(m);
                          if (idx <= 0) return;
                          setMediaActionId(m.id);
                          try {
                            await updatePropertyMedia(id, m.id, { displayOrder: idx - 1 });
                            await updatePropertyMedia(id, images[idx - 1].id, { displayOrder: idx });
                            showSuccess(t('properties.orderUpdated'));
                            await loadMedia();
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
                    {images.indexOf(m) < images.length - 1 && images.indexOf(m) >= 0 ? (
                      <button
                        type="button"
                        className="crm-btn crm-btn-secondary"
                        style={{ fontSize: 11 }}
                        disabled={mediaActionId !== null}
                        onClick={async () => {
                          const idx = images.indexOf(m);
                          if (idx < 0 || idx >= images.length - 1) return;
                          setMediaActionId(m.id);
                          try {
                            await updatePropertyMedia(id, m.id, { displayOrder: idx + 1 });
                            await updatePropertyMedia(id, images[idx + 1].id, { displayOrder: idx });
                            showSuccess(t('properties.orderUpdated'));
                            await loadMedia();
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

      {/* Map Section */}
      {property.latitude && property.longitude && (
        <div className="crm-section" style={{ marginBottom: '24px' }}>
          <h3 className="crm-section-title">{t('properties.map')}</h3>
          <div style={{ height: '400px', borderRadius: '8px', overflow: 'hidden' }}>
            <PropertyMap 
              properties={[property]} 
              selectedProperty={property}
            />
          </div>
        </div>
      )}

      {/* CRM: Assign agent + status (Available / Reserved / Sold) */}
      <div className="crm-section" style={{ marginBottom: '24px' }}>
        <h3 className="crm-section-title">{t('properties.crm')}</h3>
        <div className="crm-item-details" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <strong style={{ display: 'block', marginBottom: '6px' }}>{t('properties.assignToAgent')}</strong>
            <select
              value={assignedAgentId || ''}
              onChange={(e) => {
                const v = e.target.value;
                handleAssignAgent(v || null);
              }}
              disabled={assignAgentUpdating}
              style={{
                minWidth: '200px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border, #e5e7eb)',
                background: 'var(--card, #fff)',
                color: 'var(--text, #111)',
              }}
            >
              <option value="">{t('properties.unassigned')}</option>
              {user?.id && (
                <option value={user.id}>{t('properties.me')} ({user.email || user.name || t('properties.currentUser')})</option>
              )}
            </select>
          </div>
          <div>
            <strong style={{ display: 'block', marginBottom: '6px' }}>{t('properties.crmStatus')}</strong>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['available', 'reserved', 'sold'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleCrmStatusChange(status)}
                  disabled={crmStatusUpdating || currentCrmStatus === status}
                  className={currentCrmStatus === status ? 'crm-btn crm-btn-primary' : 'crm-btn crm-btn-secondary'}
                  style={{ textTransform: 'capitalize' }}
                >
                  {status === 'available' ? t('properties.available') : status === 'reserved' ? t('properties.reserved') : t('properties.sold')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="crm-section" style={{ marginBottom: '24px' }}>
        <h3 className="crm-section-title">Metadata</h3>
        <div className="crm-item-details">
          <div><strong>Created:</strong> {formatDate(property.createdAt)}</div>
          <div><strong>Updated:</strong> {formatDate(property.updatedAt)}</div>
          {property.publishedAt && <div><strong>{t('properties.published')}:</strong> {formatDate(property.publishedAt)}</div>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
        <Link to={`/dashboard/properties/${id}/edit`} className="crm-btn crm-btn-primary">
          Edit Property
        </Link>
        {property.status !== 'published' && (
          <button onClick={handlePublish} className="crm-btn crm-btn-primary">
            Publish
          </button>
        )}
        <button onClick={handleDelete} className="crm-btn crm-btn-danger">
          Delete
        </button>
        <Link to="/dashboard/properties" className="crm-btn crm-btn-secondary">
          {t('properties.backToProperties')}
        </Link>
      </div>
    </div>
  );
}
