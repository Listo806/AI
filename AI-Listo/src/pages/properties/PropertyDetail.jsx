import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import PropertyMap from '../../components/PropertyMap';

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated() && user) {
      loadProperty();
    }
  }, [id, isAuthenticated, user]);

  const loadProperty = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.request(`/properties/${id}`);
      setProperty(data);
    } catch (err) {
      setError('Failed to load property: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this property?')) {
      return;
    }

    try {
      await apiClient.request(`/properties/${id}`, { method: 'DELETE' });
      navigate('/properties');
    } catch (err) {
      alert('Failed to delete property: ' + err.message);
    }
  };

  const handlePublish = async () => {
    try {
      await apiClient.request(`/properties/${id}/publish`, { method: 'POST' });
      loadProperty(); // Reload to get updated status
    } catch (err) {
      alert('Failed to publish property: ' + err.message);
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
      <DashboardLayout title="Property Details">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <div>Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated() || !user) {
    return null;
  }

  if (error || !property) {
    return (
      <DashboardLayout title="Property Details">
        <div className="crm-error">
          {error || 'Property not found'}
        </div>
        <Link to="/properties" className="crm-btn crm-btn-secondary" style={{ marginTop: '16px' }}>
          Back to Properties
        </Link>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Property Details">
      <div style={{ maxWidth: '1000px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0 }}>{property.title}</h2>
          <span className={getStatusBadgeClass(property.status)}>
            {(property.status || 'draft').charAt(0).toUpperCase() + (property.status || 'draft').slice(1)}
          </span>
        </div>

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

        {/* Map Section */}
        {property.latitude && property.longitude && (
          <div className="crm-section" style={{ marginBottom: '24px' }}>
            <h3 className="crm-section-title">Map</h3>
            <div style={{ height: '400px', borderRadius: '8px', overflow: 'hidden' }}>
              <PropertyMap 
                properties={[property]} 
                selectedProperty={property}
              />
            </div>
          </div>
        )}

        <div className="crm-section" style={{ marginBottom: '24px' }}>
          <h3 className="crm-section-title">Metadata</h3>
          <div className="crm-item-details">
            <div><strong>Created:</strong> {formatDate(property.createdAt)}</div>
            <div><strong>Updated:</strong> {formatDate(property.updatedAt)}</div>
            {property.publishedAt && <div><strong>Published:</strong> {formatDate(property.publishedAt)}</div>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
          <Link to={`/properties/${id}/edit`} className="crm-btn crm-btn-primary">
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
          <Link to="/properties" className="crm-btn crm-btn-secondary">
            Back to List
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
