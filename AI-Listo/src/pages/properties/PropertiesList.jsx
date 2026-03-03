import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useApiErrorHandler } from '../../utils/useApiErrorHandler';
import './properties.css';

const PAGE_SIZE = 20;

export default function PropertiesList() {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { handleError } = useApiErrorHandler();
  const [properties, setProperties] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, limit: PAGE_SIZE, offset: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated() && user && !authLoading) {
      loadProperties((currentPage - 1) * PAGE_SIZE);
    }
  }, [isAuthenticated, user, authLoading, currentPage]);

  const loadProperties = async (offset = 0) => {
    setDashboardLoading(true);
    setError(null);

    try {
      const response = await apiClient.request(`/properties?limit=${PAGE_SIZE}&offset=${offset}`);
      const items = response?.items ?? (Array.isArray(response) ? response : response?.data ?? []);
      const total = response?.total ?? items.length;
      const sorted = Array.isArray(items)
        ? [...items].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        : [];
      setProperties(sorted);
      setPagination({ total, limit: PAGE_SIZE, offset });
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
        <div className="properties-grid properties-grid-rows">
          {properties.map((property) => {
            const statusClass = getStatusClassName(property.status);
            return (
              <div key={property.id} className={`property-card property-card-row ${statusClass}`}>
                {/* Thumbnail - Same aspect ratio as Marketplace (16/10), compact size */}
                <div className="property-card-thumb">
                  {property.thumbnailUrl ? (
                    <img src={property.thumbnailUrl} alt="" className="property-card-thumb-img" loading="lazy" />
                  ) : (
                    <div className="property-card-thumb-placeholder" />
                  )}
                </div>
                {/* Details - Aligned right of thumbnail */}
                <div className="property-card-body">
                  <div className="property-card-header-row">
                    <h3 className="property-card-title">
                      {property.title || 'Untitled Property'}
                    </h3>
                    <span className={`property-status ${statusClass}`}>
                      {property.status === 'published' ? t('properties.published') :
                       property.status === 'draft' ? t('properties.draft') :
                       property.status === 'archived' || property.status === 'sold' || property.status === 'rented' ? t('properties.archived') :
                       t('properties.draft')}
                    </span>
                  </div>
                  <div className="property-meta property-card-address">
                    {property.address && `${property.address}, `}
                    {property.city && `${property.city}, `}
                    {property.state && property.state}
                    {property.zipCode && ` ${property.zipCode}`}
                  </div>
                  <div className="property-card-meta-inline">
                    {property.price && (
                      <span><strong>{t('properties.price')}:</strong> {formatPrice(property.price)}</span>
                    )}
                    {property.propertyType && (
                      <span><strong>{t('properties.propertyType')}:</strong> {property.propertyType}</span>
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
                  <div className="property-card-footer">
                    <span className="property-meta" style={{ fontSize: '11px' }}>
                      {t('properties.lastUpdated')} {formatDate(property.createdAt)}
                    </span>
                    <Link
                      to={`/dashboard/properties/${property.id}`}
                      className="crm-btn crm-btn-secondary property-card-action-btn"
                    >
                      {t('common.view')} / {t('common.edit')}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!dashboardLoading && properties.length > 0 && pagination.total > PAGE_SIZE && (
        <div className="properties-pagination">
          <button
            type="button"
            className="properties-pagination-btn"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            aria-label={t('common.previous')}
          >
            ‹ {t('common.previous')}
          </button>
          <span className="properties-pagination-info">
            {t('common.page') || 'Page'} {currentPage} {t('common.of') || 'of'} {Math.ceil(pagination.total / PAGE_SIZE)} ({pagination.total} {t('properties.title')?.toLowerCase() || 'properties'})
          </span>
          <button
            type="button"
            className="properties-pagination-btn"
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage >= Math.ceil(pagination.total / PAGE_SIZE)}
            aria-label={t('common.next')}
          >
            {t('common.next')} ›
          </button>
        </div>
      )}
    </div>
  );
}
