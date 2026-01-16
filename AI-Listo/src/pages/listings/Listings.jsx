import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import PropertyMap from '../../components/PropertyMap';
import { buildWhatsAppLink } from '../../utils/whatsapp';
import ContactModal from '../../components/ContactModal';
import './Listings.css';

export default function Listings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get type from URL parameter
  const urlType = searchParams.get('type') || '';
  const urlSearch = searchParams.get('search') || '';
  
  // Filters
  const [filters, setFilters] = useState({
    type: urlType,
    search: urlSearch,
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
  });

  // Sorting
  const [sortBy, setSortBy] = useState('newest');
  const [userLocation, setUserLocation] = useState(null);

  // Contact Modal
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  // WhatsApp phone number from env
  const whatsappPhone = import.meta.env.VITE_WHATSAPP_PHONE || '+1234567890';

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

  // Update filters when URL changes
  useEffect(() => {
    const urlType = searchParams.get('type') || '';
    const urlSearch = searchParams.get('search') || '';
    setFilters(prev => ({ ...prev, type: urlType, search: urlSearch }));
  }, [searchParams]);

  useEffect(() => {
    loadProperties();
  }, [urlType, urlSearch]);

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
          if (sortBy === 'distance') {
            setSortBy('newest');
          }
        }
      );
    }
  }, [sortBy]);

  const loadProperties = async () => {
    setLoading(true);
    setError(null);

    try {
      // Public endpoint - get all published properties (no auth required)
      const queryParams = new URLSearchParams();
      if (urlType) queryParams.append('type', urlType);
      if (urlSearch) queryParams.append('search', urlSearch);
      
      const url = `/properties/public${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await apiClient.request(url);
      const propertiesData = Array.isArray(response) ? response : (response.data || []);
      setAllProperties(propertiesData);
    } catch (err) {
      console.error('Failed to load properties:', err);
      setError(err.message || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  // Apply client-side filtering and sorting
  useEffect(() => {
    if (allProperties.length === 0) {
      setProperties([]);
      return;
    }
    
    let filtered = [...allProperties];

    // Only show published properties
    filtered = filtered.filter(p => p.status === 'published');

    // Apply filters
    if (filters.type) {
      filtered = filtered.filter(p => p.type === filters.type);
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
  }, [allProperties, filters, sortBy, userLocation]);

  const handleContactAgent = (property) => {
    setSelectedProperty(property);
    setShowContactModal(true);
  };

  const handleContactSubmit = (lead) => {
    console.log('Lead created:', lead);
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

  // Properties with valid coordinates for map
  const mapProperties = properties.filter(p => p.latitude && p.longitude);

  return (
    <div className="listings-page">
      <header className="listings-header">
        <div className="listings-header-content">
          <h1 className="listings-title">Property Listings</h1>
        </div>
      </header>

      <main className="listings-main">
        <div className="listings-container">
          {error && (
            <div className="listings-error">
              {error}
            </div>
          )}

          {/* Search Bar */}
          <div className="listings-search-bar">
            <div className="listings-search-container">
              <input
                type="text"
                placeholder="Search properties by location, address, or keywords..."
                value={filters.search}
                onChange={(e) => {
                  const newSearch = e.target.value;
                  setFilters({ ...filters, search: newSearch });
                  if (newSearch) {
                    setSearchParams({ ...Object.fromEntries(searchParams), search: newSearch });
                  } else {
                    const params = new URLSearchParams(searchParams);
                    params.delete('search');
                    setSearchParams(params);
                  }
                }}
                className="listings-search-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
              />
            </div>
          </div>

          {/* Map Section */}
          {mapProperties.length > 0 && (
            <div className="listings-map-section">
              <PropertyMap 
                properties={mapProperties} 
                onPropertyClick={(property) => {
                  const url = urlType ? `/listings/${property.id}?type=${urlType}` : `/listings/${property.id}`;
                  window.location.href = url;
                }}
              />
            </div>
          )}

          {/* Filters and Sort */}
          <div className="listings-filters-section">
            <div className="listings-filters">
              <select
                value={filters.type}
                onChange={(e) => {
                  const newType = e.target.value;
                  setFilters({ ...filters, type: newType });
                  if (newType) {
                    setSearchParams({ type: newType });
                  } else {
                    setSearchParams({});
                  }
                }}
                className="listings-select"
              >
                <option value="">All Types</option>
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="listings-select"
              >
                <option value="newest">Sort: Newest</option>
                <option value="price-low">Sort: Price (Low → High)</option>
                <option value="price-high">Sort: Price (High → Low)</option>
                <option value="distance">Sort: Distance</option>
              </select>
            </div>

            {/* Advanced Filters */}
            <div className="listings-filters">
              <div className="listings-price-range">
                <label>Price Range:</label>
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  className="listings-input"
                />
                <span>to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  className="listings-input"
                />
              </div>
              <select
                value={filters.bedrooms}
                onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
                className="listings-select"
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
                className="listings-select"
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
                  className="listings-btn listings-btn-secondary"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Properties List */}
          {loading ? (
            <div className="listings-loading">
              <div className="listings-skeleton"></div>
              <div className="listings-skeleton"></div>
              <div className="listings-skeleton"></div>
            </div>
          ) : properties.length === 0 ? (
            <div className="listings-empty-state">
              <div className="listings-empty-icon">🏠</div>
              <h3 className="listings-empty-title">No properties found</h3>
              <p className="listings-empty-text">
                {filters.search || filters.type || filters.minPrice || filters.maxPrice || filters.bedrooms || filters.bathrooms
                  ? 'Try adjusting your filters'
                  : 'No properties available at the moment'}
              </p>
            </div>
          ) : (
            <div className="listings-grid">
              {properties.map((property) => (
                <div key={property.id} className="listings-card">
                  <div className="listings-card-header">
                    <h3 className="listings-card-title">{property.title || 'Untitled Property'}</h3>
                    {property.price && (
                      <div className="listings-card-price">{formatPrice(property.price)}</div>
                    )}
                  </div>
                  
                  <div className="listings-card-location">
                    {property.address && `${property.address}, `}
                    {property.city && `${property.city}, `}
                    {property.state && property.state}
                    {property.zipCode && ` ${property.zipCode}`}
                  </div>

                  <div className="listings-card-details">
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

                  {/* Action Buttons */}
                  <div className="listings-card-actions">
                    <div className="listings-action-buttons">
                      <a
                        href={buildWhatsAppLink(whatsappPhone, property)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="listings-btn listings-btn-whatsapp"
                      >
                        💬 WhatsApp
                      </a>
                      <button
                        onClick={() => handleContactAgent(property)}
                        className="listings-btn listings-btn-contact"
                      >
                        Contact Agent
                      </button>
                    </div>
                    <Link 
                      to={urlType ? `/listings/${property.id}?type=${urlType}` : `/listings/${property.id}`} 
                      className="listings-btn listings-btn-secondary" 
                      style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}
                    >
                      View Details
                    </Link>
                  </div>

                  <div className="listings-card-meta">
                    Listed: {formatDate(property.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Contact Modal */}
      {showContactModal && selectedProperty && (
        <ContactModal
          property={selectedProperty}
          onClose={() => {
            setShowContactModal(false);
            setSelectedProperty(null);
          }}
          onSubmit={handleContactSubmit}
        />
      )}
    </div>
  );
}
