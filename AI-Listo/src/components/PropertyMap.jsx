import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './PropertyMap.css';

// VITE_MAPBOX_TOKEN (primary) or VITE_MAPBOX_ACCESS_TOKEN (common alternate name)
const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN ||
  import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ||
  '';

function formatMarkerPrice(property, variant) {
  const n = variant === 'perNight' ? property.pricePerNight ?? property.price : property.price;
  if (n == null || Number.isNaN(Number(n))) return null;
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(n));
  return variant === 'perNight' ? `${formatted}/nt` : formatted;
}

export default function PropertyMap({
  properties = [],
  selectedProperty = null,
  onPropertyClick = null,
  /** 'dot' | 'pricePill' — pricePill shows price (or pricePerNight + /nt when priceMarkerVariant is perNight) */
  markerStyle = 'dot',
  priceMarkerVariant = 'default',
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

    if (!map.current) {
      mapboxgl.accessToken = MAPBOX_TOKEN;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: selectedProperty
          ? [selectedProperty.longitude || -122.4194, selectedProperty.latitude || 37.7749]
          : [-122.4194, 37.7749],
        zoom: selectedProperty ? 14 : 10,
      });

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
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when properties change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for each property
    properties.forEach(property => {
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
          : property.price
            ? `<p><strong>$${Number(property.price).toLocaleString()}</strong></p>`
            : '';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([property.longitude, property.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div class="map-popup">
                <h4>${property.title || 'Untitled Property'}</h4>
                <p>${property.address || ''} ${property.city || ''} ${property.state || ''}</p>
                ${popupPrice}
                ${onPropertyClick ? `<button class="map-popup-btn" data-property-id="${property.id}">View Details</button>` : ''}
              </div>
            `)
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
    if (properties.length > 0 && properties.some(p => p.latitude && p.longitude)) {
      const bounds = new mapboxgl.LngLatBounds();
      properties.forEach(property => {
        if (property.latitude && property.longitude) {
          bounds.extend([property.longitude, property.latitude]);
        }
      });
      
      if (bounds.isEmpty() === false) {
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15,
        });
      }
    }
  }, [properties, mapLoaded, selectedProperty, onPropertyClick, markerStyle, priceMarkerVariant]);

  // Center map on selected property
  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedProperty) return;

    if (selectedProperty.latitude && selectedProperty.longitude) {
      map.current.flyTo({
        center: [selectedProperty.longitude, selectedProperty.latitude],
        zoom: 14,
        duration: 1000,
      });
    }
  }, [selectedProperty, mapLoaded]);

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
