import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/apiClient';
import { getMyTeams } from '../../api/platformApi';
import { getPropertyMedia, uploadPropertyImage, setPropertyThumbnail, MAX_IMAGES_PER_PROPERTY } from '../../api/propertiesApi';
import PropertyImageUpload from '../../components/PropertyImageUpload';
import { useAuth } from '../../context/AuthContext';

/** Allowed property type values (must match backend enum) */
const PROPERTY_TYPE_OPTIONS = ['house', 'apartment', 'land', 'commercial', 'villa', 'office'];
import { useApiErrorHandler } from '../../utils/useApiErrorHandler';
import { useNotification } from '../../context/NotificationContext';

export default function PropertyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { handleError } = useApiErrorHandler();
  const { showSuccess, showError } = useNotification();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [teams, setTeams] = useState([]);
  const [media, setMedia] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    price: '',
    type: 'sale',
    listingType: 'marketplace',
    propertyType: '',
    status: 'draft',
    bedrooms: '',
    bathrooms: '',
    squareFeet: '',
    lotSize: '',
    yearBuilt: '',
    latitude: '',
    longitude: '',
    teamId: '',
  });

  useEffect(() => {
    if (isAuthenticated() && user) {
      getMyTeams().then((list) => setTeams(Array.isArray(list) ? list : []));
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isEdit && isAuthenticated() && user) {
      loadProperty();
    }
  }, [id, isAuthenticated, user]);

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
    try {
      const property = await apiClient.request(`/properties/${id}`);
      const lt = (property.listingType || property.listing_type || '').toLowerCase();
      if (lt === 'vacation') {
        navigate(`/dashboard/vacation-rentals/upload/${id}`, { replace: true });
        return;
      }
      setFormData({
        title: property.title || '',
        description: property.description || '',
        address: property.address || '',
        city: property.city || '',
        state: property.state || '',
        zipCode: property.zipCode || '',
        price: property.price || '',
        type: property.type || 'sale',
        listingType: 'marketplace',
        propertyType: property.propertyType || '',
        status: property.status || 'draft',
        bedrooms: property.bedrooms || '',
        bathrooms: property.bathrooms || '',
        squareFeet: property.squareFeet || '',
        lotSize: property.lotSize || '',
        yearBuilt: property.yearBuilt || '',
        latitude: property.latitude || '',
        longitude: property.longitude || '',
        teamId: property.teamId ?? '',
      });
      await loadMedia();
    } catch (err) {
      setError(t('properties.loadFailed') + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Prepare data - convert empty strings to null and numbers
      const submitData = {
        title: formData.title,
        description: formData.description || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        zipCode: formData.zipCode || null,
        price: formData.price ? parseFloat(formData.price) : null,
        type: formData.type,
        listingType: 'marketplace',
        propertyType: formData.propertyType || null,
        status: formData.status,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        squareFeet: formData.squareFeet ? parseFloat(formData.squareFeet) : null,
        lotSize: formData.lotSize ? parseFloat(formData.lotSize) : null,
        yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        teamId: formData.teamId || null,
      };

      if (isEdit) {
        await apiClient.request(`/properties/${id}`, {
          method: 'PUT',
          body: JSON.stringify(submitData),
        });
        showSuccess(t('properties.propertyUpdated'));
      } else {
        await apiClient.request('/properties', {
          method: 'POST',
          body: JSON.stringify(submitData),
        });
        showSuccess(t('properties.propertyCreated'));
      }

      // Small delay to show success message before navigation
      setTimeout(() => {
        navigate('/dashboard/properties');
      }, 500);
    } catch (err) {
      const isSubscriptionError = handleError(err, 'Failed to save property');
      setError(err.message || t('properties.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(t('properties.deleteConfirm'));

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiClient.request(`/properties/${id}`, {
        method: 'DELETE',
      });
      navigate('/dashboard/properties');
    } catch (err) {
      setError(err.message || t('properties.deleteFailed'));
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div>{t('common.loading')}</div>
      </div>
    );
  }

  if (!isAuthenticated() || !user) {
    return null;
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>
        {isEdit ? t('properties.editProperty') : t('properties.newProperty')}
      </h1>
      {error && (
        <div className="crm-error" style={{ marginBottom: '24px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="crm-form">
          <div className="crm-form-section">
            <h3 className="crm-form-section-title">{t('properties.basicInfo')}</h3>
            
            <div className="crm-form-field">
              <label htmlFor="title">{t('properties.titleRequired')}</label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="crm-form-field">
              <label htmlFor="description">{t('properties.description')}</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                disabled={loading}
              />
            </div>

            <div className="crm-form-row">
              <div className="crm-form-field">
                <label htmlFor="type">{t('properties.marketplaceListingType')}</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="sale">{t('properties.buy')}</option>
                  <option value="rent">{t('properties.rent')}</option>
                </select>
              </div>
            </div>

            <div className="crm-form-row">
              <div className="crm-form-field">
                <label htmlFor="price">{t('properties.price')}</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="crm-form-field">
              <label htmlFor="status">{t('properties.status')}</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="draft">{t('properties.draft')}</option>
                <option value="published">{t('properties.published')}</option>
                <option value="sold">{t('properties.sold')}</option>
                <option value="rented">{t('properties.rented')}</option>
              </select>
            </div>

            <div className="crm-form-field">
              <label htmlFor="teamId">{t('properties.team')}</label>
              <select
                id="teamId"
                name="teamId"
                value={formData.teamId}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">{t('properties.useCurrentTeam')}</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
              <span className="crm-form-hint">{t('properties.teamHint')}</span>
            </div>
          </div>

          <div className="crm-form-section">
            <h3 className="crm-form-section-title">{t('properties.location')}</h3>
            
            <div className="crm-form-field">
              <label htmlFor="address">{t('properties.address')}</label>
              <input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="crm-form-row">
              <div className="crm-form-field">
                <label htmlFor="city">{t('properties.city')}</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="crm-form-field">
                <label htmlFor="state">{t('properties.state')}</label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  value={formData.state}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="crm-form-field">
                <label htmlFor="zipCode">{t('properties.zipCode')}</label>
                <input
                  id="zipCode"
                  name="zipCode"
                  type="text"
                  value={formData.zipCode}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="crm-form-row">
              <div className="crm-form-field">
                <label htmlFor="latitude">{t('properties.latitude')}</label>
                <input
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="crm-form-field">
                <label htmlFor="longitude">{t('properties.longitude')}</label>
                <input
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="crm-form-section">
            <h3 className="crm-form-section-title">{t('properties.propertyDetails')}</h3>
            
            <div className="crm-form-field">
              <label htmlFor="propertyType">{t('properties.propertyType')}</label>
              <select
                id="propertyType"
                name="propertyType"
                value={formData.propertyType}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">{t('properties.propertyTypePlaceholder')}</option>
                {PROPERTY_TYPE_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {t(`properties.propertyType_${value}`)}
                  </option>
                ))}
              </select>
            </div>

            <div className="crm-form-row">
              <div className="crm-form-field">
                <label htmlFor="bedrooms">{t('properties.bedrooms')}</label>
                <input
                  id="bedrooms"
                  name="bedrooms"
                  type="number"
                  min="0"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="crm-form-field">
                <label htmlFor="bathrooms">{t('properties.bathrooms')}</label>
                <input
                  id="bathrooms"
                  name="bathrooms"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="crm-form-row">
              <div className="crm-form-field">
                <label htmlFor="squareFeet">{t('properties.squareFeet')}</label>
                <input
                  id="squareFeet"
                  name="squareFeet"
                  type="number"
                  min="0"
                  value={formData.squareFeet}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="crm-form-field">
                <label htmlFor="lotSize">{t('properties.lotSize')}</label>
                <input
                  id="lotSize"
                  name="lotSize"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.lotSize}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="crm-form-field">
                <label htmlFor="yearBuilt">{t('properties.yearBuilt')}</label>
                <input
                  id="yearBuilt"
                  name="yearBuilt"
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  value={formData.yearBuilt}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {isEdit && (
            <div className="crm-form-section">
              <h3 className="crm-form-section-title">{t('properties.images')}</h3>
              <p className="crm-form-hint" style={{ marginBottom: 12 }}>
                {t('properties.imagesHint', { max: MAX_IMAGES_PER_PROPERTY })}
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
                  }}
                  onError={(msg) => showError(msg)}
                  uploading={uploading}
                  disabled={loading}
                  maxFiles={MAX_IMAGES_PER_PROPERTY}
                  currentCount={media.filter((m) => m.type === 'image').length}
                />
              </div>
              {media.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {media.filter((m) => m.type === 'image').map((m) => (
                    <div key={m.id} style={{ width: 120, textAlign: 'center' }}>
                      <img
                        src={m.url}
                        alt=""
                        style={{ width: 100, height: 80, objectFit: 'cover', borderRadius: 8 }}
                      />
                      <button
                        type="button"
                        className="crm-btn crm-btn-secondary"
                        style={{ marginTop: 4, fontSize: 11 }}
                        onClick={async () => {
                          try {
                            await setPropertyThumbnail(id, m.url);
                            showSuccess(t('properties.thumbnailSet'));
                            loadProperty();
                          } catch (err) {
                            showError(err.message || t('properties.failedSetThumbnail'));
                          }
                        }}
                        disabled={loading}
                      >
                        {t('properties.setAsThumbnail')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="crm-form-actions">
            <button
              type="button"
              onClick={() => navigate('/dashboard/properties')}
              className="crm-btn crm-btn-secondary"
              disabled={loading}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="crm-btn crm-btn-primary"
              disabled={loading}
            >
              {loading ? t('properties.saving') : isEdit ? t('properties.updateProperty') : t('properties.createProperty')}
            </button>
          </div>
        </form>

        {/* Danger Zone - Only show in edit mode */}
        {isEdit && (
          <div className="crm-danger-zone">
            <div className="crm-danger-zone-header">
              <h3 className="crm-danger-zone-title">{t('properties.dangerZone')}</h3>
              <p className="crm-danger-zone-description">
                {t('properties.dangerZoneDesc')}
              </p>
            </div>
            <div className="crm-danger-zone-actions">
              <button
                type="button"
                onClick={handleDelete}
                className="crm-btn crm-btn-danger"
                disabled={loading}
              >
                {t('properties.deleteProperty')}
              </button>
            </div>
          </div>
        )}
    </div>
  );
}
