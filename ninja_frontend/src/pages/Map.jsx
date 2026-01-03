import { useState } from 'react';
import { geocodeAddress, reverseGeocode, searchLocations } from '../api/mapboxApi';

function Map() {
  const [geocodeResult, setGeocodeResult] = useState(null);
  const [reverseGeocodeResult, setReverseGeocodeResult] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');
  const [reverseGeocodeError, setReverseGeocodeError] = useState('');
  const [searchError, setSearchError] = useState('');
  const [geocodeSuccess, setGeocodeSuccess] = useState('');
  const [reverseGeocodeSuccess, setReverseGeocodeSuccess] = useState('');
  const [searchSuccess, setSearchSuccess] = useState('');

  // Geocode form state
  const [geocodeForm, setGeocodeForm] = useState({
    address: '',
  });

  // Reverse geocode form state
  const [reverseGeocodeForm, setReverseGeocodeForm] = useState({
    latitude: '',
    longitude: '',
  });

  // Search form state
  const [searchForm, setSearchForm] = useState({
    query: '',
    latitude: '',
    longitude: '',
  });

  const handleGeocode = async (e) => {
    e.preventDefault();
    if (!geocodeForm.address.trim()) {
      setGeocodeError('Please enter an address');
      return;
    }

    try {
      setLoading(true);
      setGeocodeError('');
      setGeocodeSuccess('');
      const result = await geocodeAddress(geocodeForm.address);
      
      // Check if the API returned success: false
      if (result && result.success === false) {
        setGeocodeError(result.message || 'Address not found');
        setGeocodeResult(null);
      } else if (result && result.success === true && result.data) {
        setGeocodeResult(result);
        setGeocodeSuccess('Address geocoded successfully!');
      } else if (result && result.data) {
        // Handle case where result has data but no success flag
        setGeocodeResult(result);
        setGeocodeSuccess('Address geocoded successfully!');
      } else {
        setGeocodeError('Invalid response from server');
        setGeocodeResult(null);
      }
    } catch (err) {
      // Handle different error response formats
      let errorMessage = 'Failed to geocode address';
      
      if (err.response?.data) {
        // NestJS error format: { statusCode, message, error }
        if (err.response.data.message) {
          errorMessage = Array.isArray(err.response.data.message) 
            ? err.response.data.message.join(', ')
            : err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setGeocodeError(errorMessage);
      setGeocodeResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReverseGeocode = async (e) => {
    e.preventDefault();
    const lat = parseFloat(reverseGeocodeForm.latitude);
    const lng = parseFloat(reverseGeocodeForm.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      setReverseGeocodeError('Please enter valid latitude and longitude');
      return;
    }

    // Validate latitude range
    if (lat < -90 || lat > 90) {
      setReverseGeocodeError('Latitude must be between -90 and 90');
      return;
    }

    // Validate longitude range
    if (lng < -180 || lng > 180) {
      setReverseGeocodeError('Longitude must be between -180 and 180');
      return;
    }

    try {
      setLoading(true);
      setReverseGeocodeError('');
      setReverseGeocodeSuccess('');
      const result = await reverseGeocode(lat, lng);
      
      // Check if the API returned success: false
      if (result && result.success === false) {
        setReverseGeocodeError(result.message || 'Location not found');
        setReverseGeocodeResult(null);
      } else if (result && result.success === true && result.data) {
        setReverseGeocodeResult(result);
        setReverseGeocodeSuccess('Coordinates reverse geocoded successfully!');
      } else if (result && result.data) {
        // Handle case where result has data but no success flag
        setReverseGeocodeResult(result);
        setReverseGeocodeSuccess('Coordinates reverse geocoded successfully!');
      } else {
        setReverseGeocodeError('Invalid response from server');
        setReverseGeocodeResult(null);
      }
    } catch (err) {
      // Handle different error response formats
      let errorMessage = 'Failed to reverse geocode coordinates';
      
      if (err.response?.data) {
        // NestJS error format: { statusCode, message, error }
        if (err.response.data.message) {
          errorMessage = Array.isArray(err.response.data.message) 
            ? err.response.data.message.join(', ')
            : err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setReverseGeocodeError(errorMessage);
      setReverseGeocodeResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchForm.query.trim()) {
      setSearchError('Please enter a search query');
      return;
    }

    try {
      setLoading(true);
      setSearchError('');
      setSearchSuccess('');
      const lat = searchForm.latitude ? parseFloat(searchForm.latitude) : null;
      const lng = searchForm.longitude ? parseFloat(searchForm.longitude) : null;
      const result = await searchLocations(searchForm.query, lat, lng);
      setSearchResults(Array.isArray(result.data) ? result.data : []);
      setSearchSuccess(`Found ${Array.isArray(result.data) ? result.data.length : 0} location(s)`);
    } catch (err) {
      let errorMessage = 'Failed to search locations';
      if (err.response?.data?.message) {
        errorMessage = Array.isArray(err.response.data.message) 
          ? err.response.data.message.join(', ')
          : err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setSearchError(errorMessage);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setGeocodeResult(null);
    setReverseGeocodeResult(null);
    setSearchResults([]);
    setGeocodeError('');
    setReverseGeocodeError('');
    setSearchError('');
    setGeocodeSuccess('');
    setReverseGeocodeSuccess('');
    setSearchSuccess('');
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Mapbox Integration Test</h1>
        <button onClick={clearResults} className="btn btn-secondary">
          Clear Results
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Geocode Section */}
        <div className="card">
          <h3>Geocode Address</h3>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
            Convert an address to coordinates (latitude, longitude)
          </p>
          {geocodeError && <div className="alert alert-error">{geocodeError}</div>}
          {geocodeSuccess && <div className="alert alert-success">{geocodeSuccess}</div>}
          <form onSubmit={handleGeocode}>
            <div className="form-group">
              <label>Address *</label>
              <input
                type="text"
                value={geocodeForm.address}
                onChange={(e) => setGeocodeForm({ ...geocodeForm, address: e.target.value })}
                placeholder="1600 Pennsylvania Avenue NW, Washington, DC"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Geocoding...' : 'Geocode'}
            </button>
          </form>

          {geocodeResult && (
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
              <h4>Result:</h4>
              <div style={{ marginTop: '10px' }}>
                <div><strong>Latitude:</strong> {geocodeResult.data?.latitude}</div>
                <div><strong>Longitude:</strong> {geocodeResult.data?.longitude}</div>
                <div><strong>Place Name:</strong> {geocodeResult.data?.placeName}</div>
              </div>
            </div>
          )}
        </div>

        {/* Reverse Geocode Section */}
        <div className="card">
          <h3>Reverse Geocode</h3>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
            Convert coordinates to an address
          </p>
          {reverseGeocodeError && <div className="alert alert-error">{reverseGeocodeError}</div>}
          {reverseGeocodeSuccess && <div className="alert alert-success">{reverseGeocodeSuccess}</div>}
          <form onSubmit={handleReverseGeocode}>
            <div className="form-group">
              <label>Latitude *</label>
              <input
                type="number"
                step="any"
                value={reverseGeocodeForm.latitude}
                onChange={(e) => setReverseGeocodeForm({ ...reverseGeocodeForm, latitude: e.target.value })}
                placeholder="38.8977"
                required
              />
            </div>
            <div className="form-group">
              <label>Longitude *</label>
              <input
                type="number"
                step="any"
                value={reverseGeocodeForm.longitude}
                onChange={(e) => setReverseGeocodeForm({ ...reverseGeocodeForm, longitude: e.target.value })}
                placeholder="-77.0365"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Reverse Geocoding...' : 'Reverse Geocode'}
            </button>
          </form>

          {reverseGeocodeResult && (
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
              <h4>Result:</h4>
              <div style={{ marginTop: '10px' }}>
                <div><strong>Address:</strong> {reverseGeocodeResult.data?.address}</div>
                <div><strong>City:</strong> {reverseGeocodeResult.data?.city}</div>
                <div><strong>State:</strong> {reverseGeocodeResult.data?.state}</div>
                <div><strong>ZIP Code:</strong> {reverseGeocodeResult.data?.zipCode}</div>
                <div><strong>Country:</strong> {reverseGeocodeResult.data?.country}</div>
                <div style={{ marginTop: '10px' }}>
                  <strong>Formatted Address:</strong>
                  <div style={{ marginTop: '5px', fontStyle: 'italic' }}>
                    {reverseGeocodeResult.data?.formattedAddress}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Section */}
      <div className="card">
        <h3>Search Locations</h3>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
          Search for locations by name. Optionally provide coordinates for proximity search.
        </p>
        {searchError && <div className="alert alert-error">{searchError}</div>}
        {searchSuccess && <div className="alert alert-success">{searchSuccess}</div>}
        <form onSubmit={handleSearch}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Search Query *</label>
              <input
                type="text"
                value={searchForm.query}
                onChange={(e) => setSearchForm({ ...searchForm, query: e.target.value })}
                placeholder="coffee shop"
                required
              />
            </div>
            <div className="form-group">
              <label>Latitude (optional)</label>
              <input
                type="number"
                step="any"
                value={searchForm.latitude}
                onChange={(e) => setSearchForm({ ...searchForm, latitude: e.target.value })}
                placeholder="40.7128"
              />
            </div>
            <div className="form-group">
              <label>Longitude (optional)</label>
              <input
                type="number"
                step="any"
                value={searchForm.longitude}
                onChange={(e) => setSearchForm({ ...searchForm, longitude: e.target.value })}
                placeholder="-74.0060"
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h4>Search Results ({searchResults.length}):</h4>
            <div style={{ marginTop: '15px', display: 'grid', gap: '10px' }}>
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  style={{
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '5px',
                    border: '1px solid #ddd',
                  }}
                >
                  <div><strong>Name:</strong> {result.name}</div>
                  <div><strong>Place Name:</strong> {result.placeName}</div>
                  <div>
                    <strong>Coordinates:</strong> {result.latitude}, {result.longitude}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Map;
