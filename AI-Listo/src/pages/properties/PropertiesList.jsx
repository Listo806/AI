import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useApiErrorHandler } from '../../utils/useApiErrorHandler';
import './properties.css';

export default function PropertiesList() {
  const { t } = useTranslation();
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
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>{t('properties.title')}</h1>

      {/* Add Property Button */}
      <div style={{ marginBottom: '24px' }}>
        <Link to="/dashboard/properties/new" className="crm-btn crm-btn-primary">
          + {t('properties.addProperty')}
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
          {t('properties.noProperties')}
        </div>
      ) : (
        <div className="properties-grid">
          {properties.map((property) => {
            const statusClass = getStatusClassName(property.status);
            return (
              <div key={property.id} className={`property-card ${statusClass}`}>
                {/* Header Row: Title + Status */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start', 
                  marginBottom: '8px',
                  gap: '12px'
                }}>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: '15px', 
                    fontWeight: '600',
                    color: 'var(--property-text-primary, #E5E7EB)',
                    lineHeight: '1.3',
                    flex: 1
                  }}>
                    {property.title || 'Untitled Property'}
                  </h3>
                  <span className={`property-status ${statusClass}`}>
                    {property.status === 'published' ? t('properties.published') :
                     property.status === 'draft' ? t('properties.draft') :
                     property.status === 'archived' || property.status === 'sold' || property.status === 'rented' ? t('properties.archived') :
                     t('properties.draft')}
                  </span>
                </div>
                
                {/* Address - Compact */}
                <div className="property-meta" style={{ marginBottom: '8px' }}>
                  {property.address && `${property.address}, `}
                  {property.city && `${property.city}, `}
                  {property.state && property.state}
                  {property.zipCode && ` ${property.zipCode}`}
                </div>
                
                {/* Metadata - Inline, Compact */}
                <div style={{ 
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px 16px',
                  marginBottom: '10px',
                  fontSize: '12px',
                  color: 'var(--property-text-muted, rgba(255, 255, 255, 0.7))'
                }}>
                  {property.price && (
                    <span><strong>{t('properties.price')}:</strong> {formatPrice(property.price)}</span>
                  )}
                  {property.type && (
                    <span><strong>{t('common.status')}:</strong> {property.type === 'sale' ? t('properties.published') : t('properties.draft')}</span>
                  )}
                  {property.bedrooms && (
                    <span><strong>{t('properties.bedrooms')}:</strong> {property.bedrooms}</span>
                  )}
                  {property.bathrooms && (
                    <span><strong>{t('properties.bathrooms')}:</strong> {property.bathrooms}</span>
                  )}
                  {property.squareFeet && (
                    <span><strong>{t('properties.sqft')}:</strong> {property.squareFeet.toLocaleString()}</span>
                  )}
                </div>

                {/* Action Button - Prominent */}
                <div className="property-action">
                  <Link 
                    to={`/dashboard/properties/${property.id}`} 
                    className="crm-btn crm-btn-secondary" 
                    style={{ 
                      width: '100%', 
                      justifyContent: 'center',
                      padding: '8px 16px',
                      fontSize: '13px'
                    }}
                  >
                    {t('common.view')} / {t('common.edit')}
                  </Link>
                </div>

                {/* Footer - Minimal */}
                <div className="property-meta" style={{ marginTop: '8px', fontSize: '11px' }}>
                  {t('properties.lastUpdated')} {formatDate(property.createdAt)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
