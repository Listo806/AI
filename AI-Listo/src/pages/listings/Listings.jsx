import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/apiClient';
import PropertyMap from '../../components/PropertyMap';
import ContactModal from '../../components/ContactModal';
import PropertyWhatsAppModal from '../../components/PropertyWhatsAppModal';
import './Listings.css';

const PROPERTY_TYPE_OPTIONS = ['house', 'apartment', 'land', 'commercial', 'villa', 'office'];

function marketExploreSubtitle(property, t) {
  const desc = (property.description || '').replace(/\s+/g, ' ').trim();
  if (desc.length > 32) return desc.length > 88 ? `${desc.slice(0, 88)}…` : desc;
  const parts = [];
  if (property.city) parts.push(property.city);
  if (property.state) parts.push(property.state);
  if (property.propertyType) parts.push(t(`properties.propertyType_${property.propertyType}`));
  if (property.bedrooms != null && property.bedrooms !== '') parts.push(`${property.bedrooms} bd`);
  if (property.bathrooms != null && property.bathrooms !== '') parts.push(`${property.bathrooms} ba`);
  return parts.join(' · ') || property.address || '';
}

export default function Listings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get type, propertyType, search, city, page from URL parameters
  const urlType = searchParams.get('type') || '';
  const urlPropertyType = searchParams.get('propertyType') || '';
  const urlSearch = searchParams.get('search') || '';
  const urlCity = searchParams.get('city') || '';
  const urlPage = parseInt(searchParams.get('page') || '1', 10) || 1;

  const PAGE_SIZE = 20;

  // Pagination
  const [pagination, setPagination] = useState({ total: 0, limit: PAGE_SIZE, offset: 0 });
  
  // Filters
  const [filters, setFilters] = useState({
    type: urlType,
    propertyType: urlPropertyType,
    city: urlCity,
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

  // Property WhatsApp Modal (POST /leads/whatsapp then open WhatsApp)
  const [whatsappProperty, setWhatsappProperty] = useState(null);

  const [mobilePanel, setMobilePanel] = useState('list');

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
    const urlPropertyType = searchParams.get('propertyType') || '';
    const urlSearch = searchParams.get('search') || '';
    const urlCity = searchParams.get('city') || '';
    setFilters(prev => ({ ...prev, type: urlType, propertyType: urlPropertyType, city: urlCity, search: urlSearch }));
  }, [searchParams]);

  useEffect(() => {
    loadProperties();
  }, [urlType, urlPropertyType, urlCity, urlSearch, urlPage]);

  // Sync URL when page exceeds total (e.g. bookmark ?page=99 with only 3 pages)
  useEffect(() => {
    if (pagination.total > 0 && urlPage > Math.ceil(pagination.total / PAGE_SIZE)) {
      const params = new URLSearchParams(searchParams);
      params.delete('page');
      setSearchParams(params);
    }
  }, [pagination.total, urlPage, searchParams]);

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

  const totalPages = Math.max(1, Math.ceil(pagination.total / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, urlPage), totalPages);
  const effectivePage = pagination.total > 0 ? currentPage : Math.max(1, urlPage);

  const loadProperties = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (urlType) queryParams.append('mode', urlType);
      if (urlPropertyType) queryParams.append('propertyType', urlPropertyType);
      if (urlCity) queryParams.append('city', urlCity);
      if (urlSearch) queryParams.append('search', urlSearch);
      queryParams.append('limit', String(PAGE_SIZE));
      queryParams.append('offset', String((effectivePage - 1) * PAGE_SIZE));

      const url = `/listings?${queryParams.toString()}`;
      const response = await apiClient.request(url);
      const propertiesData = Array.isArray(response) ? response : (response.items ?? response.data ?? []);
      setAllProperties(propertiesData);

      if (response && typeof response === 'object' && !Array.isArray(response)) {
        setPagination({
          total: response.total ?? propertiesData.length,
          limit: response.limit ?? PAGE_SIZE,
          offset: response.offset ?? 0,
        });
      }
    } catch (err) {
      console.error('Failed to load properties:', err);
      setError(err.message || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (page) => {
    const p = Math.max(1, Math.min(page, totalPages));
    const params = new URLSearchParams(searchParams);
    if (p === 1) params.delete('page');
    else params.set('page', String(p));
    setSearchParams(params);
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

    if (filters.propertyType) {
      filtered = filtered.filter(p => p.propertyType === filters.propertyType);
    }

    if (filters.city) {
      filtered = filtered.filter(p => p.city && p.city.toLowerCase() === filters.city.toLowerCase());
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
          <div className="listings-header-actions">
            <Link to="/vacation-rentals/search" className="listings-btn listings-btn-secondary">
              Vacation rentals
            </Link>
            <Link to="/sign-in" className="listings-btn listings-btn-secondary">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="listings-main">
        <div className="listings-container listings-container--wide">
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
                  const params = new URLSearchParams(searchParams);
                  params.delete('page'); // reset to page 1 when search changes
                  if (newSearch) params.set('search', newSearch);
                  else params.delete('search');
                  setSearchParams(params);
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

          {/* Filters and Sort */}
          <div className="listings-filters-section">
            <div className="listings-filters">
              <select
                value={filters.type}
                onChange={(e) => {
                  const newType = e.target.value;
                  setFilters({ ...filters, type: newType });
                  const params = new URLSearchParams(searchParams);
                  if (newType) params.set('type', newType); else params.delete('type');
                  params.delete('page');
                  setSearchParams(params);
                }}
                className="listings-select"
              >
                <option value="">All (Sale/Rent)</option>
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
              <select
                value={filters.propertyType}
                onChange={(e) => {
                  const newVal = e.target.value;
                  setFilters({ ...filters, propertyType: newVal });
                  const params = new URLSearchParams(searchParams);
                  if (newVal) params.set('propertyType', newVal); else params.delete('propertyType');
                  params.delete('page');
                  setSearchParams(params);
                }}
                className="listings-select"
              >
                <option value="">Property type: Any</option>
                {PROPERTY_TYPE_OPTIONS.map((value) => (
                  <option key={value} value={value}>{t(`properties.propertyType_${value}`)}</option>
                ))}
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
              <div className="listings-filter-city">
                <label htmlFor="listings-city">{t('properties.city')}</label>
                <input
                  id="listings-city"
                  type="text"
                  placeholder={t('properties.cityPlaceholder') || 'e.g. Quito'}
                  value={filters.city}
                  onChange={(e) => {
                    const newCity = e.target.value.trim();
                    setFilters({ ...filters, city: newCity });
                    const params = new URLSearchParams(searchParams);
                    if (newCity) params.set('city', newCity); else params.delete('city');
                    params.delete('page');
                    setSearchParams(params);
                  }}
                  className="listings-input"
                />
              </div>
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
              {(filters.minPrice || filters.maxPrice || filters.bedrooms || filters.bathrooms || filters.propertyType || filters.city) && (
                <button
                  onClick={() => setFilters({ ...filters, minPrice: '', maxPrice: '', bedrooms: '', bathrooms: '', propertyType: '', city: '' })}
                  className="listings-btn listings-btn-secondary"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Properties + map split */}
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
                {filters.search || filters.type || filters.propertyType || filters.city || filters.minPrice || filters.maxPrice || filters.bedrooms || filters.bathrooms
                  ? 'Try adjusting your filters'
                  : 'No properties available at the moment'}
              </p>
            </div>
          ) : (
            <>
              {mapProperties.length > 0 && (
                <div className="listings-mobile-toggle" role="tablist" aria-label="List or map view">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mobilePanel === 'list'}
                    className={mobilePanel === 'list' ? 'listings-mobile-toggle-active' : ''}
                    onClick={() => setMobilePanel('list')}
                  >
                    List view
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mobilePanel === 'map'}
                    className={mobilePanel === 'map' ? 'listings-mobile-toggle-active' : ''}
                    onClick={() => setMobilePanel('map')}
                  >
                    Map view
                  </button>
                </div>
              )}
              <div
                className={`listings-split ${mapProperties.length === 0 ? 'listings-split--no-map' : ''}`}
              >
                <div
                  className={`listings-results-panel ${mapProperties.length > 0 && mobilePanel === 'map' ? 'listings-results-panel--hidden-mobile' : ''}`}
                >
                  <div className="listings-grid listings-grid--split">
                    {properties.map((property) => {
                      const detailPath = urlType ? `/listings/${property.id}?type=${urlType}` : `/listings/${property.id}`;
                      const typeLabel = property.type === 'sale' ? 'For sale' : property.type === 'rent' ? 'For rent' : '';
                      return (
                        <article key={property.id} className="listings-card listings-card--explore">
                          <div className="listings-card-media">
                            <Link to={detailPath} className="listings-card-image-wrap">
                              {property.thumbnailUrl ? (
                                <img
                                  src={property.thumbnailUrl}
                                  alt=""
                                  className="listings-card-image"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="listings-card-image listings-card-image--placeholder" aria-hidden />
                              )}
                            </Link>
                          </div>
                          <div className="listings-card-body">
                            <div className="listings-card-topline">
                              <h3 className="listings-card-title">
                                <Link to={detailPath}>{property.title || 'Untitled Property'}</Link>
                              </h3>
                            </div>
                            <p className="listings-card-subtitle">{marketExploreSubtitle(property, t)}</p>
                            {typeLabel && (
                              <p className="listings-card-meta-line">{typeLabel}</p>
                            )}
                            <div className="listings-card-price-row">
                              {property.price != null ? (
                                <>
                                  <span className="listings-card-price">{formatPrice(property.price)}</span>
                                  {property.type === 'rent' && (
                                    <span className="listings-card-price-note"> / month</span>
                                  )}
                                </>
                              ) : (
                                <span className="listings-card-price listings-card-price--muted">Price on request</span>
                              )}
                            </div>
                            <div className="listings-card-actions listings-card-actions--compact">
                              <div className="listings-action-buttons">
                                <button
                                  type="button"
                                  onClick={() => setWhatsappProperty(property)}
                                  className="listings-btn listings-btn-whatsapp listings-btn--sm"
                                >
                                  WhatsApp
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleContactAgent(property)}
                                  className="listings-btn listings-btn-contact listings-btn--sm"
                                >
                                  Contact
                                </button>
                              </div>
                              <Link to={detailPath} className="listings-card-detail-link">
                                View details
                              </Link>
                            </div>
                            <p className="listings-card-footnote">Listed {formatDate(property.createdAt)}</p>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {!loading && properties.length > 0 && pagination.total > PAGE_SIZE && (
                    <div className="listings-pagination listings-pagination--in-panel">
                      <button
                        type="button"
                        className="listings-pagination-btn"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                        aria-label="Previous page"
                      >
                        ‹ Previous
                      </button>
                      <span className="listings-pagination-info">
                        Page {currentPage} of {totalPages} ({pagination.total} properties)
                      </span>
                      <button
                        type="button"
                        className="listings-pagination-btn"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        aria-label="Next page"
                      >
                        Next ›
                      </button>
                    </div>
                  )}
                </div>

                {mapProperties.length > 0 && (
                  <div
                    className={`listings-map-panel ${mobilePanel === 'list' ? '' : 'listings-map-panel--visible-mobile'}`}
                  >
                    <PropertyMap
                      properties={mapProperties}
                      markerStyle="pricePill"
                      onPropertyClick={(property) => {
                        const path = urlType ? `/listings/${property.id}?type=${urlType}` : `/listings/${property.id}`;
                        navigate(path);
                      }}
                    />
                  </div>
                )}
              </div>
            </>
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

      {/* Property WhatsApp Modal: creates lead via POST /leads/whatsapp then opens WhatsApp */}
      {whatsappProperty && (
        <PropertyWhatsAppModal
          property={whatsappProperty}
          source="property_whatsapp_search"
          onClose={() => setWhatsappProperty(null)}
        />
      )}
    </div>
  );
}
