import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useApiErrorHandler } from '../../utils/useApiErrorHandler';
import PropertyMap from '../../components/PropertyMap';

export default function PropertiesList() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { handleError } = useApiErrorHandler();
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [allProperties, setAllProperties] = useState([]); // Store all properties for client-side filtering
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get type from URL parameter
  const urlType = searchParams.get('type') || '';
  
  // Filters
  const [filters, setFilters] = useState({
    type: urlType, // Initialize from URL
    status: '',
    search: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
  });

  // Sorting
  const [sortBy, setSortBy] = useState('newest');
  const [userLocation, setUserLocation] = useState(null); // For distance sorting


  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    if (!lat1 || !lng1 || !lat2 || !lng2) return Infinity;
    
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Update filters when URL type changes
  useEffect(() => {
    const urlType = searchParams.get('type') || '';
    if (filters.type !== urlType) {
      setFilters(prev => ({ ...prev, type: urlType }));
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated() && user && !authLoading) {
      loadProperties();
    }
  }, [isAuthenticated, user, authLoading]);

  // Apply client-side filtering and sorting when filters or sortBy changes
  useEffect(() => {
    if (allProperties.length === 0) return;
    
    let filtered = [...allProperties];

    // Apply filters
    if (filters.type) {
      filtered = filtered.filter(p => p.type === filters.type);
    }

    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        (p.title && p.title.toLowerCase().includes(searchLower)) ||
        (p.address && p.address.toLowerCase().includes(searchLower)) ||
        (p.city && p.city.toLowerCase().includes(searchLower)) ||
        (p.state && p.state.toLowerCase().includes(searchLower)) ||
        (p.description && p.description.toLowerCase().includes(searchLower))
      );
    }

    if (filters.minPrice) {
      const minPrice = parseFloat(filters.minPrice);
      filtered = filtered.filter(p => p.price && p.price >= minPrice);
    }

    if (filters.maxPrice) {
      const maxPrice = parseFloat(filters.maxPrice);
      filtered = filtered.filter(p => p.price && p.price <= maxPrice);
    }

    if (filters.bedrooms) {
      const bedrooms = parseInt(filters.bedrooms);
      filtered = filtered.filter(p => p.bedrooms && p.bedrooms >= bedrooms);
    }

    if (filters.bathrooms) {
      const bathrooms = parseFloat(filters.bathrooms);
      filtered = filtered.filter(p => p.bathrooms && p.bathrooms >= bathrooms);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        
        case 'price-low':
          const priceA = a.price || 0;
          const priceB = b.price || 0;
          return priceA - priceB;
        
        case 'price-high':
          const priceAHigh = a.price || 0;
          const priceBHigh = b.price || 0;
          return priceBHigh - priceAHigh;
        
        case 'distance':
          if (!userLocation) return 0;
          const distA = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            a.latitude,
            a.longitude
          );
          const distB = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            b.latitude,
            b.longitude
          );
          return distA - distB;
        
        default:
          return 0;
      }
    });

    setProperties(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allProperties, filters, sortBy, userLocation]);

  // Request user location for distance sorting
  useEffect(() => {
    if (sortBy === 'distance' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Could not get user location:', error);
          // If distance sorting is selected but location unavailable, fall back to newest
          if (sortBy === 'distance') {
            setSortBy('newest');
          }
        }
      );
    }
  }, [sortBy]);

  const loadProperties = async () => {
    setDashboardLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.search) queryParams.append('search', filters.search);

      const url = `/properties${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await apiClient.request(url);
      
      const propertiesData = Array.isArray(response) ? response : (response.data || response);
      setAllProperties(propertiesData);
      // applyFiltersAndSort will be called by useEffect
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

  const getStatusBadgeClass = (status) => {
    return `crm-item-badge badge-${status || 'draft'}`;
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

  // Properties with valid coordinates for map
  const mapProperties = properties.filter(p => p.latitude && p.longitude);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 600 }}>Properties</h1>
        <Link to="/dashboard/properties/new" className="crm-btn crm-btn-primary">
          + Add Property
        </Link>
      </div>

      {error && (
        <div className="crm-error">
          {error}
        </div>
      )}

      {/* Map Section */}
      {mapProperties.length > 0 && (
        <div className="crm-map-section" style={{ marginBottom: '32px', height: '500px' }}>
          <PropertyMap 
            properties={mapProperties} 
            onPropertyClick={(property) => {
              window.location.href = `/dashboard/properties/${property.id}`;
            }}
          />
        </div>
      )}

      {/* Filters and Sort */}
      <div className="crm-filters-section" style={{ marginBottom: '24px' }}>
        {/* Search and Basic Filters Row */}
        <div className="crm-filters" style={{ marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search properties..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="crm-input"
            style={{ flex: '1', minWidth: '200px' }}
          />
          <select
            value={filters.type}
            onChange={(e) => {
              const newType = e.target.value;
              setFilters({ ...filters, type: newType });
              // Update URL
              if (newType) {
                setSearchParams({ type: newType });
              } else {
                setSearchParams({});
              }
            }}
            className="crm-select"
          >
            <option value="">All Types</option>
            <option value="sale">For Sale</option>
            <option value="rent">For Rent</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="crm-select"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="sold">Sold</option>
            <option value="rented">Rented</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="crm-select"
          >
            <option value="newest">Sort: Newest</option>
            <option value="price-low">Sort: Price (Low → High)</option>
            <option value="price-high">Sort: Price (High → Low)</option>
            <option value="distance">Sort: Distance</option>
          </select>
        </div>

        {/* Advanced Filters Row */}
        <div className="crm-filters" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '14px', color: '#64748b', whiteSpace: 'nowrap' }}>Price Range:</label>
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              className="crm-input"
              style={{ width: '100px' }}
              min="0"
            />
            <span style={{ color: '#64748b' }}>to</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              className="crm-input"
              style={{ width: '100px' }}
              min="0"
            />
          </div>
          <select
            value={filters.bedrooms}
            onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
            className="crm-select"
          >
            <option value="">Bedrooms: Any</option>
            <option value="1">1+ Bedrooms</option>
            <option value="2">2+ Bedrooms</option>
            <option value="3">3+ Bedrooms</option>
            <option value="4">4+ Bedrooms</option>
            <option value="5">5+ Bedrooms</option>
          </select>
          <select
            value={filters.bathrooms}
            onChange={(e) => setFilters({ ...filters, bathrooms: e.target.value })}
            className="crm-select"
          >
            <option value="">Bathrooms: Any</option>
            <option value="1">1+ Bathrooms</option>
            <option value="1.5">1.5+ Bathrooms</option>
            <option value="2">2+ Bathrooms</option>
            <option value="2.5">2.5+ Bathrooms</option>
            <option value="3">3+ Bathrooms</option>
            <option value="4">4+ Bathrooms</option>
          </select>
          {(filters.minPrice || filters.maxPrice || filters.bedrooms || filters.bathrooms) && (
            <button
              onClick={() => setFilters({ ...filters, minPrice: '', maxPrice: '', bedrooms: '', bathrooms: '' })}
              className="crm-btn crm-btn-secondary"
              style={{ fontSize: '12px', padding: '8px 12px' }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Properties List */}
      {dashboardLoading ? (
        <div className="crm-loading">
          <div className="crm-skeleton"></div>
          <div className="crm-skeleton"></div>
          <div className="crm-skeleton"></div>
        </div>
      ) : properties.length === 0 ? (
        <div className="crm-empty-state">
          <div className="crm-empty-icon">🏠</div>
          <h3 className="crm-empty-title">No properties found</h3>
          <p className="crm-empty-text">
            {(filters.search || filters.type || filters.status || filters.minPrice || filters.maxPrice || filters.bedrooms || filters.bathrooms)
              ? 'Try adjusting your filters'
              : 'Create your first property to get started'}
          </p>
          {!(filters.search || filters.type || filters.status || filters.minPrice || filters.maxPrice || filters.bedrooms || filters.bathrooms) && (
                <Link to="/dashboard/properties/new" className="crm-btn crm-btn-primary" style={{ marginTop: '16px' }}>
              + Add Property
            </Link>
          )}
        </div>
      ) : (
        <div className="crm-list">
          {properties.map((property) => (
            <div key={property.id} className="crm-list-item">
              <div className="crm-item-header">
                <div>
                  <h3 className="crm-item-title">{property.title || 'Untitled Property'}</h3>
                  <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                    {property.address && `${property.address}, `}
                    {property.city && `${property.city}, `}
                    {property.state && property.state}
                    {property.zipCode && ` ${property.zipCode}`}
                  </div>
                </div>
                <span className={getStatusBadgeClass(property.status)}>
                  {(property.status || 'draft').charAt(0).toUpperCase() + (property.status || 'draft').slice(1)}
                </span>
              </div>
              
              <div className="crm-item-details" style={{ marginTop: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                  {property.price && (
                    <div><strong>Price:</strong> {formatPrice(property.price)}</div>
                  )}
                  {property.type && (
                    <div><strong>Type:</strong> {property.type === 'sale' ? 'For Sale' : 'For Rent'}</div>
                  )}
                  {property.bedrooms && (
                    <div><strong>Bedrooms:</strong> {property.bedrooms}</div>
                  )}
                  {property.bathrooms && (
                    <div><strong>Bathrooms:</strong> {property.bathrooms}</div>
                  )}
                  {property.squareFeet && (
                    <div><strong>Square Feet:</strong> {property.squareFeet.toLocaleString()}</div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="crm-property-actions" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                <Link to={`/dashboard/properties/${property.id}`} className="crm-btn crm-btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                  View / Edit
                </Link>
              </div>

              <div className="crm-item-meta">
                Created: {formatDate(property.createdAt)}
                {property.publishedAt && ` • Published: ${formatDate(property.publishedAt)}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
