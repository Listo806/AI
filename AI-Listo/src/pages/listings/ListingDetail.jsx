import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import PropertyMap from '../../components/PropertyMap';
import { buildWhatsAppLink } from '../../utils/whatsapp';
import ContactModal from '../../components/ContactModal';
import './Listings.css';

export default function ListingDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type') || '';
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);

  // WhatsApp phone number from env
  const whatsappPhone = import.meta.env.VITE_WHATSAPP_PHONE || '+1234567890';

  useEffect(() => {
    loadProperty();
  }, [id]);

  const loadProperty = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use public endpoint - no auth required
      const data = await apiClient.request(`/properties/${id}`);
      // Only show published properties to public
      if (data.status !== 'published') {
        setError('Property not available');
        return;
      }
      setProperty(data);
    } catch (err) {
      setError('Failed to load property: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContactSubmit = (lead) => {
    console.log('Lead created:', lead);
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

  if (loading) {
    return (
      <div className="listings-page">
        <header className="listings-header">
          <div className="listings-header-content">
            <h1 className="listings-title">Property Details</h1>
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
            <h1 className="listings-title">Property Details</h1>
          </div>
        </header>
        <main className="listings-main">
          <div className="listings-container">
            <div className="listings-error">
              {error || 'Property not found'}
            </div>
            <Link to="/listings" className="listings-btn listings-btn-secondary" style={{ marginTop: '16px' }}>
              Back to Listings
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="listings-page">
      <header className="listings-header">
        <div className="listings-header-content">
          <h1 className="listings-title">{property.title || 'Property Details'}</h1>
        </div>
      </header>

      <main className="listings-main">
        <div className="listings-container">
          <div className="listings-detail-card">
            <div className="listings-detail-header">
              <h2 className="listings-detail-title">{property.title}</h2>
              {property.price && (
                <div className="listings-detail-price">{formatPrice(property.price)}</div>
              )}
            </div>

            <div className="listings-detail-location">
              {property.address && `${property.address}, `}
              {property.city && `${property.city}, `}
              {property.state && property.state}
              {property.zipCode && ` ${property.zipCode}`}
            </div>

            {/* Action Buttons */}
            <div className="listings-detail-actions">
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
                  onClick={() => setShowContactModal(true)}
                  className="listings-btn listings-btn-contact"
                >
                  Contact Agent
                </button>
              </div>
            </div>

            {/* Property Details */}
            <div className="listings-detail-section">
              <h3 className="listings-detail-section-title">Property Information</h3>
              <div className="listings-detail-grid">
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

            {/* Map Section */}
            {property.latitude && property.longitude && (
              <div className="listings-detail-section">
                <h3 className="listings-detail-section-title">Location</h3>
                <div style={{ height: '400px', borderRadius: '8px', overflow: 'hidden', marginTop: '16px' }}>
                  <PropertyMap 
                    properties={[property]} 
                    selectedProperty={property}
                  />
                </div>
              </div>
            )}

            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              <Link 
                to={typeParam ? `/listings?type=${typeParam}` : '/listings'} 
                className="listings-btn listings-btn-secondary"
              >
                ← Back to Listings
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Contact Modal */}
      {showContactModal && property && (
        <ContactModal
          property={property}
          onClose={() => setShowContactModal(false)}
          onSubmit={handleContactSubmit}
        />
      )}
    </div>
  );
}
