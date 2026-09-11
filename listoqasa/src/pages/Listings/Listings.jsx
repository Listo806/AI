import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import apiClient from '../../api/apiClient';
import PropertyMap from '../../components/PropertyMap';
import ContactModal from '../../components/ContactModal';
import PropertyWhatsAppModal from '../../components/PropertyWhatsAppModal';
import SiteLayout from '../../components/layout/SiteLayout';
import './Listings.css';

const PROPERTY_TYPE_OPTIONS = ['house', 'apartment', 'land', 'commercial', 'villa', 'office'];

function marketExploreSubtitle(property, t) {
  const desc = (property.description || '').replace(/\s+/g, ' ').trim();
  if (desc.length > 32) return desc.length > 88 ? `${desc.slice(0, 88)}…` : desc;
  const parts = [];
  if (property.city) parts.push(property.city);
  if (property.state) parts.push(property.state);
  if (property.propertyType) parts.push(t(`properties.propertyType_${property.propertyType}`));
  if (property.bedrooms != null && property.bedrooms !== '') parts.push(t('listings.bedShort', { n: property.bedrooms }));
  if (property.bathrooms != null && property.bathrooms !== '') parts.push(t('listings.bathShort', { n: property.bathrooms }));
  return parts.join(' · ') || property.address || '';
}

export default function Listings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /** BUY (/buy) → sale; RENT (/rent) → rent; /listings → browse both unless ?type= */
  const pathDefaultType =
    location.pathname === '/buy' ? 'sale' : location.pathname === '/rent' ? 'rent' : '';
  const urlTypeFromQuery = searchParams.get('type') || '';
  const effectiveMode = urlTypeFromQuery || pathDefaultType;
  const urlPropertyType = searchParams.get('propertyType') || '';
  const urlSearch = searchParams.get('search') || '';
  const urlCity = searchParams.get('city') || '';
  const urlPage = parseInt(searchParams.get('page') || '1', 10) || 1;

  const PAGE_SIZE = 20;

  // Pagination
  const [pagination, setPagination] = useState({ total: 0, limit: PAGE_SIZE, offset: 0 });
  
  // Filters
  const [filters, setFilters] = useState({
    type: effectiveMode,
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
  const [showMoreFilters, setShowMoreFilters] = useState(false);

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
    const qpType = searchParams.get('type') || '';
    const pathDef =
      location.pathname === '/buy' ? 'sale' : location.pathname === '/rent' ? 'rent' : '';
    const mode = qpType || pathDef;
    const urlPropertyType = searchParams.get('propertyType') || '';
    const urlSearch = searchParams.get('search') || '';
    const urlCity = searchParams.get('city') || '';
    setFilters((prev) => ({
      ...prev,
      type: mode,
      propertyType: urlPropertyType,
      city: urlCity,
      search: urlSearch,
    }));
  }, [searchParams, location.pathname]);

  useEffect(() => {
    loadProperties();
  }, [effectiveMode, urlPropertyType, urlCity, urlSearch, urlPage]);

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
      if (effectiveMode) queryParams.append('mode', effectiveMode);
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
      setError(err.message || t('listings.loadError'));
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
    if (!dateString) return t('listings.notAvailable');
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (price) => {
    if (!price) return t('listings.notAvailable');
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };


  const applySearchParams = () => {
    const params = new URLSearchParams(searchParams);

    if (filters.search?.trim()) params.set('search', filters.search.trim());
    else params.delete('search');

    if (filters.city?.trim()) params.set('city', filters.city.trim());
    else params.delete('city');

    if (filters.propertyType) params.set('propertyType', filters.propertyType);
    else params.delete('propertyType');

    params.delete('page');
    setSearchParams(params);
  };

  const clearOptionalFilters = () => {
    setFilters((prev) => ({
      ...prev,
      propertyType: '',
      city: '',
      search: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: '',
    }));

    const params = new URLSearchParams(searchParams);
    ['propertyType', 'city', 'search', 'page'].forEach((key) => params.delete(key));
    setSearchParams(params);
  };

  const activeFilterCount = [
    filters.propertyType,
    filters.city,
    filters.minPrice,
    filters.maxPrice,
    filters.bedrooms,
    filters.bathrooms,
  ].filter(Boolean).length;

  const resultLocation = filters.city || urlCity || '';

  // Properties with valid coordinates for map
  const mapProperties = properties.filter(p => p.latitude && p.longitude);

  return (
    <SiteLayout headerVariant="dark" showFooter={false}>
      <div className="listings-page">
        <main className="listings-main">
        <div className="listings-container listings-container--wide">
          {error && (
            <div className="listings-error">
              {error}
            </div>
          )}

          {/* Compact marketplace filter bar */}
          <section className="listings-marketplace-controls">
            <div className="listings-marketplace-toolbar">
              <div className="listings-marketplace-search">
                <Search size={19} strokeWidth={2} aria-hidden />
                <input
                  type="text"
                  placeholder={t('listings.searchPlaceholder')}
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      applySearchParams();
                    }
                  }}
                />
              </div>

              <div className="listings-mode-switch" aria-label={t('listings.allBuyRent')}>
                <button
                  type="button"
                  className={effectiveMode === 'sale' ? 'active' : ''}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.delete('type');
                    params.delete('page');
                    setFilters((prev) => ({ ...prev, type: 'sale' }));
                    navigate({
                      pathname: '/buy',
                      search: params.toString() ? `?${params.toString()}` : '',
                    });
                  }}
                >
                  {t('properties.buy')}
                </button>

                <button
                  type="button"
                  className={effectiveMode === 'rent' ? 'active' : ''}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.delete('type');
                    params.delete('page');
                    setFilters((prev) => ({ ...prev, type: 'rent' }));
                    navigate({
                      pathname: '/rent',
                      search: params.toString() ? `?${params.toString()}` : '',
                    });
                  }}
                >
                  {t('properties.rent')}
                </button>
              </div>

              <label className="listings-compact-select">
                <select
                  value={filters.propertyType}
                  onChange={(e) => {
                    const newVal = e.target.value;
                    setFilters((prev) => ({ ...prev, propertyType: newVal }));
                    const params = new URLSearchParams(searchParams);
                    if (newVal) params.set('propertyType', newVal);
                    else params.delete('propertyType');
                    params.delete('page');
                    setSearchParams(params);
                  }}
                >
                  <option value="">{t('listings.propertyTypeAny')}</option>
                  {PROPERTY_TYPE_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {t(`properties.propertyType_${value}`)}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} />
              </label>

              <div className="listings-compact-price">
                <span>{t('listings.priceRange')}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder={t('listings.minPlaceholder')}
                  value={filters.minPrice}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, minPrice: e.target.value }))
                  }
                />
                <span className="listings-price-dash">–</span>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder={t('listings.maxPlaceholder')}
                  value={filters.maxPrice}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))
                  }
                />
              </div>

              <div className="listings-beds-baths">
                <select
                  value={filters.bedrooms}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, bedrooms: e.target.value }))
                  }
                  aria-label={t('listings.bedroomsAny')}
                >
                  <option value="">{t('listings.bedroomsAny')}</option>
                  <option value="1">{t('listings.bedrooms1')}</option>
                  <option value="2">{t('listings.bedrooms2')}</option>
                  <option value="3">{t('listings.bedrooms3')}</option>
                  <option value="4">{t('listings.bedrooms4')}</option>
                  <option value="5">{t('listings.bedrooms5')}</option>
                </select>
                <span className="listings-beds-baths-divider" />
                <select
                  value={filters.bathrooms}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, bathrooms: e.target.value }))
                  }
                  aria-label={t('listings.bathroomsAny')}
                >
                  <option value="">{t('listings.bathroomsAny')}</option>
                  <option value="1">{t('listings.bathrooms1')}</option>
                  <option value="1.5">{t('listings.bathrooms1_5')}</option>
                  <option value="2">{t('listings.bathrooms2')}</option>
                  <option value="2.5">{t('listings.bathrooms2_5')}</option>
                  <option value="3">{t('listings.bathrooms3')}</option>
                  <option value="4">{t('listings.bathrooms4')}</option>
                </select>
                <ChevronDown size={16} />
              </div>

              <button
                type="button"
                className={`listings-more-filters ${showMoreFilters ? 'active' : ''}`}
                onClick={() => setShowMoreFilters((value) => !value)}
                aria-expanded={showMoreFilters}
              >
                <SlidersHorizontal size={18} />
                <span>
                  {t('listings.moreFilters', { defaultValue: 'More Filters' })}
                  {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </span>
                <ChevronDown size={16} />
              </button>

              <button
                type="button"
                className="listings-search-submit"
                onClick={applySearchParams}
              >
                <Search size={19} />
                <span>{t('listings.searchButton', { defaultValue: 'Search' })}</span>
              </button>
            </div>

            {showMoreFilters && (
              <div className="listings-more-panel">
                <label className="listings-more-field">
                  <span>{t('properties.city')}</span>
                  <input
                    type="text"
                    placeholder={t('properties.cityPlaceholder') || 'e.g. Quito'}
                    value={filters.city}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, city: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') applySearchParams();
                    }}
                  />
                </label>

                <div className="listings-more-summary">
                  <span>
                    {t('listings.moreFiltersHint', {
                      defaultValue:
                        'Use city, property type, price, beds and baths to narrow your results.',
                    })}
                  </span>

                  {activeFilterCount > 0 && (
                    <button type="button" onClick={clearOptionalFilters}>
                      {t('listings.clearFilters')}
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="listings-results-meta">
              <div className="listings-results-meta-left">
                <strong>
                  {pagination.total.toLocaleString()}&nbsp;
                  {t('listings.propertiesCountLabel', { defaultValue: 'properties' })}
                  {resultLocation
                    ? ` ${t('listings.inLocation', { defaultValue: 'in' })} ${resultLocation}`
                    : ''}
                </strong>

                {effectiveMode && (
                  <span className="listings-filter-chip">
                    {effectiveMode === 'sale' ? t('properties.buy') : t('properties.rent')}
                  </span>
                )}

                {(filters.minPrice || filters.maxPrice) && (
                  <span className="listings-filter-chip">
                    {filters.minPrice ? `$${Number(filters.minPrice).toLocaleString()}` : '$0'}
                    {' – '}
                    {filters.maxPrice
                      ? `$${Number(filters.maxPrice).toLocaleString()}`
                      : t('listings.noMaxPrice', { defaultValue: 'Any' })}
                    <button
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          minPrice: '',
                          maxPrice: '',
                        }))
                      }
                      aria-label={t('listings.removePriceFilter', {
                        defaultValue: 'Remove price filter',
                      })}
                    >
                      <X size={13} />
                    </button>
                  </span>
                )}

                {(filters.propertyType ||
                  filters.city ||
                  filters.minPrice ||
                  filters.maxPrice ||
                  filters.bedrooms ||
                  filters.bathrooms) && (
                  <button
                    type="button"
                    className="listings-clear-all"
                    onClick={clearOptionalFilters}
                  >
                    {t('listings.clearFilters')}
                  </button>
                )}
              </div>

              <label className="listings-sort-compact">
                <span>{t('listings.sortLabel', { defaultValue: 'Sort:' })}</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="newest">{t('listings.sortNewest')}</option>
                  <option value="price-low">{t('listings.sortPriceLow')}</option>
                  <option value="price-high">{t('listings.sortPriceHigh')}</option>
                  <option value="distance">{t('listings.sortDistance')}</option>
                </select>
                <ChevronDown size={15} />
              </label>
            </div>
          </section>

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
              <h3 className="listings-empty-title">{t('listings.noPropertiesFound')}</h3>
              <p className="listings-empty-text">
                {filters.search || filters.type || filters.propertyType || filters.city || filters.minPrice || filters.maxPrice || filters.bedrooms || filters.bathrooms
                  ? t('listings.tryAdjustingFilters')
                  : t('listings.noPropertiesAvailable')}
              </p>
            </div>
          ) : (
            <>
              {mapProperties.length > 0 && (
                <div className="listings-mobile-toggle" role="tablist" aria-label={t('listings.listOrMapView')}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mobilePanel === 'list'}
                    className={mobilePanel === 'list' ? 'listings-mobile-toggle-active' : ''}
                    onClick={() => setMobilePanel('list')}
                  >
                    {t('listings.listView')}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mobilePanel === 'map'}
                    className={mobilePanel === 'map' ? 'listings-mobile-toggle-active' : ''}
                    onClick={() => setMobilePanel('map')}
                  >
                    {t('listings.mapView')}
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
                      const detailPath = effectiveMode
                        ? `/property/${property.id}?type=${effectiveMode}`
                        : `/property/${property.id}`;
                      const typeLabel =
                        property.type === 'sale' ? t('properties.buy') : property.type === 'rent' ? t('properties.rent') : '';
                      return (
                        <article
                          key={property.id}
                          className="listings-card listings-card--explore listings-card--clickable"
                          role="link"
                          tabIndex={0}
                          onClick={() => navigate(detailPath)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              navigate(detailPath);
                            }
                          }}
                        >
                          <div className="listings-card-media">
                            <Link to={detailPath} className="listings-card-image-wrap" onClick={(event) => event.stopPropagation()}>
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
                                <Link to={detailPath} onClick={(event) => event.stopPropagation()}>{property.title || t('listings.untitledProperty')}</Link>
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
                                    <span className="listings-card-price-note">{t('listings.perMonth')}</span>
                                  )}
                                </>
                              ) : (
                                <span className="listings-card-price listings-card-price--muted">{t('listings.priceOnRequest')}</span>
                              )}
                            </div>
                            <div className="listings-card-actions listings-card-actions--compact">
                              <div className="listings-action-buttons">
                                <button
                                  type="button"
                                  onClick={(event) => { event.stopPropagation(); setWhatsappProperty(property); }}
                                  className="listings-btn listings-btn-whatsapp listings-btn--sm"
                                >
                                  WhatsApp
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => { event.stopPropagation(); handleContactAgent(property); }}
                                  className="listings-btn listings-btn-contact listings-btn--sm"
                                >
                                  {t('listings.contact')}
                                </button>
                              </div>
                              <Link to={detailPath} className="listings-card-detail-link" onClick={(event) => event.stopPropagation()}>
                                {t('listings.viewDetails')}
                              </Link>
                            </div>
                            <p className="listings-card-footnote">{t('listings.listedDate', { date: formatDate(property.createdAt) })}</p>
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
                        aria-label={t('listings.previousPageAria')}
                      >
                        {t('listings.prevPage')}
                      </button>
                      <span className="listings-pagination-info">
                        {t('listings.pageInfo', { current: currentPage, total: totalPages, results: pagination.total })}
                      </span>
                      <button
                        type="button"
                        className="listings-pagination-btn"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        aria-label={t('listings.nextPageAria')}
                      >
                        {t('listings.nextPage')}
                      </button>
                    </div>
                  )}
                </div>

                <div
                  className={`listings-map-panel ${mobilePanel === 'list' ? '' : 'listings-map-panel--visible-mobile'}`}
                >
                  <PropertyMap
                    mapRegion="ecuador"
                    properties={mapProperties}
                    markerStyle="pricePill"
                    onPropertyClick={(property) => {
                      const path = effectiveMode
                        ? `/property/${property.id}?type=${effectiveMode}`
                        : `/property/${property.id}`;
                      navigate(path);
                    }}
                  />
                </div>
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
    </SiteLayout>
  );
}
