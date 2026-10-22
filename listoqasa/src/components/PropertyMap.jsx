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
    groups.forEach((matches, key) => {
      const [lng, lat] = key.split(',').map(Number);
      const el = document.createElement('button');
      el.type = 'button';
      el.setAttribute('aria-label', `Show ${matches.length} ${matches.length === 1 ? 'property' : 'properties'} on map`);
      el.title = `${matches.length} ${matches.length === 1 ? 'property' : 'properties'}`;
      el.style.cssText = 'width:16px;height:16px;border-radius:50%;background:#fff;border:3px solid #1259da;box-shadow:0 1px 5px #0004;cursor:pointer;padding:0;display:block;';
      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat([lng, lat]).addTo(m);
      pins.push(marker);
      const openPopup = event => {
        event.stopPropagation();
        if (disposed || activeMapRef.current !== m) return;
        popups.forEach(p => p.remove());
        popups.length = 0;
        const root = document.createElement('div');
        root.className = 'map-popup';
        const heading = document.createElement('strong');
        heading.textContent = matches.length === 1 ? 'Property' : `${matches.length} properties in this area`;
        root.appendChild(heading);
        const list = document.createElement('div');
        list.style.cssText = 'max-height:220px;overflow-y:auto;min-width:185px;';
        matches.forEach(property => {
          const link = document.createElement('a');
          const vacation = mapRegion === 'vacation' || priceMarkerVariant === 'perNight';
          link.href = vacation
            ? `/vacation-rentals/property/${encodeURIComponent(property.id)}`
            : `/property/${encodeURIComponent(property.id)}?type=${encodeURIComponent(property.type || 'sale')}`;
          link.style.cssText = 'display:block;padding:7px 0;border-bottom:1px solid #e5e7eb;color:#1557c0;text-decoration:none;';
          link.textContent = `${property.propertyType || property.title || 'Property'} · ${formatMarkerPrice(property, priceMarkerVariant) || ''}`;
          link.addEventListener('click', e => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            if (onPropertyClickRef.current) {
              e.preventDefault();
              onPropertyClickRef.current(property);
            }
          });
          list.appendChild(link);
        });
        root.appendChild(list);
        const popup = new mapboxgl.Popup({ offset: 16, maxWidth: '320px', closeOnClick: false })
          .setLngLat([lng, lat]).setDOMContent(root).addTo(m);
        popups.push(popup);
      };
      el.addEventListener('click', openPopup);
    });
    if (valid.length) {
      const bounds = new mapboxgl.LngLatBounds();
      valid.forEach(p => bounds.extend([Number(p.longitude), Number(p.latitude)]));
      if (groups.size > 1) m.fitBounds(bounds, { padding: 55, maxZoom: mapRegion === 'ecuador' ? 12 : 14 });
      else m.flyTo({ center: bounds.getCenter(), zoom: 12 });
    }
    return () => {
      disposed = true;
      popups.forEach(p => p.remove());
      pins.forEach(p => p.remove());
    };
  }, [properties, mapLoaded, mapRegion, priceMarkerVariant]);

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
