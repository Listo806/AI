import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createVaListing } from '../../api/platformApi';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import '../platform/platform.css';

export default function VaUpload() {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [submitting, setSubmitting] = useState(false);
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
    bedrooms: '',
    bathrooms: '',
    squareFeet: '',
    lotSize: '',
    yearBuilt: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      await createVaListing(submitData);
      showSuccess('Listing submitted! It will be reviewed before publishing.');
      setFormData({
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
      });
    } catch (err) {
      showError(err.message || 'Failed to submit listing');
      setError(err.message || 'Failed to submit listing');
    } finally {
      setSubmitting(false);
    }
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
      </div>

      {error && <div className="crm-error">{error}</div>}

      <form onSubmit={handleSubmit} className="platform-form crm-form">
        <h3>New Listing</h3>
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
        </div>
        <div className="crm-form-actions">
          <button type="submit" className="crm-btn crm-btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </form>
    </div>
  );
}
