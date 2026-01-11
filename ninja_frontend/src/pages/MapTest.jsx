import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { geocodeAddress } from '../api/mapboxApi';

function MapTest() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [properties, setProperties] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [previewProperty, setPreviewProperty] = useState(null);
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

  // Initialize with sample data
  useEffect(() => {
    if (properties.length === 0) {
      setProperties(sampleProperties);
    }
  }, []);

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
      // Wait a bit before adding markers
      setTimeout(() => {
        addMarkers();
      }, 300);
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
      const propsToDisplay = properties.length > 0 ? properties : sampleProperties;
      propsToDisplay.forEach((property, index) => {
        try {
          const price = formatPrice(property.price);
          const isFirst = index === 0;
          
          // Create custom HTML element for price label
          const el = document.createElement('div');
          el.className = 'property-price-marker';
          el.innerHTML = `<div class="price-label ${isFirst ? 'focus-blink' : ''}">${price}</div>`;
          el.style.cursor = 'pointer';
          
          // Add special styling for first property
          if (isFirst) {
            el.style.zIndex = '1000';
          }
          
          const marker = new mapboxgl.Marker({
            element: el,
          })
            .setLngLat([property.longitude, property.latitude])
            .addTo(map.current);

          // Store marker reference
          markersRef.current[property.id] = marker;

          // Add click handler
          el.addEventListener('click', () => {
            setPreviewProperty(property);
          });

          console.log(`Added marker for property ${property.id}${isFirst ? ' (FOCUSED)' : ''}`);
        } catch (err) {
          console.error(`Error adding marker for property ${property.id}:`, err);
        }
      });

      console.log('All markers added');
    }, 500); // Wait 500ms after map load
  };

  // Re-add markers when map becomes loaded or properties change
  useEffect(() => {
    if (mapLoaded && map.current) {
      addMarkers();
    }
  }, [mapLoaded, properties]);

  // Handle property search
  const handleSearch = async (e) => {
    e.preventDefault();
    const query = searchInput.trim();
    
    if (!query) {
      // Reset to sample properties
      setProperties(sampleProperties);
      if (map.current) {
        map.current.easeTo({
          center: [-74.0060, 40.7128], // New York
          zoom: 12,
          duration: 1000,
        });
      }
      return;
    }

    setSearching(true);
    try {
      // Search properties directly using the API with search parameter
      const searchResults = await getProperties({ search: query });
      
      if (searchResults && searchResults.length > 0) {
        setProperties(searchResults);
        
        // Zoom to first property with coordinates
        const firstWithCoords = searchResults.find(p => p.latitude && p.longitude);
        if (map.current && firstWithCoords) {
          map.current.easeTo({
            center: [firstWithCoords.longitude, firstWithCoords.latitude],
            zoom: 13,
            duration: 1000,
          });
        } else if (map.current) {
          // If no coordinates, try to fit bounds of all properties
          const propsWithCoords = searchResults.filter(p => p.latitude && p.longitude);
          if (propsWithCoords.length > 0) {
            const bounds = new mapboxgl.LngLatBounds();
            propsWithCoords.forEach(prop => {
              bounds.extend([prop.longitude, prop.latitude]);
            });
            map.current.fitBounds(bounds, { padding: 50, duration: 1000 });
          }
        }
      } else {
        // Fallback to local search if API returns no results
        const textMatches = sampleProperties.filter(prop => {
          const searchLower = query.toLowerCase();
          return (
            (prop.address && prop.address.toLowerCase().includes(searchLower)) ||
            (prop.city && prop.city.toLowerCase().includes(searchLower)) ||
            (prop.state && prop.state.toLowerCase().includes(searchLower)) ||
            (prop.title && prop.title.toLowerCase().includes(searchLower))
          );
        });
        
        if (textMatches.length > 0) {
          setProperties(textMatches);
          // Zoom to first match
          if (map.current && textMatches[0].latitude && textMatches[0].longitude) {
            map.current.easeTo({
              center: [textMatches[0].longitude, textMatches[0].latitude],
              zoom: 13,
              duration: 1000,
            });
          }
        } else {
          alert('No properties found matching your search.');
          setProperties([]);
        }
      }
    } catch (err) {
      console.error('Search error:', err);
      // Fallback to local search on error
      const textMatches = sampleProperties.filter(prop => {
        const searchLower = query.toLowerCase();
        return (
          (prop.address && prop.address.toLowerCase().includes(searchLower)) ||
          (prop.city && prop.city.toLowerCase().includes(searchLower)) ||
          (prop.state && prop.state.toLowerCase().includes(searchLower)) ||
          (prop.title && prop.title.toLowerCase().includes(searchLower))
        );
      });
      
      if (textMatches.length > 0) {
        setProperties(textMatches);
      } else {
        alert('Failed to search. Please try again.');
      }
    } finally {
      setSearching(false);
    }
  };

  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Search Bar */}
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        left: '10px', 
        right: '10px',
        zIndex: 1000,
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        maxWidth: '500px'
      }}>
        <h2 style={{ margin: 0, marginBottom: '15px', fontSize: '20px' }}>Map Test Page</h2>
        
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by address, city, or property name..."
            style={{ 
              flex: 1, 
              padding: '10px 15px', 
              borderRadius: '4px', 
              border: '1px solid #ddd',
              fontSize: '14px'
            }}
          />
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={searching}
            style={{ whiteSpace: 'nowrap', minWidth: '100px' }}
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>

        <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#666' }}>
          <span>Status: {mapLoaded ? 'Loaded' : 'Loading...'}</span>
          <span>{properties.length} properties</span>
        </div>
      </div>

      {/* Property Preview Card - Fixed position bottom-left */}
      {previewProperty && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          maxWidth: '400px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          padding: '20px',
          zIndex: 1000,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, marginBottom: '5px', fontSize: '18px' }}>
                {previewProperty.title || previewProperty.address || 'Property'}
              </h3>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                {previewProperty.address && (
                  <div>{previewProperty.address}</div>
                )}
                {(previewProperty.city || previewProperty.state) && (
                  <div>
                    {[previewProperty.city, previewProperty.state, previewProperty.zipCode]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setPreviewProperty(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#666',
                padding: '0',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '20px', 
            marginBottom: '15px',
            paddingBottom: '15px',
            borderBottom: '1px solid #e0e0e0'
          }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
                {formatPrice(previewProperty.price)}
              </div>
              <div style={{ fontSize: '12px', color: '#666', textTransform: 'capitalize' }}>
                {previewProperty.type || 'N/A'}
              </div>
            </div>
            {(previewProperty.bedrooms || previewProperty.bathrooms) && (
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                {previewProperty.bedrooms && (
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{previewProperty.bedrooms}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Beds</div>
                  </div>
                )}
                {previewProperty.bathrooms && (
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{previewProperty.bathrooms}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Baths</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

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
