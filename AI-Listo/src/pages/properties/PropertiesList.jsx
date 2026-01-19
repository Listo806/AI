import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useApiErrorHandler } from '../../utils/useApiErrorHandler';
import './properties.css';

export default function PropertiesList() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { handleError } = useApiErrorHandler();
  const [properties, setProperties] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated() && user && !authLoading) {
      loadProperties();
    }
  }, [isAuthenticated, user, authLoading]);

  const loadProperties = async () => {
    setDashboardLoading(true);
    setError(null);

    try {
      const response = await apiClient.request('/properties');
      const propertiesData = Array.isArray(response) ? response : (response.data || response);
      // Sort by newest first
      const sorted = propertiesData.sort((a, b) => {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
      setProperties(sorted);
    } catch (err) {
      console.error('Failed to load properties:', err);
      handleError(err, 'Failed to load properties');
      setError(err.message || 'Failed to load properties');
    } finally {
      setDashboardLoading(false);
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

  const getStatusClassName = (status) => {
    const statusMap = {
      'published': 'published',
      'draft': 'draft',
      'archived': 'archived',
      'sold': 'archived',
      'rented': 'archived'
    };
    return statusMap[status] || 'draft';
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
    <div>
      {/* Page Title */}
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>Properties</h1>

      {/* Add Property Button */}
      <div style={{ marginBottom: '24px' }}>
        <Link to="/dashboard/properties/new" className="crm-btn crm-btn-primary">
          + Add Property
        </Link>
      </div>

      {error && (
        <div className="crm-error">
          {error}
        </div>
      )}


      {/* Properties List */}
      {dashboardLoading ? (
        <div className="crm-loading">
          <div className="crm-skeleton"></div>
          <div className="crm-skeleton"></div>
          <div className="crm-skeleton"></div>
        </div>
      ) : properties.length === 0 ? (
        <div className="properties-empty">
          No properties yet. Add your first listing.
        </div>
      ) : (
        <div>
          {properties.map((property) => {
            const statusClass = getStatusClassName(property.status);
            return (
              <div key={property.id} className={`property-card ${statusClass}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      margin: 0, 
                      fontSize: '18px', 
                      fontWeight: '600',
                      color: '#0f172a',
                      marginBottom: '4px'
                    }}>
                      {property.title || 'Untitled Property'}
                    </h3>
                    <div className="property-meta">
                      {property.address && `${property.address}, `}
                      {property.city && `${property.city}, `}
                      {property.state && property.state}
                      {property.zipCode && ` ${property.zipCode}`}
                    </div>
                  </div>
                  <span className={`property-status ${statusClass}`}>
                    {(property.status || 'draft').charAt(0).toUpperCase() + (property.status || 'draft').slice(1)}
                  </span>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                  gap: '12px',
                  marginTop: '12px'
                }}>
                  {property.price && (
                    <div style={{ fontSize: '14px', color: '#0f172a' }}>
                      <strong>Price:</strong> {formatPrice(property.price)}
                    </div>
                  )}
                  {property.type && (
                    <div style={{ fontSize: '14px', color: '#0f172a' }}>
                      <strong>Type:</strong> {property.type === 'sale' ? 'For Sale' : 'For Rent'}
                    </div>
                  )}
                  {property.bedrooms && (
                    <div style={{ fontSize: '14px', color: '#0f172a' }}>
                      <strong>Bedrooms:</strong> {property.bedrooms}
                    </div>
                  )}
                  {property.bathrooms && (
                    <div style={{ fontSize: '14px', color: '#0f172a' }}>
                      <strong>Bathrooms:</strong> {property.bathrooms}
                    </div>
                  )}
                  {property.squareFeet && (
                    <div style={{ fontSize: '14px', color: '#0f172a' }}>
                      <strong>Square Feet:</strong> {property.squareFeet.toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="property-action" style={{ marginTop: '12px' }}>
                  <Link 
                    to={`/dashboard/properties/${property.id}`} 
                    className="crm-btn crm-btn-secondary" 
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    View / Edit
                  </Link>
                </div>

                <div className="property-meta" style={{ marginTop: '12px', fontSize: '12px' }}>
                  Created: {formatDate(property.createdAt)}
                  {property.publishedAt && ` • Published: ${formatDate(property.publishedAt)}`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
