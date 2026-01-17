import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useApiErrorHandler } from '../../utils/useApiErrorHandler';
import { useNotification } from '../../context/NotificationContext';

export default function PropertyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { handleError } = useApiErrorHandler();
  const { showSuccess } = useNotification();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    price: '',
    type: 'sale',
    status: 'draft',
    bedrooms: '',
    bathrooms: '',
    squareFeet: '',
    lotSize: '',
    yearBuilt: '',
    latitude: '',
    longitude: '',
  });

  useEffect(() => {
    if (isEdit && isAuthenticated() && user) {
      loadProperty();
    }
  }, [id, isAuthenticated, user]);

  const loadProperty = async () => {
    setLoading(true);
    try {
      const property = await apiClient.request(`/properties/${id}`);
      setFormData({
        title: property.title || '',
        description: property.description || '',
        address: property.address || '',
        city: property.city || '',
        state: property.state || '',
        zipCode: property.zipCode || '',
        price: property.price || '',
        type: property.type || 'sale',
        status: property.status || 'draft',
        bedrooms: property.bedrooms || '',
        bathrooms: property.bathrooms || '',
        squareFeet: property.squareFeet || '',
        lotSize: property.lotSize || '',
        yearBuilt: property.yearBuilt || '',
        latitude: property.latitude || '',
        longitude: property.longitude || '',
      });
    } catch (err) {
      setError('Failed to load property: ' + err.message);
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
        status: formData.status,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        squareFeet: formData.squareFeet ? parseFloat(formData.squareFeet) : null,
        lotSize: formData.lotSize ? parseFloat(formData.lotSize) : null,
        yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };

      if (isEdit) {
        await apiClient.request(`/properties/${id}`, {
          method: 'PUT',
          body: JSON.stringify(submitData),
        });
        showSuccess('Property updated successfully!');
      } else {
        await apiClient.request('/properties', {
          method: 'POST',
          body: JSON.stringify(submitData),
        });
        showSuccess('Property created successfully!');
      }

      // Small delay to show success message before navigation
      setTimeout(() => {
        navigate('/dashboard/properties');
      }, 500);
    } catch (err) {
      const isSubscriptionError = handleError(err, 'Failed to save property');
      setError(err.message || 'Failed to save property');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete this listing? This action cannot be undone.'
    );

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
      setError(err.message || 'Failed to delete property');
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated() || !user) {
    return null;
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>
        {isEdit ? 'Edit Property' : 'New Property'}
      </h1>
      {error && (
        <div className="crm-error" style={{ marginBottom: '24px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="crm-form">
          <div className="crm-form-section">
            <h3 className="crm-form-section-title">Basic Information</h3>
            
            <div className="crm-form-field">
              <label htmlFor="title">Title *</label>
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
              <label htmlFor="description">Description</label>
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
                <label htmlFor="type">Type *</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>
            </div>

            <div className="crm-form-field">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="sold">Sold</option>
                <option value="rented">Rented</option>
              </select>
            </div>
          </div>

          <div className="crm-form-section">
            <h3 className="crm-form-section-title">Location</h3>
            
            <div className="crm-form-field">
              <label htmlFor="address">Address</label>
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
                <label htmlFor="city">City</label>
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
                <label htmlFor="state">State</label>
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
                <label htmlFor="zipCode">ZIP Code</label>
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
                <label htmlFor="latitude">Latitude</label>
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
                <label htmlFor="longitude">Longitude</label>
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
            <h3 className="crm-form-section-title">Property Details</h3>
            
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
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>
            </div>

            <div className="crm-form-row">
              <div className="crm-form-field">
                <label htmlFor="squareFeet">Square Feet</label>
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
                <label htmlFor="lotSize">Lot Size</label>
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
                <label htmlFor="yearBuilt">Year Built</label>
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

          <div className="crm-form-actions">
            <button
              type="button"
              onClick={() => navigate('/dashboard/properties')}
              className="crm-btn crm-btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="crm-btn crm-btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : isEdit ? 'Update Property' : 'Create Property'}
            </button>
          </div>
        </form>

        {/* Danger Zone - Only show in edit mode */}
        {isEdit && (
          <div className="crm-danger-zone">
            <div className="crm-danger-zone-header">
              <h3 className="crm-danger-zone-title">Danger Zone</h3>
              <p className="crm-danger-zone-description">
                Irreversible and destructive actions
              </p>
            </div>
            <div className="crm-danger-zone-actions">
              <button
                type="button"
                onClick={handleDelete}
                className="crm-btn crm-btn-danger"
                disabled={loading}
              >
                Delete Property
              </button>
            </div>
          </div>
        )}
    </div>
  );
}
