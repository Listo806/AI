import { useEffect, useRef, useState } from 'react';
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
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const mapHandlersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);

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
    const center = ecuador ? [...ECUADOR_MAP.center] : [...DEFAULT_WORLD.center];
    const zoom = ecuador ? ECUADOR_MAP.zoom : DEFAULT_WORLD.zoom;

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
    const bumpResize = () => {
      try {
        m.resize();
      } catch (_) {}
    };

    m.on('load', () => {
      bumpResize();
      requestAnimationFrame(bumpResize);
      setMapLoaded(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapRegion]);

  // Only valid coordinates receive individual pins. City markers are explicitly
  // aggregates, never invented exact property locations.
  useEffect(() => {
    const m = map.current;
    if (!m || !mapLoaded) return;
    const removeHandlers = () => {
      mapHandlersRef.current.forEach(([event, layer, handler]) => m.off(event, layer, handler));
      mapHandlersRef.current = [];
    };
    removeHandlers();
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    ['lq-property-clusters', 'lq-property-cluster-count', 'lq-property-pins'].forEach(id => {
      if (m.getLayer(id)) m.removeLayer(id);
    });
    if (m.getSource('lq-property-points')) m.removeSource('lq-property-points');

    const valid = properties.filter(p => Number.isFinite(Number(p.latitude)) && Number.isFinite(Number(p.longitude)) &&
      p.latitude != null && p.longitude != null && Number(p.latitude) >= -90 && Number(p.latitude) <= 90 &&
      Number(p.longitude) >= -180 && Number(p.longitude) <= 180 && !(Number(p.latitude) === 0 && Number(p.longitude) === 0));
    const geo = { type: 'FeatureCollection', features: valid.map((p, i) => ({
      type: 'Feature', id: i, properties: { index: i },
      geometry: { type: 'Point', coordinates: [Number(p.longitude), Number(p.latitude)] },
    })) };
    m.addSource('lq-property-points', { type: 'geojson', data: geo, cluster: true, clusterRadius: 48, clusterMaxZoom: 13 });
    m.addLayer({ id: 'lq-property-clusters', type: 'circle', source: 'lq-property-points', filter: ['has', 'point_count'],
      paint: { 'circle-color': '#1259da', 'circle-radius': ['step', ['get', 'point_count'], 20, 10, 26, 50, 32],
        'circle-stroke-color': '#fff', 'circle-stroke-width': 2 } });
    m.addLayer({ id: 'lq-property-cluster-count', type: 'symbol', source: 'lq-property-points', filter: ['has', 'point_count'],
      layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 13 },
      paint: { 'text-color': '#fff' } });
    m.addLayer({ id: 'lq-property-pins', type: 'circle', source: 'lq-property-points', filter: ['!', ['has', 'point_count']],
      paint: { 'circle-color': '#ffffff', 'circle-radius': 10, 'circle-stroke-color': '#1259da', 'circle-stroke-width': 3 } });

    const listen = (event, layer, fn) => { m.on(event, layer, fn); mapHandlersRef.current.push([event, layer, fn]); };
    listen('click', 'lq-property-clusters', (e) => {
      const feature = e.features?.[0];
      if (!feature) return;
      m.getSource('lq-property-points').getClusterExpansionZoom(feature.properties.cluster_id, (err, zoom) => {
        if (!err) m.easeTo({ center: feature.geometry.coordinates, zoom });
      });
    });
    listen('click', 'lq-property-pins', (e) => {
      const feature = e.features?.[0];
      const property = valid[Number(feature?.properties?.index)];
      if (!property) return;
      const root = document.createElement('div');
      root.className = 'map-popup';
      const imgUrl = property.thumbnailUrl || property.imageUrl || property.image;
      if (imgUrl && /^https?:\/\//i.test(imgUrl)) {
        const img = document.createElement('img'); img.src = imgUrl; img.alt = property.title || 'Property';
        img.className = 'map-popup-cover'; root.appendChild(img);
      }
      const name = document.createElement('strong'); name.textContent = property.title || property.propertyType || 'Property'; root.appendChild(name);
      const price = document.createElement('p'); price.textContent = formatMarkerPrice(property, priceMarkerVariant) || ''; root.appendChild(price);
      const button = document.createElement('button'); button.type = 'button'; button.className = 'map-popup-btn';
      button.textContent = 'View details'; button.addEventListener('click', () => onPropertyClick?.(property)); root.appendChild(button);
      new mapboxgl.Popup({ offset: 14 }).setLngLat(feature.geometry.coordinates).setDOMContent(root).addTo(m);
    });
    ['lq-property-clusters', 'lq-property-pins'].forEach(layer => {
      listen('mouseenter', layer, () => { m.getCanvas().style.cursor = 'pointer'; });
      listen('mouseleave', layer, () => { m.getCanvas().style.cursor = ''; });
    });

    const cityCoordinates = {
      quito: [-78.4678, -0.1807], guayaquil: [-79.8891, -2.1709], cuenca: [-79.0045, -2.9001],
      samborondon: [-79.738, -2.045], 'samborondón': [-79.738, -2.045],
      cumbaya: [-78.431, -0.204], 'cumbayá': [-78.431, -0.204],
      manta: [-80.7089, -0.9677], tumbaco: [-78.403, -0.213],
    };
    const groups = new Map();
    properties.filter(p => !valid.includes(p)).forEach(p => {
      const city = String(p.neighborhood || p.city || '').trim();
      const key = city.toLocaleLowerCase();
      // Only known city centers, never fabricated property coordinates.
      if (!cityCoordinates[key]) return;
      const item = groups.get(key) || { city, count: 0, coordinates: cityCoordinates[key] };
      item.count += 1; groups.set(key, item);
    });
    groups.forEach(({ city, count, coordinates }) => {
      const el = document.createElement('button'); el.type = 'button'; el.className = 'lq-city-map-marker';
      el.textContent = `${city} · ${count}`;
      el.title = `${count} listings without exact coordinates in ${city}`;
      el.addEventListener('click', () => { m.flyTo({ center: coordinates, zoom: 11 }); onCityClick?.(city); });
      markersRef.current.push(new mapboxgl.Marker({ element: el }).setLngLat(coordinates).addTo(m));
    });
    // Reframe only when filters/data change, not on selected card.
    if (valid.length && !groups.size) {
      const bounds = new mapboxgl.LngLatBounds();
      valid.forEach(p => bounds.extend([Number(p.longitude), Number(p.latitude)]));
      m.fitBounds(bounds, { padding: 55, maxZoom: mapRegion === 'ecuador' ? 12 : 14 });
    } else if (groups.size === 1 && !valid.length) {
      m.flyTo({ center: [...groups.values()][0].coordinates, zoom: 10 });
    }
    return () => {
      removeHandlers();
      markersRef.current.forEach(marker => marker.remove()); markersRef.current = [];
      ['lq-property-clusters', 'lq-property-cluster-count', 'lq-property-pins'].forEach(id => { if (m.getLayer(id)) m.removeLayer(id); });
      if (m.getSource('lq-property-points')) m.removeSource('lq-property-points');
    };
  }, [properties, mapLoaded, mapRegion, onPropertyClick, onCityClick, priceMarkerVariant]);

  // Center map on selected property
  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedProperty) return;

    if (selectedProperty.latitude && selectedProperty.longitude) {
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
      if (map.current) {
        try {
          map.current.resize();
        } catch (_) {}
      }
    });
    ro.observe(el);

    const onWin = () => {
      if (map.current) {
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
    </div>
  );
}
