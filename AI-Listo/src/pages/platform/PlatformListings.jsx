import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getMyPlatformListings, createPlatformListing } from '../../api/platformApi';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import './platform.css';

const PLATFORM_STATUS_MAP = {
  pending_review: 'pending_review',
  approved: 'approved',
  rejected: 'rejected',
  published: 'published',
};

export default function PlatformListings() {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  useEffect(() => {
    if (isAuthenticated() && user && !authLoading) {
      loadListings();
    }
  }, [isAuthenticated, user, authLoading]);

  const loadListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyPlatformListings();
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
      await createPlatformListing(submitData);
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
      setShowForm(false);
      loadListings();
    } catch (err) {
      showError(err.message || 'Failed to submit listing');
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
    if (!price) return 'N/A';
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
        <h1>Marketplace Listings</h1>
        <p className="platform-subtitle">
          Submit listings to the marketplace. They will be reviewed before appearing on the public site.
        </p>
        <button
          type="button"
          className="crm-btn crm-btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Submit Listing'}
        </button>
      </div>

      {showForm && (
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
            <button type="button" className="crm-btn crm-btn-secondary" onClick={() => setShowForm(false)} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="crm-btn crm-btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        </form>
      )}

      {error && <div className="crm-error">{error}</div>}

      <h2 style={{ marginTop: '24px', marginBottom: '16px' }}>My Submissions</h2>
      {loading ? (
        <div className="crm-loading">
          <div className="crm-skeleton"></div>
          <div className="crm-skeleton"></div>
          <div className="crm-skeleton"></div>
        </div>
      ) : listings.length === 0 ? (
        <div className="properties-empty">
          No listings yet. Submit your first listing above.
        </div>
      ) : (
        <div className="properties-grid">
          {listings.map((item) => {
            const statusClass = getStatusClass(item.status);
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 16px', marginBottom: '10px', fontSize: '12px', color: 'var(--property-text-muted, rgba(255,255,255,0.7))' }}>
                  {item.price && <span><strong>Price:</strong> {formatPrice(item.price)}</span>}
                  {item.bedrooms && <span><strong>Beds:</strong> {item.bedrooms}</span>}
                  {item.bathrooms && <span><strong>Baths:</strong> {item.bathrooms}</span>}
                  {item.squareFeet && <span><strong>Sq Ft:</strong> {item.squareFeet.toLocaleString()}</span>}
                </div>
                <div className="property-meta" style={{ fontSize: '11px' }}>
                  Submitted {formatDate(item.createdAt)}
                  {item.rejectionReason && (
                    <div style={{ marginTop: '8px', color: 'var(--status-archived)' }}>
                      Rejection: {item.rejectionReason}
                    </div>
                  )}
                </div>
                <Link to={`/listings/${item.id}`} className="crm-btn crm-btn-secondary" style={{ marginTop: '12px', display: 'inline-block', width: '100%', textAlign: 'center' }}>
                  View on Marketplace
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
