import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './PropertyMap.css';

// VITE_MAPBOX_TOKEN (primary) or VITE_MAPBOX_ACCESS_TOKEN (common alternate name)
const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN ||
  import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ||
  '';

/** Marketplace (Ecuador) — center, bounds, zoom limits per product spec */
const ECUADOR_MAP = {
  center: [-78.1834, -1.8312],
  zoom: 6,
  minZoom: 5,
  maxZoom: 14,
  maxBounds: [
    [-82.0, -5.5],
    [-75.0, 1.5],
  ],
};

const DEFAULT_WORLD = {
  center: [-122.4194, 37.7749],
  zoom: 10,
};

function isRentListing(property) {
  return (property?.type || '').toLowerCase() === 'rent';
}

function formatMarkerPrice(property, variant) {
  const n = variant === 'perNight' ? property.pricePerNight ?? property.price : property.price;
  if (n == null || Number.isNaN(Number(n))) return null;
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(n));
  if (variant === 'perNight') return `${formatted}/nt`;
  if (isRentListing(property)) return `${formatted}/mo`;
  return formatted;
}

export default function PropertyMap({
  properties = [],
  selectedProperty = null,
  onPropertyClick = null,
  onPropertyOpen = null,
  /** 'dot' | 'pricePill' — pricePill shows price (or pricePerNight + /nt when priceMarkerVariant is perNight) */
  markerStyle = 'dot',
  priceMarkerVariant = 'default',
  /**
   * 'default' — legacy world default (e.g. vacation search).
   * 'ecuador' — marketplace: Ecuador center, maxBounds, min/max zoom.
   */
  mapRegion = 'default',
  onCityClick = null,
}) {
  const { i18n } = useTranslation();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const mapHandlersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [coordinateCount, setCoordinateCount] = useState(null);
  const activeMapRef = useRef(null);
  // Keep callbacks current without re-registering Mapbox layer listeners on every React render.
  const onPropertyClickRef = useRef(onPropertyClick);
  onPropertyClickRef.current = onPropertyClick;
  const onPropertyOpenRef = useRef(onPropertyOpen);
  onPropertyOpenRef.current = onPropertyOpen;

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) {
      console.warn(
        'Mapbox token not found. Set VITE_MAPBOX_TOKEN (or VITE_MAPBOX_ACCESS_TOKEN) in .env and restart the dev server.',
      );
      return;
    }

    setMapLoaded(false);

    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const ecuador = mapRegion === 'ecuador';
    const center = ecuador || mapRegion === 'vacation' ? [...ECUADOR_MAP.center] : [...DEFAULT_WORLD.center];
    const zoom = ecuador || mapRegion === 'vacation' ? ECUADOR_MAP.zoom : DEFAULT_WORLD.zoom;

    const options = {
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom,
    };

    if (ecuador) {
      options.minZoom = ECUADOR_MAP.minZoom;
      options.maxZoom = ECUADOR_MAP.maxZoom;
      options.maxBounds = ECUADOR_MAP.maxBounds;
    }

    map.current = new mapboxgl.Map(options);

    const m = map.current;
    activeMapRef.current = m;
    let disposed = false;
    const bumpResize = () => {
      try {
        m.resize();
      } catch (_) {}
    };

    const handleLoad = () => {
      if (disposed || activeMapRef.current !== m) return;
      bumpResize();
      requestAnimationFrame(() => { if (!disposed && activeMapRef.current === m) bumpResize(); });
      setMapLoaded(true);
    };
    m.on('load', handleLoad);

    return () => {
      disposed = true;
      m.off('load', handleLoad);
      // Invalidate all dependent effects before Mapbox destroys its style.
      if (activeMapRef.current === m) activeMapRef.current = null;
      if (map.current === m) map.current = null;
      try { m.remove(); } catch (_) {}
    };
  }, [mapRegion]);

  // Use DOM markers rather than Mapbox style-layer click handlers. This works
  // across style reloads and avoids a race with map.remove() during navigation.
  useEffect(() => {
    const m = map.current;
    if (!m || !mapLoaded || activeMapRef.current !== m) return;
    let disposed = false;
    const valid = properties.filter(p => p.latitude !== null && p.latitude !== undefined && p.latitude !== '' &&
      p.longitude !== null && p.longitude !== undefined && p.longitude !== '' &&
      Number.isFinite(Number(p.latitude)) && Number.isFinite(Number(p.longitude)) &&
      Math.abs(Number(p.latitude)) <= 90 && Math.abs(Number(p.longitude)) <= 180 &&
      !(Number(p.latitude) === 0 && Number(p.longitude) === 0));
    setCoordinateCount(valid.length);
    const groups = new Map();
    valid.forEach(p => {
      const key = `${Number(p.longitude)},${Number(p.latitude)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(p);
    });
    const pins = [];
    const popups = [];
    let closeTimer;
    const lang = (i18n.language || 'es').slice(0, 2);
    const labels = {
      es: { view: 'Ver propiedad', properties: 'propiedades', price: 'Precio a consultar' },
      en: { view: 'View property', properties: 'properties', price: 'Price on request' },
      pt: { view: 'Ver imóvel', properties: 'imóveis', price: 'Preço sob consulta' },
    }[lang] || { view: 'Ver propiedad', properties: 'propiedades', price: 'Precio a consultar' };
    const cancelClose = () => { clearTimeout(closeTimer); };
    const closePopups = () => { cancelClose(); popups.forEach(popup => popup.remove()); popups.length = 0; };
    const scheduleClose = () => { cancelClose(); closeTimer = setTimeout(closePopups, 240); };
    const openProperty = (property, event) => {
      if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
      if (onPropertyOpenRef.current) onPropertyOpenRef.current(property);
      else window.location.assign(`/property/${encodeURIComponent(property.id)}`);
    };
    groups.forEach((matches, key) => {
      const [lng, lat] = key.split(',').map(Number);
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'property-marker-price-pill lq-map-price-marker';
      const firstPrice = formatMarkerPrice(matches[0], priceMarkerVariant);
      el.textContent = matches.length === 1 ? (firstPrice || labels.price) : `${matches.length} ${labels.properties}`;
      el.setAttribute('aria-label', matches.length === 1
        ? `${matches[0].title || matches[0].propertyType || 'Property'}: ${firstPrice || labels.price}`
        : `${matches.length} ${labels.properties}`);
      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat([lng, lat]).addTo(m);
      pins.push(marker);
      const showPopup = () => {
        cancelClose();
        if (disposed || activeMapRef.current !== m) return;
        closePopups();
        const root = document.createElement('div');
        root.className = 'map-popup lq-map-property-preview';
        root.addEventListener('mouseenter', cancelClose);
        root.addEventListener('mouseleave', scheduleClose);
        const list = document.createElement('div');
        list.className = 'lq-map-preview-list';
        matches.forEach(property => {
          const item = document.createElement('div');
          item.className = 'lq-map-preview-item';
          const imageCandidate = property.primaryImage || property.thumbnailUrl || property.imageUrl || property.image || property.coverImage || property.coverUrl;
          const imageUrl = typeof imageCandidate === 'string' ? imageCandidate : imageCandidate?.url;
          if (imageUrl && (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith('/'))) {
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = property.title || property.propertyType || 'Property';
            img.loading = 'lazy';
            img.className = 'lq-map-preview-image';
            item.appendChild(img);
          }
          const title = document.createElement('strong');
          title.className = 'lq-map-preview-title';
          title.textContent = property.title || property.propertyType || 'Property';
          item.appendChild(title);
          const price = document.createElement('div');
          price.className = 'lq-map-preview-price';
          price.textContent = formatMarkerPrice(property, priceMarkerVariant) || labels.price;
          item.appendChild(price);
          // Show the same factual property attributes used by the listing detail.
          // Missing fields are omitted rather than displaying fabricated values.
          const facts = [];
          const bedrooms = property.bedrooms ?? property.beds;
          const bathrooms = property.bathrooms ?? property.baths;
          const area = property.lotSize ?? property.lot_size ?? property.area_m2 ?? property.areaM2 ?? property.areaSqm;
          const factLabels = {
            es: { beds: 'hab.', baths: 'baños' },
            en: { beds: 'beds', baths: 'baths' },
            pt: { beds: 'quartos', baths: 'banhos' },
          }[lang] || { beds: 'hab.', baths: 'baños' };
          const addCount = (value, label) => {
            if (value === null || value === undefined || value === '') return;
            const count = Number(value);
            if (Number.isFinite(count) && count >= 0) facts.push(`${count} ${label}`);
          };
          addCount(bedrooms, factLabels.beds);
          addCount(bathrooms, factLabels.baths);
          if (area !== null && area !== undefined && area !== '') {
            const squareMetres = Number(area);
            if (Number.isFinite(squareMetres) && squareMetres > 0) {
              facts.push(`${new Intl.NumberFormat(lang === 'en' ? 'en-US' : lang === 'pt' ? 'pt-BR' : 'es-EC', { maximumFractionDigits: 1 }).format(squareMetres)} m²`);
            }
          }
          if (facts.length) {
            const details = document.createElement('div');
            details.className = 'lq-map-preview-details';
            details.textContent = facts.join(' · ');
            item.appendChild(details);
          }
          const link = document.createElement('a');
          const vacation = mapRegion === 'vacation' || priceMarkerVariant === 'perNight';
          link.href = vacation
            ? `/vacation-rentals/property/${encodeURIComponent(property.id)}`
            : `/property/${encodeURIComponent(property.id)}${property.type ? `?type=${encodeURIComponent(property.type)}` : ''}`;
          link.className = 'lq-map-preview-link';
          link.textContent = `${labels.view} →`;
          link.addEventListener('click', event => {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            if (onPropertyOpenRef.current) {
              event.preventDefault();
              openProperty(property, event);
            }
          });
          item.appendChild(link);
          list.appendChild(item);
        });
        root.appendChild(list);
        const popup = new mapboxgl.Popup({ offset: 18, maxWidth: '300px', closeOnClick: false, closeButton: true })
          .setLngLat([lng, lat]).setDOMContent(root).addTo(m);
        popups.push(popup);
      };
      el.addEventListener('mouseenter', showPopup);
      el.addEventListener('mouseleave', scheduleClose);
      el.addEventListener('click', event => { event.stopPropagation(); showPopup(); });
      el.addEventListener('focus', showPopup);
    });
    if (valid.length) {
      const bounds = new mapboxgl.LngLatBounds();
      valid.forEach(p => bounds.extend([Number(p.longitude), Number(p.latitude)]));
      if (groups.size > 1) m.fitBounds(bounds, { padding: 55, maxZoom: mapRegion === 'ecuador' ? 12 : 14 });
      else m.flyTo({ center: bounds.getCenter(), zoom: 12 });
    }
    return () => {
      disposed = true;
      clearTimeout(closeTimer);
      popups.forEach(p => p.remove());
      pins.forEach(p => p.remove());
    };
  }, [properties, mapLoaded, mapRegion, priceMarkerVariant, i18n.language]);

  // Center map on selected property
  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedProperty || activeMapRef.current !== map.current || !map.current.style) return;

    if (Number.isFinite(Number(selectedProperty.latitude)) && Number.isFinite(Number(selectedProperty.longitude)) && selectedProperty.latitude != null && selectedProperty.longitude != null) {
      const z = mapRegion === 'ecuador' ? Math.min(14, ECUADOR_MAP.maxZoom) : 14;
      map.current.flyTo({
        center: [selectedProperty.longitude, selectedProperty.latitude],
        zoom: z,
        duration: 1000,
      });
    }
  }, [selectedProperty, mapLoaded, mapRegion]);

  // Grid/sticky panels often get size after first paint — Mapbox needs an explicit resize.
  useEffect(() => {
    const el = mapContainer.current;
    if (!el || !map.current) return;

    const ro = new ResizeObserver(() => {
      if (map.current && map.current.style) {
        try {
          map.current.resize();
        } catch (_) {}
      }
    });
    ro.observe(el);

    const onWin = () => {
      if (map.current && map.current.style) {
        try {
          map.current.resize();
        } catch (_) {}
      }
    };
    window.addEventListener('resize', onWin);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onWin);
    };
  }, [mapLoaded]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="property-map-container property-map-error">
        <p>
          Mapbox token not configured. Add VITE_MAPBOX_TOKEN or VITE_MAPBOX_ACCESS_TOKEN to{' '}
          <code>.env</code> and restart <code>npm run dev</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="property-map-container">
      <div ref={mapContainer} className="property-map" />
      {mapLoaded && coordinateCount === 0 && properties.length > 0 && (
        <div className="lq-map-coordinate-notice" role="status">
          {({ en: 'No exact locations are saved for these listings. Map pins appear when verified coordinates are available.', es: 'Estos anuncios no tienen ubicaciones exactas guardadas. Los puntos aparecerán cuando haya coordenadas verificadas.', pt: 'Estes anúncios não têm localizações exatas salvas. Os pontos aparecerão quando houver coordenadas verificadas.' })[(i18n.language || 'en').slice(0, 2)] || 'No exact locations are saved for these listings.'}
        </div>
      )}
    </div>
  );
}
