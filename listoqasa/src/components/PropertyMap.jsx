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
      m.remove();
    };
  }, [mapRegion]);

  // Only persisted, valid property coordinates receive pins. No city-centre substitutes.
  useEffect(() => {
    const m = map.current;
    if (!m || !mapLoaded || activeMapRef.current !== m || !m.style) return;
    let disposed = false;
    const live = () => !disposed && activeMapRef.current === m && Boolean(m.style);
    const sourceId = 'lq-property-points';
    const layerId = 'lq-property-pins';
    const valid = properties.filter(p => p.latitude !== null && p.latitude !== undefined && p.latitude !== '' &&
      p.longitude !== null && p.longitude !== undefined && p.longitude !== '' &&
      Number.isFinite(Number(p.latitude)) && Number.isFinite(Number(p.longitude)) &&
      Math.abs(Number(p.latitude)) <= 90 && Math.abs(Number(p.longitude)) <= 180 &&
      !(Number(p.latitude) === 0 && Number(p.longitude) === 0));
    setCoordinateCount(valid.length);
    const geo = { type: 'FeatureCollection', features: valid.map((p, index) => ({
      type: 'Feature', id: index, properties: { index },
      geometry: { type: 'Point', coordinates: [Number(p.longitude), Number(p.latitude)] },
    })) };
    const handlers = [];
    const listen = (event, layer, fn) => { m.on(event, layer, fn); handlers.push([event, layer, fn]); };
    const clearHandlers = () => {
      handlers.forEach(([event, layer, fn]) => m.off(event, layer, fn));
      handlers.length = 0;
    };
    const render = () => {
      if (!live() || !m.isStyleLoaded()) return;
      const source = m.getSource(sourceId);
      if (source) source.setData(geo);
      else m.addSource(sourceId, { type: 'geojson', data: geo, cluster: false });
      if (!m.getLayer(layerId)) {
        m.addLayer({ id: layerId, type: 'circle', source: sourceId,
          paint: { 'circle-color': '#ffffff', 'circle-radius': 6, 'circle-stroke-color': '#1259da', 'circle-stroke-width': 3 } });
      }
      listen('click', layerId, (event) => {
        event.originalEvent?.stopPropagation?.();
        if (!live()) return;
        const feature = event.features?.[0];
        if (!feature) return;
        const coordinates = feature.geometry.coordinates;
        // Area-level coordinates may be shared by many sample listings.
        // Present a chooser instead of silently selecting an arbitrary record.
        const matches = valid.filter(p =>
          Number(p.longitude) === Number(coordinates[0]) &&
          Number(p.latitude) === Number(coordinates[1]));
        if (!matches.length) return;
        const root = document.createElement('div');
        root.className = 'map-popup';
        const heading = document.createElement('strong');
        heading.textContent = matches.length === 1 ? 'Property' : `${matches.length} properties in this area`;
        root.appendChild(heading);
        const list = document.createElement('div');
        list.style.cssText = 'max-height:220px;overflow-y:auto;min-width:185px;';
        matches.forEach(property => {
          const link = document.createElement('a');
          link.href = `/property/${encodeURIComponent(property.id)}?type=${encodeURIComponent(property.type || 'sale')}`;
          link.style.cssText = 'display:block;padding:7px 0;border-bottom:1px solid #e5e7eb;color:#1557c0;text-decoration:none;';
          link.textContent = `${property.propertyType || property.title || 'Property'} · ${formatMarkerPrice(property, priceMarkerVariant) || ''}`;
          link.addEventListener('click', e => {
            // Let standard browser navigation work, including open-in-new-tab.
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            e.preventDefault();
            onPropertyClickRef.current?.(property);
          });
          list.appendChild(link);
        });
        root.appendChild(list);
        new mapboxgl.Popup({ offset: 14, maxWidth: '320px', closeOnClick: false })
          .setLngLat(coordinates).setDOMContent(root).addTo(m);
        // Do not select on marker click: selecting updates React and can close the popup.
        // Select only when a user clicks a listing inside the popup.
      });
      listen('mouseenter', layerId, () => { if (live()) m.getCanvas().style.cursor = 'pointer'; });
      listen('mouseleave', layerId, () => { if (live()) m.getCanvas().style.cursor = ''; });
      if (valid.length) {
        const bounds = new mapboxgl.LngLatBounds();
        valid.forEach(p => bounds.extend([Number(p.longitude), Number(p.latitude)]));
        if (valid.length > 1) m.fitBounds(bounds, { padding: 55, maxZoom: mapRegion === 'ecuador' ? 12 : 14 });
        else m.flyTo({ center: [Number(valid[0].longitude), Number(valid[0].latitude)], zoom: 12 });
      }
    };
    if (m.isStyleLoaded()) render();
    else m.once('style.load', render);
    return () => {
      disposed = true;
      m.off('style.load', render);
      clearHandlers();
      // IMPORTANT: Never call getLayer/getSource during unmount. Mapbox may
      // already have destroyed its style, causing getOwnLayer exceptions.
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
