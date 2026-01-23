import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './PropertyMap.css';

// You'll need to set VITE_MAPBOX_TOKEN in your .env file
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

export default function PropertyMap({ properties = [], selectedProperty = null, onPropertyClick = null }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) {
      console.warn('Mapbox token not found. Set VITE_MAPBOX_TOKEN in your .env file');
      return;
    }

    // Initialize map
    if (!map.current) {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: selectedProperty 
          ? [selectedProperty.longitude || -122.4194, selectedProperty.latitude || 37.7749]
          : [-122.4194, 37.7749], // Default to San Francisco
        zoom: selectedProperty ? 14 : 10,
      });

      map.current.on('load', () => {
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
      el.className = 'property-marker';
      if (selectedProperty && selectedProperty.id === property.id) {
        el.className += ' property-marker-selected';
      }

      const marker = new mapboxgl.Marker(el)
        .setLngLat([property.longitude, property.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div class="map-popup">
                <h4>${property.title || 'Untitled Property'}</h4>
                <p>${property.address || ''} ${property.city || ''} ${property.state || ''}</p>
                ${property.price ? `<p><strong>$${property.price.toLocaleString()}</strong></p>` : ''}
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
  }, [properties, mapLoaded, selectedProperty, onPropertyClick]);

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

  if (!MAPBOX_TOKEN) {
    return (
      <div className="property-map-container property-map-error">
        <p>Mapbox token not configured. Please set VITE_MAPBOX_TOKEN in your .env file.</p>
      </div>
    );
  }

  return (
    <div className="property-map-container">
      <div ref={mapContainer} className="property-map" />
    </div>
  );
}
