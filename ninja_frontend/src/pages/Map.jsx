import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getProperties, getProperty } from '../api/propertiesApi';
import { geocodeAddress } from '../api/mapboxApi';

function Map() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [previewProperty, setPreviewProperty] = useState(null);
  
  // Initialize filters from URL params or defaults
  const initialType = searchParams.get('type') || '';
  const initialStatus = searchParams.get('status') || 'published';
  const initialSearch = searchParams.get('search') || '';
  const [filters, setFilters] = useState({ type: initialType, status: initialStatus });
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [searching, setSearching] = useState(false);
  const [highlightedPropertyId, setHighlightedPropertyId] = useState(null);
  const markersRef = useRef({});
  const highlightedMarkerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const handlersSetupRef = useRef(false);

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

  // Update map markers with clustering
  const updateMapMarkers = useCallback((props) => {
    if (!map.current || !mapLoaded) {
      console.warn('Map not ready for markers');
      return;
    }
    
    // Check if container exists (less strict - don't require parentNode)
    const mapContainerEl = map.current.getContainer();
    if (!mapContainerEl) {
      console.warn('Map container not available');
      return;
    }

    // Remove existing markers first
    Object.values(markersRef.current).forEach(marker => {
      try {
        marker.remove();
      } catch (err) {
        // Ignore errors if marker already removed
      }
    });
    markersRef.current = {};
    
    // If no properties, clear everything and return
    if (!props || props.length === 0) {
      console.log('No properties to display, clearing markers');
      return;
    }

    // Remove existing source and layer if they exist
    try {
      const existingSource = map.current.getSource('properties');
      if (existingSource) {
        if (map.current.getLayer('clusters')) {
          map.current.removeLayer('clusters');
        }
        if (map.current.getLayer('cluster-count')) {
          map.current.removeLayer('cluster-count');
        }
        if (map.current.getLayer('unclustered-point')) {
          map.current.removeLayer('unclustered-point');
        }
        map.current.removeSource('properties');
      }
    } catch (err) {
      console.warn('Error removing existing source/layers:', err);
      // Continue anyway - might not exist yet
    }

    // Create GeoJSON from properties
    // Convert string coordinates to numbers if needed
    const geojson = {
      type: 'FeatureCollection',
      features: props.map(property => {
        const lat = typeof property.latitude === 'string' ? parseFloat(property.latitude) : property.latitude;
        const lng = typeof property.longitude === 'string' ? parseFloat(property.longitude) : property.longitude;
        
        // Skip if coordinates are invalid
        if (isNaN(lat) || isNaN(lng)) {
          return null;
        }
        
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          properties: {
            id: property.id,
            price: typeof property.price === 'string' ? parseFloat(property.price) : property.price,
            priceFormatted: formatPrice(property.price),
            title: property.title,
            address: property.address,
            city: property.city,
            state: property.state,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            type: property.type,
          },
        };
      }).filter(f => f !== null), // Remove null entries
    };

    // Add source (only if we have valid features)
    if (geojson.features.length === 0) {
      console.warn('No valid properties with coordinates to display');
      return;
    }

    try {
      map.current.addSource('properties', {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });
    } catch (err) {
      console.error('Error adding source to map:', err);
      return;
    }

    // Add cluster circles
    try {
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'properties',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#007bff',
            10,
            '#28a745',
            30,
            '#ffc107',
            100,
            '#dc3545',
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            10,
            30,
            30,
            40,
            100,
            50,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });

      // Add cluster count labels (using simple number formatting)
      // Note: Some Mapbox styles don't support text-field, so we'll use a simpler approach
      // The cluster circles will show the count via their size and color
      // For better compatibility, we'll skip text labels on clusters for now
      // Users can click clusters to zoom in and see individual properties

      // Add unclustered points as invisible circles (for click detection)
      map.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'properties',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': 15,
          'circle-opacity': 0,
        },
      });
    } catch (err) {
      console.error('Error adding layers to map:', err);
      return;
    }

    // Create custom price label markers for unclustered points
    // Use the props data directly instead of accessing internal Mapbox properties
    // Filter and convert coordinates to numbers
    const unclusteredProps = props.filter(p => {
      if (!p.latitude || !p.longitude) return false;
      const lat = typeof p.latitude === 'string' ? parseFloat(p.latitude) : p.latitude;
      const lng = typeof p.longitude === 'string' ? parseFloat(p.longitude) : p.longitude;
      return !isNaN(lat) && !isNaN(lng);
    });
    
    // Remove old markers that are no longer in the data
    const currentPropertyIds = new Set(unclusteredProps.map(p => p.id));
    Object.keys(markersRef.current).forEach(markerId => {
      if (!currentPropertyIds.has(markerId)) {
        markersRef.current[markerId].remove();
        delete markersRef.current[markerId];
      }
    });

    // Add/update markers for current properties
    // Only add markers if map container is ready and map is loaded
    if (!mapContainer.current || !map.current) {
      console.warn('Map container or map not ready for markers');
      return;
    }
    
    // Ensure map container DOM element exists and is attached to DOM
    const mapContainerElement = map.current.getContainer();
    if (!mapContainerElement || !mapContainerElement.parentNode) {
      console.warn('Map container DOM element not available or not attached');
      return;
    }
    
    // Double-check that the map is actually loaded
    if (!mapLoaded) {
      console.warn('Map not loaded yet');
      return;
    }

    unclusteredProps.forEach(property => {
      const markerId = property.id;
      const price = formatPrice(property.price);
      
      // Convert coordinates to numbers
      const lat = typeof property.latitude === 'string' ? parseFloat(property.latitude) : property.latitude;
      const lng = typeof property.longitude === 'string' ? parseFloat(property.longitude) : property.longitude;
      
      // Skip if coordinates are invalid
      if (isNaN(lat) || isNaN(lng)) {
        return;
      }
      
      // Remove existing marker if it exists
      if (markersRef.current[markerId]) {
        try {
          markersRef.current[markerId].remove();
        } catch (err) {
          // Marker might already be removed
        }
      }
      
      // Create custom HTML element for price label
      const el = document.createElement('div');
      el.className = 'property-price-marker';
      const isHighlighted = highlightedPropertyId === property.id;
      el.innerHTML = `<div class="price-label ${isHighlighted ? 'highlighted' : ''}">${price}</div>`;
      el.style.cursor = 'pointer';
      
      // Add special styling for highlighted property
      if (isHighlighted) {
        el.style.zIndex = '1000';
        el.style.animation = 'pulse 2s infinite';
      }
      
      try {
        // Ensure map container exists and is fully initialized
        if (!map.current) {
          console.warn('Map instance not available for marker');
          return;
        }
        
        const mapContainerEl = map.current.getContainer();
        if (!mapContainerEl) {
          console.warn('Map container not available for marker');
          return;
        }

        const marker = new mapboxgl.Marker({
          element: el,
        })
          .setLngLat([lng, lat])
          .addTo(map.current);

        // Store marker reference
        markersRef.current[markerId] = marker;
        
        // Store highlighted marker reference
        if (isHighlighted) {
          highlightedMarkerRef.current = marker;
        }

        // Add click handler
        el.addEventListener('click', async () => {
          try {
            const fullProperty = await getProperty(property.id);
            setPreviewProperty(fullProperty);
            setSelectedProperty(fullProperty);
          } catch (err) {
            console.error('Failed to load property details:', err);
            setPreviewProperty({
              id: property.id,
              title: property.title,
              price: property.price,
              address: property.address,
              city: property.city,
              state: property.state,
              bedrooms: property.bedrooms,
              bathrooms: property.bathrooms,
              type: property.type,
            });
          }
        });
      } catch (err) {
        console.error('Error adding marker:', err, property.id);
      }
    });
  }, [mapLoaded, highlightedPropertyId]);

  // Load properties based on current viewport
  const loadPropertiesForViewport = useCallback(async () => {
    if (!map.current) {
      console.warn('Map instance not available');
      return;
    }
    
    if (!mapLoaded) {
      console.warn('Map not loaded yet, will retry');
      // Retry after a short delay
      setTimeout(() => {
        if (map.current && mapLoaded) {
          loadPropertiesForViewport();
        }
      }, 500);
      return;
    }
    
    // Ensure map container is ready (less strict check)
    const container = map.current.getContainer();
    if (!container) {
      console.warn('Map container not available');
      return;
    }

    try {
      setLoading(true);
      const bounds = map.current.getBounds();
      const bbox = {
        west: bounds.getWest(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        north: bounds.getNorth(),
      };

      const options = {
        bbox,
      };
      
      // Add filters only if they have values
      if (filters.type) {
        options.type = filters.type;
      }
      if (filters.status) {
        options.status = filters.status;
      }
      
      console.log('Loading properties with options:', options);

      const data = await getProperties(options);
      // Filter properties with valid coordinates (handle both string and number types)
      const propertiesWithCoords = data.filter(p => {
        if (!p.latitude || !p.longitude) return false;
        const lat = typeof p.latitude === 'string' ? parseFloat(p.latitude) : p.latitude;
        const lng = typeof p.longitude === 'string' ? parseFloat(p.longitude) : p.longitude;
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
      });
      setProperties(propertiesWithCoords);
      
      // Always update markers (even if empty array to clear them)
      // Use a small delay to ensure map is ready
      setTimeout(() => {
        if (map.current && map.current.getContainer()) {
          updateMapMarkers(propertiesWithCoords);
        } else {
          // Retry if not ready
          setTimeout(() => {
            if (map.current && map.current.getContainer()) {
              updateMapMarkers(propertiesWithCoords);
            }
          }, 300);
        }
      }, 100);
    } catch (err) {
      console.error('Failed to load properties:', err);
      console.error('Error details:', err.message, err.stack);
    } finally {
      setLoading(false);
    }
  }, [mapLoaded, filters]); // Remove updateMapMarkers from dependencies to avoid re-creation

  // Initialize map
  useEffect(() => {
    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    
    if (!mapboxToken) {
      console.warn('VITE_MAPBOX_ACCESS_TOKEN not set. Map will not be displayed.');
      return;
    }

    if (map.current) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11', // Clean, light style like Zillow
      center: [-98.5795, 39.8283], // Center of USA
      zoom: 4, // City-level view
      minZoom: 3,
      maxZoom: 18,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Set up event handlers (only once)
    const setupMapEventHandlers = () => {
      if (handlersSetupRef.current) return;
      handlersSetupRef.current = true;

      // Click on clusters to zoom in
      map.current.on('click', 'clusters', (e) => {
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: ['clusters'],
        });
        if (features.length === 0) return;
        
        const clusterId = features[0].properties.cluster_id;
        const source = map.current.getSource('properties');
        
        // Check if source exists and has the method
        if (!source || typeof source.getClusterExpansionZoom !== 'function') {
          console.warn('Source not available or method not found');
          return;
        }
        
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) {
            console.error('Error getting cluster expansion zoom:', err);
            return;
          }
          
          map.current.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom,
            duration: 500,
          });
        });
      });

      // Click on unclustered points to show property preview
      map.current.on('click', 'unclustered-point', async (e) => {
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: ['unclustered-point'],
        });
        if (features.length === 0) return;
        
        const propertyData = features[0].properties;
        
        // Fetch full property details
        try {
          const property = await getProperty(propertyData.id);
          setPreviewProperty(property);
          setSelectedProperty(property);
        } catch (err) {
          console.error('Failed to load property details:', err);
          setPreviewProperty({
            id: propertyData.id,
            title: propertyData.title,
            price: propertyData.price,
            address: propertyData.address,
            city: propertyData.city,
            state: propertyData.state,
            bedrooms: propertyData.bedrooms,
            bathrooms: propertyData.bathrooms,
            type: propertyData.type,
          });
        }
      });

      // Change cursor on hover
      map.current.on('mouseenter', 'clusters', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'clusters', () => {
        map.current.getCanvas().style.cursor = '';
      });

      map.current.on('mouseenter', 'unclustered-point', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'unclustered-point', () => {
        map.current.getCanvas().style.cursor = '';
      });
    };

    map.current.on('load', () => {
      console.log('Map loaded');
      setMapLoaded(true);
      setupMapEventHandlers();
      
      // Load properties when map moves/zooms (debounced)
      map.current.on('moveend', () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          if (map.current && mapLoaded) {
            loadPropertiesForViewport();
          }
        }, 300);
      });

      map.current.on('zoomend', () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          if (map.current && mapLoaded) {
            loadPropertiesForViewport();
          }
        }, 300);
      });
      
      // Load initial properties after map is loaded
      setTimeout(() => {
        if (map.current && mapLoaded) {
          loadPropertiesForViewport();
        }
      }, 500);
    });

    // Cleanup function
    return () => {
      console.log('Cleaning up map');
      
      // Clear debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
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
      
      handlersSetupRef.current = false;
    };
  }, []); // Empty dependency array - only run once on mount

  // Load properties when filters change (map load is handled in map.on('load'))
  useEffect(() => {
    if (mapLoaded && map.current) {
      console.log('Filters changed, reloading properties:', filters);
      // Clear existing markers immediately when filters change
      Object.values(markersRef.current).forEach(marker => {
        try {
          marker.remove();
        } catch (err) {
          // Ignore errors
        }
      });
      markersRef.current = {};
      
      // Small delay to ensure map is fully ready
      const timer = setTimeout(() => {
        if (map.current && mapLoaded) {
          loadPropertiesForViewport();
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [filters, mapLoaded, loadPropertiesForViewport]); // Include dependencies to ensure it works

  // Handle property highlighting when propertyId is in URL
  useEffect(() => {
    const propertyId = searchParams.get('propertyId');
    setHighlightedPropertyId(propertyId || null);
  }, [searchParams]);

  // Sync search input with URL parameter
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    setSearchQuery(urlSearch);
    setSearchInput(urlSearch);
  }, [searchParams]);

  // Zoom to and highlight specific property
  useEffect(() => {
    if (!highlightedPropertyId || !mapLoaded || !map.current) return;

    const zoomToProperty = async () => {
      try {
        // Fetch the property details
        const property = await getProperty(highlightedPropertyId);
        
        if (!property || !property.latitude || !property.longitude) {
          console.warn('Property not found or missing coordinates');
          return;
        }

        const lat = typeof property.latitude === 'string' ? parseFloat(property.latitude) : property.latitude;
        const lng = typeof property.longitude === 'string' ? parseFloat(property.longitude) : property.longitude;

        if (isNaN(lat) || isNaN(lng)) {
          console.warn('Invalid coordinates for property');
          return;
        }

        // Wait a bit for markers to be rendered
        setTimeout(() => {
          if (!map.current) return;

          // Zoom to property location
          map.current.easeTo({
            center: [lng, lat],
            zoom: 15,
            duration: 1500,
          });

          // Show property preview
          setPreviewProperty(property);
          setSelectedProperty(property);

          // Highlight the marker after a short delay to ensure it's rendered
          setTimeout(() => {
            const marker = markersRef.current[highlightedPropertyId];
            if (marker) {
              // Add a pulsing effect by toggling a class
              const markerEl = marker.getElement();
              if (markerEl) {
                markerEl.style.transform = 'scale(1.3)';
                markerEl.style.transition = 'transform 0.3s ease';
                markerEl.style.zIndex = '1000';
                
                // Reset after animation
                setTimeout(() => {
                  markerEl.style.transform = 'scale(1.1)';
                }, 500);
              }
            }
          }, 1600);
        }, 500);
      } catch (err) {
        console.error('Failed to load property for highlighting:', err);
      }
    };

    zoomToProperty();
  }, [highlightedPropertyId, mapLoaded]);

  const handleViewDetails = () => {
    if (selectedProperty) {
      window.location.href = `/properties?view=${selectedProperty.id}`;
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const query = searchInput.trim();
    
    if (!query) {
      // Clear search
      setSearchQuery('');
      setSearchInput('');
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('search');
      setSearchParams(newParams);
      return;
    }

    setSearching(true);
    try {
      // Geocode the address
      const result = await geocodeAddress(query);
      
      if (result && result.latitude && result.longitude) {
        const lat = parseFloat(result.latitude);
        const lng = parseFloat(result.longitude);
        
        // Update search query
        setSearchQuery(query);
        const newParams = new URLSearchParams(searchParams);
        newParams.set('search', query);
        setSearchParams(newParams);
        
        // Zoom to the location
        if (map.current) {
          map.current.easeTo({
            center: [lng, lat],
            zoom: 12,
            duration: 1000,
          });
        }
      } else {
        alert('Location not found. Please try a different search term.');
      }
    } catch (err) {
      console.error('Search error:', err);
      alert('Failed to search location. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  return (
    <div className="container" style={{ padding: 0, maxWidth: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header with filters */}
      <div style={{ 
        padding: '15px 20px', 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e0e0e0',
        flexShrink: 0
      }}>
        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by location, address, city..."
            style={{ 
              flex: 1, 
              padding: '10px 15px', 
              borderRadius: '4px', 
              border: '1px solid #ddd',
              fontSize: '14px',
              maxWidth: '400px'
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
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearchQuery('');
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('search');
                setSearchParams(newParams);
              }}
              className="btn btn-secondary"
              style={{ whiteSpace: 'nowrap' }}
            >
              Clear
            </button>
          )}
        </form>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '24px' }}>Property Map</h1>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <select
              value={filters.type}
              onChange={(e) => {
                const newType = e.target.value;
                setFilters({ ...filters, type: newType });
                // Update URL params
                const newParams = new URLSearchParams(searchParams);
                if (newType) {
                  newParams.set('type', newType);
                } else {
                  newParams.delete('type');
                }
                setSearchParams(newParams);
              }}
              style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="">All Types</option>
              <option value="sale">For Sale</option>
              <option value="rent">For Rent</option>
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <select
              value={filters.status}
              onChange={(e) => {
                const newStatus = e.target.value;
                setFilters({ ...filters, status: newStatus });
                // Update URL params
                const newParams = new URLSearchParams(searchParams);
                if (newStatus) {
                  newParams.set('status', newStatus);
                } else {
                  newParams.delete('status');
                }
                setSearchParams(newParams);
              }}
              style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="">All Statuses</option>
            </select>
          </div>
          {loading && (
            <div style={{ fontSize: '14px', color: '#666' }}>Loading properties...</div>
          )}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {mapboxToken ? (
          <>
            <div 
              ref={mapContainer} 
              style={{ 
                width: '100%', 
                height: '100%',
              }}
            />
            {!mapLoaded && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                padding: '15px 25px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                zIndex: 1000
              }}>
                Loading map...
              </div>
            )}
          </>
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

        {/* Property Preview Card */}
        {previewProperty && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            right: '20px',
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

            <button
              onClick={handleViewDetails}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              View Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Map;
