import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/apiClient';
import { getPropertyMedia } from '../../api/propertiesApi';
import PropertyMap from '../../components/PropertyMap';
import ContactModal from '../../components/ContactModal';
import PropertyWhatsAppModal from '../../components/PropertyWhatsAppModal';
import '../listings/Listings.css';

export default function VacationRentalsSearchDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [property, setProperty] = useState(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  const backToSearch = useMemo(() => {
    const q = searchParams.toString();
    return q ? `/vacation-rentals/search?${q}` : '/vacation-rentals/search';
  }, [searchParams]);

  useEffect(() => {
    loadProperty();
  }, [id]);

  const loadProperty = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, mediaList] = await Promise.all([
        apiClient.request(`/properties/${id}`),
        getPropertyMedia(id).catch(() => []),
      ]);
      if (data.status !== 'published') {
        setError('Property not available');
        return;
      }
      setProperty(data);
      setMedia(Array.isArray(mediaList) ? mediaList.filter((m) => m.type === 'image') : []);
      setSlideIndex(0);
    } catch (err) {
      setError('Failed to load property: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContactSubmit = (lead) => {
    console.log('Lead created:', lead);
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="listings-page">
        <header className="listings-header">
          <div className="listings-header-content">
            <h1 className="listings-title">Vacation rental</h1>
          </div>
        </header>
        <main className="listings-main">
          <div className="listings-container">
            <div className="listings-loading">
              <div className="listings-skeleton"></div>
              <div className="listings-skeleton"></div>
              <div className="listings-skeleton"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="listings-page">
        <header className="listings-header">
          <div className="listings-header-content">
            <h1 className="listings-title">Vacation rental</h1>
          </div>
        </header>
        <main className="listings-main">
          <div className="listings-container">
            <div className="listings-error">
              {error || 'Property not found'}
            </div>
            <Link to={backToSearch} className="listings-btn listings-btn-secondary" style={{ marginTop: '16px' }}>
              Back to search
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const nightlyPrice = property.pricePerNight ?? property.price;

  return (
    <div className="listings-page">
      <header className="listings-header">
        <div className="listings-header-content">
          <h1 className="listings-title">{property.title || 'Vacation rental'}</h1>
        </div>
      </header>

      <main className="listings-main">
        <div className="listings-container">
          <div className="listings-detail-card">
            {(() => {
              const slides = media.length > 0
                ? media
                : (property.thumbnailUrl ? [{ url: property.thumbnailUrl }] : []);
              if (slides.length === 0) return null;
              const current = slides[slideIndex];
              return (
                <div className="listings-detail-slider">
                  <div className="listings-detail-slider-track">
                    <a href={current?.url} target="_blank" rel="noopener noreferrer" className="listings-detail-slider-image-wrap">
                      <img src={current?.url} alt="" className="listings-detail-slider-image" loading="lazy" />
                    </a>
                  </div>
                  {slides.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="listings-detail-slider-btn listings-detail-slider-btn-prev"
                        onClick={() => setSlideIndex((i) => (i <= 0 ? slides.length - 1 : i - 1))}
                        aria-label="Previous"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="listings-detail-slider-btn listings-detail-slider-btn-next"
                        onClick={() => setSlideIndex((i) => (i >= slides.length - 1 ? 0 : i + 1))}
                        aria-label="Next"
                      >
                        ›
                      </button>
                      <div className="listings-detail-slider-dots">
                        {slides.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            className={`listings-detail-slider-dot ${i === slideIndex ? 'active' : ''}`}
                            onClick={() => setSlideIndex(i)}
                            aria-label={`Go to slide ${i + 1}`}
                          />
                        ))}
                      </div>
                      <div className="listings-detail-slider-counter">
                        {slideIndex + 1} / {slides.length}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            <div className="listings-detail-header">
              <h2 className="listings-detail-title">{property.title}</h2>
              {nightlyPrice != null && (
                <div className="listings-detail-price">
                  {formatPrice(nightlyPrice)}
                  <span className="listings-detail-price-suffix"> / night</span>
                </div>
              )}
            </div>

            <div className="listings-detail-location">
              {property.address && `${property.address}, `}
              {property.city && `${property.city}, `}
              {property.state && property.state}
              {property.zipCode && ` ${property.zipCode}`}
            </div>

            <div className="listings-detail-actions">
              <div className="listings-action-buttons">
                <button
                  type="button"
                  onClick={() => setShowWhatsAppModal(true)}
                  className="listings-btn listings-btn-whatsapp"
                >
                  💬 WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setShowContactModal(true)}
                  className="listings-btn listings-btn-contact"
                >
                  Contact Agent
                </button>
              </div>
            </div>

            <div className="listings-detail-section">
              <h3 className="listings-detail-section-title">Property Information</h3>
              <div className="listings-detail-grid">
                <div><strong>Type:</strong> Vacation rental</div>
                {property.propertyType && (
                  <div><strong>{t('properties.propertyType')}:</strong> {t(`properties.propertyType_${property.propertyType}`)}</div>
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
                {property.lotSize && (
                  <div><strong>Lot Size:</strong> {property.lotSize.toLocaleString()} sq ft</div>
                )}
                {property.yearBuilt && (
                  <div><strong>Year Built:</strong> {property.yearBuilt}</div>
                )}
              </div>
            </div>

            {property.description && (
              <div className="listings-detail-section">
                <h3 className="listings-detail-section-title">Description</h3>
                <p className="listings-detail-description">{property.description}</p>
              </div>
            )}

            {property.latitude && property.longitude && (
              <div className="listings-detail-section">
                <h3 className="listings-detail-section-title">Location</h3>
                <div style={{ height: '400px', borderRadius: '8px', overflow: 'hidden', marginTop: '16px' }}>
                  <PropertyMap
                    mapRegion="ecuador"
                    properties={[property]}
                    selectedProperty={property}
                  />
                </div>
              </div>
            )}

            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              <Link
                to={backToSearch}
                className="listings-btn listings-btn-secondary"
              >
                ← Back to vacation search
              </Link>
            </div>
          </div>
        </div>
      </main>

      {showContactModal && property && (
        <ContactModal
          property={property}
          onClose={() => setShowContactModal(false)}
          onSubmit={handleContactSubmit}
        />
      )}

      {showWhatsAppModal && property && (
        <PropertyWhatsAppModal
          property={property}
          source="vacation_search_whatsapp_detail"
          onClose={() => setShowWhatsAppModal(false)}
        />
      )}
    </div>
  );
}
