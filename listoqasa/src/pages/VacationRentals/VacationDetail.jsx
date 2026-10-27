import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SiteLayout from '../../components/layout/SiteLayout';
import VacationRentalsHeader from './VacationRentalsHeader';
import { Wifi, BedDouble, Bath, Users, MapPin, Laptop, Utensils, CookingPot, Waves, Tv, Wind, Car, Coffee, BookOpen, Sun, Check, ShowerHead } from 'lucide-react';
import { vacationRequest } from './vacationApi';
import './VacationDetail.css';

const words = {
  en: { back:'Back to results', guests:'guests', bedrooms:'bedrooms', bathrooms:'bathrooms', amenities:'Amenities', checkin:'Check-in', checkout:'Check-out', guest:'Guests', reserve:'Reserve', night:'per night', total:'Total', choose:'Select dates to see total.', pending:'Checking booking…', unavailable:'Booking is unavailable for this illustrative listing.', select:'Choose valid dates and guest count.', login:'Please sign in to reserve this property.', success:'Booking request submitted.', failed:'Booking could not be completed.', noPhotos:'No photos available', notCharged:"You won't be charged yet.", nightCount:'nights', more:'More vacation rentals', view:'View rental', location:'Location', mapUnavailable:'Location information is unavailable.' },
  es: { back:'Volver a resultados', guests:'huéspedes', bedrooms:'habitaciones', bathrooms:'baños', amenities:'Servicios', checkin:'Entrada', checkout:'Salida', guest:'Huéspedes', reserve:'Reservar', night:'por noche', total:'Total', choose:'Seleccione fechas para ver el total.', pending:'Comprobando reserva…', unavailable:'Reservas no disponibles para este anuncio ilustrativo.', select:'Seleccione fechas válidas y huéspedes.', login:'Inicie sesión para reservar.', success:'Solicitud de reserva enviada.', failed:'No se pudo completar la reserva.', noPhotos:'Sin fotos', notCharged:'Aún no se realizará ningún cargo.', nightCount:'noches', more:'Más alquileres vacacionales', view:'Ver alojamiento', location:'Ubicación', mapUnavailable:'Información de ubicación no disponible.' },
  pt: { back:'Voltar aos resultados', guests:'hóspedes', bedrooms:'quartos', bathrooms:'banheiros', amenities:'Comodidades', checkin:'Check-in', checkout:'Check-out', guest:'Hóspedes', reserve:'Reservar', night:'por noite', total:'Total', choose:'Selecione as datas para ver o total.', pending:'Verificando reserva…', unavailable:'Reserva indisponível para este anúncio ilustrativo.', select:'Selecione datas e hóspedes válidos.', login:'Entre na sua conta para reservar.', success:'Solicitação de reserva enviada.', failed:'Não foi possível concluir a reserva.', noPhotos:'Sem fotos', notCharged:'Você ainda não será cobrado.', nightCount:'noites', more:'Mais aluguéis de temporada', view:'Ver imóvel', location:'Localização', mapUnavailable:'Informações de localização indisponíveis.' }
};
const asUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value) ? value : null;
const imageList = (item) => {
  const candidates = [item?.primaryImage, item?.thumbnailUrl, ...(Array.isArray(item?.images) ? item.images : []), ...(Array.isArray(item?.photos) ? item.photos : [])];
  return [...new Set(candidates.map(v => asUrl(typeof v === 'string' ? v : v?.url || v?.src)).filter(Boolean))];
};
const dayDiff = (start, end) => {
  if (!start || !end) return 0;
  const a = Date.parse(`${start}T12:00:00Z`), b = Date.parse(`${end}T12:00:00Z`);
  return Number.isFinite(a) && Number.isFinite(b) && b > a ? Math.round((b-a)/86400000) : 0;
};
const iconFor = (value) => {
  const name = String(value).toLowerCase();
  if (/wi.?fi|internet/.test(name)) return Wifi;
  if (/bed|linen|sheet/.test(name)) return BedDouble;
  if (/towel|bathroom|shower/.test(name)) return Bath;
  if (/workspace|desk|office/.test(name)) return Laptop;
  if (/balcony|terrace|patio/.test(name)) return Sun;
  if (/dining/.test(name)) return Utensils;
  if (/kitchen|cook/.test(name)) return CookingPot;
  if (/pool|swim/.test(name)) return Waves;
  if (/tv|television/.test(name)) return Tv;
  if (/air.condition|cooling/.test(name)) return Wind;
  if (/parking|garage/.test(name)) return Car;
  if (/coffee/.test(name)) return Coffee;
  if (/reading|book/.test(name)) return BookOpen;
  return Check;
};

export default function VacationDetail() {
  const { id } = useParams();
  const loc = useLocation();
  const { i18n } = useTranslation();
  const t = words[(i18n.language || 'en').slice(0,2)] || words.en;
  const [item,setItem] = useState(null);
  const [error,setError] = useState('');
  const [slide,setSlide] = useState(0);
  const searchParams = new URLSearchParams(loc.search);
  const [checkIn,setCheckIn] = useState(searchParams.get('checkIn')||'');
  const [checkOut,setCheckOut] = useState(searchParams.get('checkOut')||'');
  const [guests,setGuests] = useState(Math.max(1,Number(searchParams.get('guests'))||1));
  const [editing,setEditing]=useState(false);
  const [busy,setBusy] = useState(false);
  const [bookingMessage,setBookingMessage] = useState('');
  const [related,setRelated] = useState([]);
  useEffect(() => {
    const controller = new AbortController();
    setItem(null); setError(''); setSlide(0); setBookingMessage('');
    vacationRequest(`property/${encodeURIComponent(id)}`,controller.signal).then(setItem).catch(e => {
      if (e.name !== 'AbortError') setError(e.message || 'Unable to load property');
    });
    return () => controller.abort();
  },[id]);
  useEffect(() => {
    if (!item?.id) return undefined;
    const controller = new AbortController();
    const loadRelated = async () => {
      try {
        // Related cards come from the real public vacation-rentals search API.
        const query = new URLSearchParams({ limit: '40', offset: '0' });
        const response = await vacationRequest(`search?${query}`, controller.signal);
        if (controller.signal.aborted) return;
        const available = (Array.isArray(response?.items) ? response.items : [])
          .filter(p => p?.id && String(p.id) !== String(item.id));
        const sameArea = available.filter(p => p.city && item.city && p.city.toLowerCase() === item.city.toLowerCase());
        const others = available.filter(p => !sameArea.some(a => a.id === p.id));
        setRelated([...sameArea, ...others].slice(0, 6));
      } catch (e) { if (e.name !== 'AbortError') setRelated([]); }
    };
    setRelated([]);
    loadRelated();
    return () => controller.abort();
  }, [item?.id, item?.city]);
  const mapLocation = useMemo(() => {
    if (!item) return null;
    const lat = Number(item.latitude ?? item.lat ?? item.location?.latitude ?? item.location?.lat);
    const lng = Number(item.longitude ?? item.lng ?? item.lon ?? item.location?.longitude ?? item.location?.lng);
    const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && (lat !== 0 || lng !== 0);
    const place = [item.city, item.state, item.country].filter(Boolean).join(', ');
    if (!hasCoordinates && !place) return null;
    const query = hasCoordinates ? `${lat},${lng}` : place;
    return { place: place || query, url: `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=13&output=embed` };
  }, [item]);
  const photos = useMemo(() => imageList(item),[item]);
  const amenities = useMemo(() => Array.isArray(item?.amenities) ? item.amenities : [],[item]);
  const nights = dayDiff(checkIn,checkOut);
  const rate = Number(item?.pricePerNight ?? 0);
  const maxGuests = Math.max(1, Number(item?.maxGuests) || 1);
  const minNights=Math.max(1,Number(item?.minimumNights ?? item?.minNights ?? 1));
  const total = nights >= minNights && Number.isFinite(rate) ? nights * rate : null;
  const today = new Date().toISOString().slice(0,10);
  const bookingAllowed = Boolean(item && !item.isSample && nights >= minNights && guests >= 1 && guests <= maxGuests && checkIn >= today);
  const reserve = async () => {
    setBookingMessage('');
    if (item?.isSample) { setBookingMessage(t.unavailable); return; }
    if (!bookingAllowed) { setBookingMessage(t.select); return; }
    // This backend requires JWT for bookings; do not submit a false booking for an anonymous visitor.
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) { setBookingMessage(t.login); return; }
    setBusy(true);
    try {
      const base = (import.meta.env.VITE_API_URL || 'https://backend.cortexaaicrm.com/api').replace(/\/+$/,'');
      const response = await fetch(`${base}/vacation-rentals/bookings`, {
        method:'POST',
        headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
        body:JSON.stringify({property_id:item.id || id,booking_start:checkIn,booking_end:checkOut,notes:`Guests: ${guests}`})
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(Array.isArray(payload?.message) ? payload.message.join(', ') : payload?.message || (response.status === 401 ? t.login : t.failed));
      }
      setBookingMessage(t.success);
    } catch (e) { setBookingMessage(e.message || t.failed); }
    finally { setBusy(false); }
  };
  return <SiteLayout showHeader={false}>
    <div className="vr-detail-header"><VacationRentalsHeader compact /></div>
    <main className="vr-detail-v2">
      <Link className="vr-detail-back" to={`/vacation-rentals/search${loc.search}`}>← {t.back}</Link>
      {error && <p role="alert">{error}</p>}
      {!item && !error && <p>…</p>}
      {item && <>
        <div className="vr-detail-gallery">
          {photos.length ? <img src={photos[slide]} alt={`${item.title} ${slide+1}`} /> : <div className="vr-detail-no-photo">{t.noPhotos}</div>}
          {photos.length > 1 && <>
            <button type="button" className="vr-detail-arrow prev" aria-label="Previous photo" onClick={() => setSlide(v => (v - 1 + photos.length) % photos.length)}>‹</button>
            <button type="button" className="vr-detail-arrow next" aria-label="Next photo" onClick={() => setSlide(v => (v + 1) % photos.length)}>›</button>
            <div className="vr-detail-count">{slide+1} / {photos.length}</div>
            <div className="vr-detail-dots">{photos.slice(0,7).map((_,i)=><button type="button" key={i} aria-label={`Photo ${i+1}`} className={slide===i?'active':''} onClick={()=>setSlide(i)}/>)}</div>
          </>}
        </div>
        <div className="vr-detail-columns">
          <section className="vr-detail-info">
            <h1>{item.title}</h1>
            <p className="vr-detail-location"><MapPin size={18} aria-hidden="true" /> {[item.city,item.state,item.country].filter(Boolean).join(', ')}</p>
            <div className="vr-detail-stats"><span><Users size={21} aria-hidden="true" /> {maxGuests} {t.guests}</span><span><BedDouble size={21} aria-hidden="true" /> {item.bedrooms ?? '–'} {t.bedrooms}</span><span><ShowerHead size={21} aria-hidden="true" /> {item.bathrooms ?? '–'} {t.bathrooms}</span></div>
            {item.description && <p className="vr-detail-description">{item.description}</p>}
            <div className="vr-detail-amenities"><h2>{t.amenities}</h2><div className="vr-detail-amenity-grid">{amenities.map((a,i)=>{ const AmenityIcon = iconFor(a); return <div key={i}><AmenityIcon size={23} strokeWidth={1.8} aria-hidden="true" /><span>{String(a)}</span></div>; })}</div></div>
          </section>
          <aside className={`vr-booking-card ${editing?"vr-booking-editing":""}`}><h2 className="vr-stay-heading">Stay details</h2><button type="button" className="vr-stay-edit" onClick={()=>setEditing(v=>!v)}>{editing?"Close":"Edit"}</button>
            <div className="vr-booking-price"><strong>${Number.isFinite(rate)?rate.toLocaleString():'–'}</strong> <span>{t.night}</span></div>
            <label>{t.checkin}<input type="date" min={today} value={checkIn} onChange={e=>{setCheckIn(e.target.value);if(checkOut && checkOut<=e.target.value)setCheckOut('')}} /></label>
            <label>{t.checkout}<input type="date" min={checkIn || today} value={checkOut} onChange={e=>setCheckOut(e.target.value)} /></label>
            <label>{t.guest}<select value={guests} onChange={e=>setGuests(Number(e.target.value))}>{Array.from({length:maxGuests},(_,i)=><option value={i+1} key={i+1}>{i+1} {t.guests}</option>)}</select></label>
            <button className="vr-reserve-btn" type="button" disabled={busy || item.isSample} onClick={reserve}>{busy?t.pending:t.reserve}</button>
            <p className="vr-booking-small">{item.isSample ? t.unavailable : t.notCharged}</p>
            <div className="vr-booking-total"><strong>{t.total}</strong><span>{total != null ? `$${total.toLocaleString()} (${nights} ${t.nightCount})` : t.choose}</span></div>
            {bookingMessage && <p role="status" className="vr-booking-message">{bookingMessage}</p>}
          </aside>
        </div>
        <section className="vr-detail-map-section" aria-label={t.location}>
          <h2>{t.location}</h2>
          {mapLocation ? <div className="vr-detail-map-frame"><iframe title={`${t.location}: ${mapLocation.place}`} src={mapLocation.url} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /></div> : <p>{t.mapUnavailable}</p>}
        </section>
        <div className="vr-mobile-booking"><div><strong>{total!=null?`$${total.toLocaleString()} total`:t.choose}</strong><small>{nights>0?`${nights} ${t.nightCount} · `:""}{checkIn&&checkOut?`${checkIn} – ${checkOut} · `:""}{guests} {t.guests}</small></div><button type="button" disabled={busy||item.isSample} onClick={reserve}>{busy?t.pending:t.reserve}</button></div>
        {related.length > 0 && <section className="vr-detail-related" aria-label={t.more}>
          <h2>{t.more}</h2>
          <div className="vr-detail-related-grid">
            {related.map(p => {
              const photo = imageList(p)[0];
              const price = Number(p.pricePerNight);
              return <Link key={p.id} className="vr-detail-related-card" to={`/vacation-rentals/property/${encodeURIComponent(p.id)}${loc.search}`} aria-label={`${t.view}: ${p.title || p.propertyType || p.city}`}>
                <div className="vr-detail-related-photo">{photo ? <img src={photo} alt={p.title || p.city || ''} loading="lazy" /> : <span>{t.noPhotos}</span>}</div>
                <div className="vr-detail-related-body">
                  <strong>{p.title || p.propertyType || p.city}</strong>
                  <span className="vr-detail-related-city"><MapPin size={13} aria-hidden="true" /> {p.city}{p.country ? `, ${p.country}` : ''}</span>
                  <span className="vr-detail-related-price">{Number.isFinite(price) ? `$${price.toLocaleString()}` : '–'} <small>{t.night}</small></span>
                </div>
              </Link>;
            })}
          </div>
        </section>}
      </>}
    </main>
  </SiteLayout>;
}
