import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

function MapTest() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef({});

  // Dummy sample data
  const sampleProperties = [
    {
      id: '1',
      title: 'Beautiful 3BR House',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      price: 350000,
      latitude: 40.7128,
      longitude: -74.0060,
      bedrooms: 3,
      bathrooms: 2,
      type: 'sale',
    },
    {
      id: '2',
      title: 'Modern Apartment',
      address: '456 Park Ave',
      city: 'New York',
      state: 'NY',
      price: 850000,
      latitude: 40.7580,
      longitude: -73.9855,
      bedrooms: 2,
      bathrooms: 2,
      type: 'sale',
    },
    {
      id: '3',
      title: 'Luxury Condo',
      address: '789 Broadway',
      city: 'New York',
      state: 'NY',
      price: 1200000,
      latitude: 40.7282,
      longitude: -73.9942,
      bedrooms: 3,
      bathrooms: 3,
      type: 'sale',
    },
    {
      id: '4',
      title: 'Cozy Studio',
      address: '321 5th Ave',
      city: 'New York',
      state: 'NY',
      price: 450000,
      latitude: 40.7505,
      longitude: -73.9934,
      bedrooms: 0,
      bathrooms: 1,
      type: 'sale',
    },
    {
      id: '5',
      title: 'Family Home',
      address: '654 Lexington Ave',
      city: 'New York',
      state: 'NY',
      price: 950000,
      latitude: 40.7614,
      longitude: -73.9776,
      bedrooms: 4,
      bathrooms: 3,
      type: 'sale',
    },
  ];

  // Format price for display
  const formatPrice = (price) => {
    if (!price) return 'N/A';
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `$${(price / 1000).toFixed(0)}k`;
    }
    return `$${price.toLocaleString()}`;
  };

  // Initialize map
  useEffect(() => {
    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    
    if (!mapboxToken) {
      console.warn('VITE_MAPBOX_ACCESS_TOKEN not set. Map will not be displayed.');
      return;
    }

    if (map.current) return; // Map already initialized

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-74.0060, 40.7128], // New York
      zoom: 12,
      minZoom: 3,
      maxZoom: 18,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      console.log('Map loaded');
      setMapLoaded(true);
      addMarkers();
    });

    // Cleanup
    return () => {
      console.log('Cleaning up map');
      // Remove all markers
      Object.values(markersRef.current).forEach(marker => {
        try {
          marker.remove();
        } catch (err) {
          console.warn('Error removing marker:', err);
        }
      });
      markersRef.current = {};
      
      // Remove map
      if (map.current) {
        try {
          map.current.remove();
        } catch (err) {
          console.warn('Error removing map:', err);
        }
        map.current = null;
      }
    };
  }, []); // Empty dependency array - only run once

  // Add markers to map
  const addMarkers = () => {
    if (!map.current || !mapLoaded) {
      console.warn('Map not ready for markers');
      return;
    }

    // Wait a bit to ensure map is fully ready
    setTimeout(() => {
      if (!map.current || !map.current.loaded()) {
        console.warn('Map not fully loaded');
        return;
      }

      const container = map.current.getContainer();
      if (!container || !container.parentNode) {
        console.warn('Map container not ready');
        return;
      }

      console.log('Adding markers...');

      // Remove existing markers
      Object.values(markersRef.current).forEach(marker => {
        try {
          marker.remove();
        } catch (err) {
          // Ignore errors
        }
      });
      markersRef.current = {};

      // Add markers for each property
      sampleProperties.forEach(property => {
        try {
          const price = formatPrice(property.price);
          
          // Create custom HTML element for price label
          const el = document.createElement('div');
          el.className = 'property-price-marker';
          el.innerHTML = `<div class="price-label">${price}</div>`;
          el.style.cursor = 'pointer';
          
          const marker = new mapboxgl.Marker({
            element: el,
          })
            .setLngLat([property.longitude, property.latitude])
            .addTo(map.current);

          // Store marker reference
          markersRef.current[property.id] = marker;

          // Add click handler
          el.addEventListener('click', () => {
            alert(`Property: ${property.title}\nPrice: ${price}\nAddress: ${property.address}`);
          });

          console.log(`Added marker for property ${property.id}`);
        } catch (err) {
          console.error(`Error adding marker for property ${property.id}:`, err);
        }
      });

      console.log('All markers added');
    }, 500); // Wait 500ms after map load
  };

  // Re-add markers when map becomes loaded
  useEffect(() => {
    if (mapLoaded && map.current) {
      addMarkers();
    }
  }, [mapLoaded]);

  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        left: '10px', 
        zIndex: 1000,
        backgroundColor: 'white',
        padding: '10px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        <h2 style={{ margin: 0, marginBottom: '10px' }}>Map Test Page</h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
          Status: {mapLoaded ? 'Loaded' : 'Loading...'}
        </p>
        <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#999' }}>
          {sampleProperties.length} properties
        </p>
      </div>

      {mapboxToken ? (
        <div 
          ref={mapContainer} 
          style={{ 
            width: '100%', 
            height: '100%',
          }}
        />
      ) : (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          backgroundColor: '#f5f5f5'
        }}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h2>Mapbox token not configured</h2>
            <p style={{ marginTop: '10px', color: '#666' }}>
              Add <code>VITE_MAPBOX_ACCESS_TOKEN</code> to your .env file
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MapTest;
