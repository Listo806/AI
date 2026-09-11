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
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
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

  // Update markers when properties change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const fitMaxZoom = mapRegion === 'ecuador' ? ECUADOR_MAP.maxZoom : 15;

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add markers for each property
    properties.forEach((property) => {
      if (!property.latitude || !property.longitude) return;

      const el = document.createElement('div');
      const pillText = markerStyle === 'pricePill' ? formatMarkerPrice(property, priceMarkerVariant) : null;
      if (markerStyle === 'pricePill' && pillText) {
        el.className = 'property-marker-price-pill';
        el.textContent = pillText;
      } else {
        el.className = 'property-marker';
        if (markerStyle === 'pricePill' && !pillText) {
          el.title = property.title || 'Listing';
        }
      }
      if (selectedProperty && selectedProperty.id === property.id) {
        el.className += ' property-marker-selected';
      }

      const popupPrice =
        priceMarkerVariant === 'perNight' && (property.pricePerNight != null || property.price != null)
          ? (() => {
              const v = property.pricePerNight ?? property.price;
              return v != null
                ? `<p><strong>${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(v))}/night</strong></p>`
                : '';
            })()
          : property.price != null
            ? (() => {
                const p = Number(property.price);
                const base = new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                }).format(p);
                const suffix = isRentListing(property) ? '/mo' : '';
                return `<p><strong>${base}${suffix}</strong></p>`;
              })()
            : '';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([property.longitude, property.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div class="map-popup">
                <h4>${property.title || 'Untitled Property'}</h4>
                <p>${property.address || ''} ${property.city || ''} ${property.state || ''}</p>
                ${popupPrice}
                ${onPropertyClick ? `<button class="map-popup-btn" data-property-id="${property.id}">View Details</button>` : ''}
              </div>
            `),
        )
        .addTo(map.current);

      // Handle click on marker
      if (onPropertyClick) {
        marker.getElement().addEventListener('click', () => {
          onPropertyClick(property);
        });

        // Handle click on popup button
        marker.getPopup().on('open', () => {
          const btn = marker.getPopup()._content.querySelector('.map-popup-btn');
          if (btn) {
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              onPropertyClick(property);
            });
          }
        });
      }

      markersRef.current.push(marker);
    });

    // Fit map to show all markers
    if (properties.length > 0 && properties.some((p) => p.latitude && p.longitude)) {
      const bounds = new mapboxgl.LngLatBounds();
      properties.forEach((property) => {
        if (property.latitude && property.longitude) {
          bounds.extend([property.longitude, property.latitude]);
        }
      });

      if (bounds.isEmpty() === false) {
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: fitMaxZoom,
        });
      }
    }
  }, [properties, mapLoaded, selectedProperty, onPropertyClick, markerStyle, priceMarkerVariant, mapRegion]);

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
