import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Car,
  CheckCircle2,
  Heart,
  Home,
  Lock,
  MapPin,
  Maximize2,
  MessageCircle,
  Share2,
  ShieldCheck,
  Sparkles,
  Tag,
  UserRound,
} from 'lucide-react';
import apiClient from '../../api/apiClient';
import { getPropertyMedia } from '../../api/propertiesApi';
import PropertyMap from '../../components/PropertyMap';
import PropertyWhatsAppModal from '../../components/PropertyWhatsAppModal';
import SiteLayout from '../../components/layout/SiteLayout';
import './Listings.css';

const fallbackAmenities = [
  'Garden',
  'Terrace',
  'Equipped kitchen',
  'Built-in closets',
  'Security',
  'Pet friendly',
];

const money = (value) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value));
};

function imageUrl(item) {
  return item?.url || item?.fileUrl || item?.file_url || item?.src || '';
}

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type') || '';

  const [property, setProperty] = useState(null);
  const [media, setMedia] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [leadState, setLeadState] = useState('idle');
  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const [favoriteSimilarIds, setFavoriteSimilarIds] = useState(
    () => new Set()
  );

  const toggleSimilarFavorite = (propertyId) => {
    setFavoriteSimilarIds((current) => {
      const next = new Set(current);

      if (next.has(propertyId)) {
        next.delete(propertyId);
      } else {
        next.add(propertyId);
      }

      return next;
    });
  };
  useEffect(() => {
    document.body.classList.add('lq-marketplace-white-page');
    return () => document.body.classList.remove('lq-marketplace-white-page');
  }, []);

  useEffect(() => {
    loadProperty();
  }, [id]);

  const loadProperty = async () => {
    setLoading(true);
    setError('');

    try {
      const [data, mediaList] = await Promise.all([
        apiClient.request(`/properties/${id}`),
        getPropertyMedia(id).catch(() => []),
      ]);

      if (data?.status !== 'published') {
        setError('Property not available');
        return;
      }

      const listingType = (data.listingType || data.listing_type || '').toLowerCase();
      if (listingType === 'vacation') {
        navigate(`/vacation-rentals/search/${id}`, { replace: true });
        return;
      }

      setProperty(data);
      setLeadForm((current) => ({
        ...current,
        message:
          current.message ||
          `Hi, I'm interested in ${data.title || 'this property'}. Could you provide more information?`,
      }));

      const normalizedMedia = Array.isArray(mediaList)
        ? mediaList.filter((item) => (item.type || 'image') === 'image' && imageUrl(item))
        : [];

      setMedia(normalizedMedia);

      const mode = data.type || typeParam || 'sale';
      try {
        const response = await apiClient.request(`/listings?mode=${mode}&limit=8&offset=0`);
        const rows = Array.isArray(response)
          ? response
          : response?.items || response?.data || [];

        setSimilar(rows.filter((item) => item.id !== data.id).slice(0, 4));
      } catch {
        setSimilar([]);
      }
    } catch (err) {
      setError(err?.message ? `Failed to load property: ${err.message}` : 'Failed to load property');
    } finally {
      setLoading(false);
    }
  };

  const gallery = useMemo(() => {
    const urls = media.map(imageUrl).filter(Boolean);
    if (property?.thumbnailUrl && !urls.includes(property.thumbnailUrl)) {
      urls.unshift(property.thumbnailUrl);
    }
    return urls;
  }, [media, property]);

  const amenities = useMemo(() => {
    const raw = property?.amenities;
    if (Array.isArray(raw) && raw.length) return raw.slice(0, 8);

    if (typeof raw === 'string' && raw.trim()) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed.slice(0, 8);
      } catch {
        return raw.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 8);
      }
    }

    return fallbackAmenities;
  }, [property]);

  const submitContact = async (event) => {
    event.preventDefault();
    if (!leadForm.name.trim() || !leadForm.email.trim()) return;

    setLeadState('sending');

    try {
      await apiClient.request('/leads/public', {
        method: 'POST',
        body: JSON.stringify({
          name: leadForm.name.trim(),
          email: leadForm.email.trim(),
          phone: leadForm.phone.trim() || undefined,
          message: leadForm.message.trim() || undefined,
          propertyId: property.id,
          source: 'property_detail_contact',
        }),
      });

      setLeadState('success');
    } catch {
      setLeadState('error');
    }
  };

  if (loading) {
    return (
      <SiteLayout headerVariant="dark">
        <main className="lq-detail-page">
          <div className="lq-detail-shell">
            <div className="listings-skeleton" />
            <div className="listings-skeleton" />
          </div>
        </main>
      </SiteLayout>
    );
  }

  if (error || !property) {
    return (
      <SiteLayout headerVariant="dark">
        <main className="lq-detail-page">
          <div className="lq-detail-shell">
            <div className="listings-error">{error || 'Property not found'}</div>
            <Link to={typeParam === 'rent' ? '/rent' : '/buy'} className="lq-detail-back">
              <ArrowLeft size={16} />
              Back to search
            </Link>
          </div>
        </main>
      </SiteLayout>
    );
  }

  const addressLine = [
    property.address || property.neighborhood,
    property.city,
    property.state,
  ]
    .filter(Boolean)
    .join(', ');

  const squareArea =
    property.squareFeet ||
    property.square_feet ||
    property.lotSize ||
    property.lot_size;

  const parking =
    property.parkingSpaces ||
    property.parking_spaces ||
    property.parking ||
    0;

  const agentName =
    property.agentName ||
    property.agent_name ||
    property.ownerName ||
    property.owner_name ||
    'ListoQasa Real Estate';

  const pricePerArea =
    property.price && squareArea
      ? Math.round(Number(property.price) / Number(squareArea))
      : null;

  return (
    <SiteLayout headerVariant="dark">
      <main className="lq-detail-page">
        <div className="lq-detail-shell">
          <div className="lq-detail-topbar">
            <Link
              to={typeParam === 'rent' ? '/rent' : '/buy'}
              className="lq-detail-back"
            >
              <ArrowLeft size={16} />
              Back to search
            </Link>

            <div className="lq-detail-top-actions">
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(window.location.href)}
              >
                <Share2 size={17} />
                Share
              </button>

              <button
                type="button"
                className={saved ? 'active' : ''}
                onClick={() => setSaved((value) => !value)}
              >
                <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
                Save
              </button>
            </div>
          </div>

          <h1 className="lq-detail-title">{property.title || 'Property Details'}</h1>

          <div className="lq-detail-location-line">
            <MapPin size={17} />
            <span>{addressLine || 'Ecuador'}</span>
          </div>

          <section className="lq-detail-gallery">
            <div className="lq-detail-gallery-main">
              {gallery[0] ? (
                <img src={gallery[0]} alt={property.title || ''} />
              ) : (
                <div className="lq-detail-image-placeholder" />
              )}
            </div>

            <div className="lq-detail-gallery-grid">
              {[1, 2, 3, 4].map((index) => (
                <div className="lq-detail-gallery-thumb" key={index}>
                  {gallery[index] ? (
                    <img src={gallery[index]} alt="" />
                  ) : gallery[0] ? (
                    <img src={gallery[0]} alt="" />
                  ) : (
                    <div className="lq-detail-image-placeholder" />
                  )}

                  {index === 4 && gallery.length > 0 && (
                    <button type="button" className="lq-detail-view-photos">
                      View all {gallery.length} photos
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <div className="lq-detail-content-grid">
            <div className="lq-detail-main-column">
              <div className="lq-detail-price">{money(property.price)}</div>

              <div className="lq-detail-primary-specs">
                {property.bedrooms != null && (
                  <span><BedDouble size={21} /> {property.bedrooms} bedrooms</span>
                )}

                {property.bathrooms != null && (
                  <span><Bath size={21} /> {property.bathrooms} bathrooms</span>
                )}

                {squareArea && (
                  <span><Maximize2 size={21} /> {Number(squareArea).toLocaleString()} m²</span>
                )}

                {parking ? (
                  <span><Car size={21} /> {parking} parking</span>
                ) : null}
              </div>

              <div className="lq-detail-chips">
                <span>{property.propertyType || 'Property'}</span>
                <span className="blue">{property.type === 'rent' ? 'For Rent' : 'For Sale'}</span>
                {(property.isFeatured || property.featured) && (
                  <span className="purple">Featured</span>
                )}
              </div>

              <section className="lq-detail-section">
                <h2>About this property</h2>
                <div
                  className={`lq-detail-description ${expanded ? 'expanded' : ''}`}
                >
                  {property.description || (
                    <>
                      Beautiful property in {property.city || 'Ecuador'} with a comfortable,
                      modern layout and convenient access to nearby amenities.
                    </>
                  )}
                </div>

                {property.description && property.description.length > 260 && (
                  <button
                    type="button"
                    className="lq-detail-read-more"
                    onClick={() => setExpanded((value) => !value)}
                  >
                    {expanded ? 'Show less' : 'Read full description'}
                  </button>
                )}
              </section>

              <section className="lq-detail-facts-grid">
                <div><Home size={21} /><span><small>Property type</small><strong>{property.propertyType || '—'}</strong></span></div>
                <div><Sparkles size={21} /><span><small>Year built</small><strong>{property.yearBuilt || property.year_built || '—'}</strong></span></div>
                <div><Maximize2 size={21} /><span><small>Lot size</small><strong>{squareArea ? `${Number(squareArea).toLocaleString()} m²` : '—'}</strong></span></div>
                <div><ShieldCheck size={21} /><span><small>HOA</small><strong>{property.hoa || property.hoaFee || '—'}</strong></span></div>
                <div><Tag size={21} /><span><small>Price per m²</small><strong>{pricePerArea ? money(pricePerArea) : '—'}</strong></span></div>
                <div><CheckCircle2 size={21} /><span><small>Property ID</small><strong>{String(property.id).slice(0, 12)}</strong></span></div>
              </section>

              <section className="lq-detail-section">
                <h2>Features & amenities</h2>
                <div className="lq-detail-amenities">
                  {amenities.map((item) => (
                    <span key={item}><CheckCircle2 size={16} /> {item}</span>
                  ))}
                </div>
              </section>

              {property.latitude && property.longitude && (
                <section className="lq-detail-section">
                  <div className="lq-detail-section-heading-inline">
                    <h2>Location</h2>
                    <span><MapPin size={15} /> {addressLine || property.city}</span>
                  </div>

                  <div className="lq-detail-map">
                    <PropertyMap properties={[property]} selectedProperty={property} />
                  </div>
                </section>
              )}
            </div>

            <aside className="lq-detail-contact-card">
              <div className="lq-detail-agent">
                <div className="lq-detail-agent-avatar">
                  <UserRound size={26} />
                </div>

                <div>
                  <strong>Listed by {agentName}</strong>
                  <span><i /> Usually responds within minutes</span>
                </div>
              </div>

              <button
                type="button"
                className="lq-detail-whatsapp"
                onClick={() => setShowWhatsAppModal(true)}
              >
                <MessageCircle size={21} />
                Contact by WhatsApp
              </button>

              <form className="lq-detail-contact-form" onSubmit={submitContact}>
                <input
                  placeholder="Name"
                  value={leadForm.name}
                  onChange={(event) =>
                    setLeadForm((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                />

                <input
                  type="email"
                  placeholder="Email"
                  value={leadForm.email}
                  onChange={(event) =>
                    setLeadForm((current) => ({ ...current, email: event.target.value }))
                  }
                  required
                />

                <input
                  placeholder="Phone"
                  value={leadForm.phone}
                  onChange={(event) =>
                    setLeadForm((current) => ({ ...current, phone: event.target.value }))
                  }
                />

                <textarea
                  rows={4}
                  placeholder="Message"
                  value={leadForm.message}
                  onChange={(event) =>
                    setLeadForm((current) => ({ ...current, message: event.target.value }))
                  }
                />

                <button type="submit" disabled={leadState === 'sending'}>
                  {leadState === 'sending' ? 'Sending…' : 'Contact Agent'}
                </button>

                {leadState === 'success' && (
                  <p className="lq-detail-form-success">Your message was sent successfully.</p>
                )}

                {leadState === 'error' && (
                  <p className="lq-detail-form-error">Unable to send right now. Please try again.</p>
                )}
              </form>

              <div className="lq-detail-private">
                <Lock size={14} />
                Your information stays private.
              </div>
            </aside>
          </div>

          {similar.length > 0 && (
            <section className="lq-detail-similar">
              <div className="lq-detail-similar-head">
                <h2>Similar properties</h2>
                <Link to={typeParam === 'rent' ? '/rent' : '/buy'}>View all →</Link>
              </div>

              <div className="lq-detail-similar-grid">
                {similar.map((item) => {
                  const isFavorite = favoriteSimilarIds.has(item.id);

                  return (
                    <Link
                      to={`/property/${item.id}?type=${item.type || typeParam || 'sale'}`}
                      className="lq-detail-similar-card"
                      key={item.id}
                    >
                      <div className="lq-detail-similar-image">
                        {item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} alt={item.title || ''} />
                        ) : (
                          <div className="lq-detail-image-placeholder" />
                        )}

                        <button
                          type="button"
                          className={`lq-detail-similar-heart ${
                            isFavorite ? 'active' : ''
                          }`}
                          aria-label="Save property"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            toggleSimilarFavorite(item.id);
                          }}
                        >
                          <Heart
                            size={19}
                            fill={isFavorite ? 'currentColor' : 'none'}
                          />
                        </button>
                      </div>

                      <div className="lq-detail-similar-content">
                        <strong>{money(item.price)}</strong>

                        <span className="lq-detail-similar-location">
                          {[item.neighborhood, item.city, item.state]
                            .filter(Boolean)
                            .join(', ')}
                        </span>

                        <div className="lq-detail-similar-specs">
                          {item.bedrooms != null && (
                            <span>
                              <BedDouble size={13} />
                              {item.bedrooms}
                            </span>
                          )}

                          {item.bathrooms != null && (
                            <span>
                              <Bath size={13} />
                              {item.bathrooms}
                            </span>
                          )}

                          {(item.squareFeet || item.square_feet || item.lotSize) && (
                            <span>
                              <Maximize2 size={13} />
                              {Number(
                                item.squareFeet ||
                                item.square_feet ||
                                item.lotSize
                              ).toLocaleString()} m²
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {showWhatsAppModal && (
          <PropertyWhatsAppModal
            property={property}
            source="property_whatsapp_detail"
            onClose={() => setShowWhatsAppModal(false)}
          />
        )}
      </main>
    </SiteLayout>
  );
}
