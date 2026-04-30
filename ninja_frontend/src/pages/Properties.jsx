import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

function Properties() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [propertyMedia, setPropertyMedia] = useState([]);
  const [filters, setFilters] = useState({ type: '', status: '' });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    price: '',
    type: 'sale',
    status: 'draft',
    bedrooms: '',
    bathrooms: '',
    squareFeet: '',
    lotSize: '',
    yearBuilt: '',
    latitude: '',
    longitude: '',
  });
  const [mediaForm, setMediaForm] = useState({
    url: '',
    type: 'image',
    isPrimary: false,
  });

  useEffect(() => {
    fetchProperties();
  }, [filters]);

  useEffect(() => {
    if (selectedProperty) {
      fetchPropertyDetails(selectedProperty.id);
      fetchPropertyMedia(selectedProperty.id);
    }
  }, [selectedProperty]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      const response = await apiClient.get('/properties', { params });
      setProperties(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const fetchPropertyDetails = async (id) => {
    try {
      const response = await apiClient.get(`/properties/${id}`);
      setSelectedProperty(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load property details');
    }
  };

  const fetchPropertyMedia = async (propertyId) => {
    try {
      const response = await apiClient.get(`/properties/${propertyId}/media`);
      setPropertyMedia(response.data || []);
    } catch (err) {
      console.error('Failed to fetch media:', err);
      setPropertyMedia([]);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      price: '',
      type: 'sale',
      status: 'draft',
      bedrooms: '',
      bathrooms: '',
      squareFeet: '',
      lotSize: '',
      yearBuilt: '',
      latitude: '',
      longitude: '',
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      const payload = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : undefined,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : undefined,
        squareFeet: formData.squareFeet ? parseInt(formData.squareFeet) : undefined,
        lotSize: formData.lotSize ? parseFloat(formData.lotSize) : undefined,
        yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      };
      await apiClient.post('/properties', payload);
      setSuccess('Property created successfully!');
      setShowForm(false);
      resetForm();
      await fetchProperties();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create property');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      const payload = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : undefined,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : undefined,
        squareFeet: formData.squareFeet ? parseInt(formData.squareFeet) : undefined,
        lotSize: formData.lotSize ? parseFloat(formData.lotSize) : undefined,
        yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      };
      // Remove empty strings
      Object.keys(payload).forEach(key => {
        if (payload[key] === '') {
          delete payload[key];
        }
      });
      await apiClient.put(`/properties/${editingProperty.id}`, payload);
      setSuccess('Property updated successfully!');
      setEditingProperty(null);
      resetForm();
      await fetchProperties();
      if (selectedProperty && selectedProperty.id === editingProperty.id) {
        await fetchPropertyDetails(editingProperty.id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update property');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return;
    }
    try {
      setError('');
      setSuccess('');
      await apiClient.delete(`/properties/${id}`);
      setSuccess('Property deleted successfully!');
      await fetchProperties();
      if (selectedProperty && selectedProperty.id === id) {
        setSelectedProperty(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete property');
    }
  };

  const handlePublish = async (id) => {
    try {
      setError('');
      setSuccess('');
      await apiClient.post(`/properties/${id}/publish`);
      setSuccess('Property published successfully!');
      await fetchProperties();
      if (selectedProperty && selectedProperty.id === id) {
        await fetchPropertyDetails(id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish property');
    }
  };

  const handleEdit = (property) => {
    setEditingProperty(property);
    setFormData({
      title: property.title || '',
      description: property.description || '',
      address: property.address || '',
      city: property.city || '',
      state: property.state || '',
      zipCode: property.zipCode || '',
      price: property.price || '',
      type: property.type || 'sale',
      status: property.status || 'draft',
      bedrooms: property.bedrooms || '',
      bathrooms: property.bathrooms || '',
      squareFeet: property.squareFeet || '',
      lotSize: property.lotSize || '',
      yearBuilt: property.yearBuilt || '',
      latitude: property.latitude || '',
      longitude: property.longitude || '',
    });
    setShowForm(false);
    setSelectedProperty(null);
  };

  const handleViewDetails = async (property) => {
    setSelectedProperty(property);
    setEditingProperty(null);
    setShowForm(false);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProperty(null);
    resetForm();
    setSelectedProperty(null);
  };

  const handleAddMedia = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      await apiClient.post(`/properties/${selectedProperty.id}/media`, mediaForm);
      setSuccess('Media added successfully!');
      setMediaForm({ url: '', type: 'image', isPrimary: false });
      await fetchPropertyMedia(selectedProperty.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add media');
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    if (!window.confirm('Are you sure you want to delete this media?')) {
      return;
    }
    try {
      setError('');
      setSuccess('');
      await apiClient.delete(`/properties/${selectedProperty.id}/media/${mediaId}`);
      setSuccess('Media deleted successfully!');
      await fetchPropertyMedia(selectedProperty.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete media');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: { bg: '#f8d7da', color: '#721c24' },
      published: { bg: '#d4edda', color: '#155724' },
      sold: { bg: '#d1ecf1', color: '#0c5460' },
      rented: { bg: '#fff3cd', color: '#856404' },
      archived: { bg: '#e2e3e5', color: '#383d41' },
    };
    return colors[status] || colors.draft;
  };

  if (loading && properties.length === 0) {
    return <div className="container">Loading...</div>;
  }

  const handleBuyClick = () => {
    navigate('/map?type=sale');
  };

  const handleRentClick = () => {
    navigate('/map?type=rent');
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 style={{ margin: 0 }}>Properties</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {!showForm && !editingProperty && (
            <>
              <button onClick={handleBuyClick} className="btn btn-primary" style={{ backgroundColor: '#007bff', borderColor: '#007bff' }}>
                Buy
              </button>
              <button onClick={handleRentClick} className="btn btn-primary" style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}>
                Rent
              </button>
              <button onClick={() => setShowForm(true)} className="btn btn-primary">
                Create Property
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Filters */}
      {!showForm && !editingProperty && !selectedProperty && (
        <div className="card" style={{ marginBottom: '20px', padding: '15px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Filter by Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="">All Types</option>
                <option value="sale">Sale</option>
                <option value="rent">Rent</option>
              </select>
            </div>
            <div className="form-group">
              <label>Filter by Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="sold">Sold</option>
                <option value="rented">Rented</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>Create New Property</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="e.g., Beautiful 3BR House"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
                placeholder="Property description..."
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="New York"
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="NY"
                />
              </div>
              <div className="form-group">
                <label>ZIP Code</label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="10001"
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="350000"
                />
              </div>
              <div className="form-group">
                <label>Property Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="sale">Sale</option>
                  <option value="rent">Rent</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Bedrooms</label>
                <input
                  type="number"
                  min="0"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                  placeholder="3"
                />
              </div>
              <div className="form-group">
                <label>Bathrooms</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                  placeholder="2"
                />
              </div>
              <div className="form-group">
                <label>Square Feet</label>
                <input
                  type="number"
                  min="0"
                  value={formData.squareFeet}
                  onChange={(e) => setFormData({ ...formData, squareFeet: e.target.value })}
                  placeholder="1500"
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Lot Size (sq ft)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.lotSize}
                  onChange={(e) => setFormData({ ...formData, lotSize: e.target.value })}
                  placeholder="5000"
                />
              </div>
              <div className="form-group">
                <label>Year Built</label>
                <input
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  value={formData.yearBuilt}
                  onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
                  placeholder="2020"
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="sold">Sold</option>
                  <option value="rented">Rented</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="40.7128"
                />
              </div>
              <div className="form-group">
                <label>Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="-74.0060"
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">
                Create Property
              </button>
              <button type="button" onClick={handleCancel} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Form */}
      {editingProperty && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>Edit Property: {editingProperty.title || editingProperty.address}</h3>
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>ZIP Code</label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Property Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="sale">Sale</option>
                  <option value="rent">Rent</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Bedrooms</label>
                <input
                  type="number"
                  min="0"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Bathrooms</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Square Feet</label>
                <input
                  type="number"
                  min="0"
                  value={formData.squareFeet}
                  onChange={(e) => setFormData({ ...formData, squareFeet: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Lot Size (sq ft)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.lotSize}
                  onChange={(e) => setFormData({ ...formData, lotSize: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Year Built</label>
                <input
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  value={formData.yearBuilt}
                  onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="sold">Sold</option>
                  <option value="rented">Rented</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">
                Update Property
              </button>
              <button type="button" onClick={handleCancel} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Property Details View */}
      {selectedProperty && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Property Details: {selectedProperty.title || selectedProperty.address || 'Untitled'}</h3>
            <button onClick={() => setSelectedProperty(null)} className="btn btn-secondary">
              Close
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              <div>
                <strong>Title:</strong> {selectedProperty.title || 'N/A'}
              </div>
              <div>
                <strong>Type:</strong> {selectedProperty.type || 'N/A'}
              </div>
              <div>
                <strong>Status:</strong>
                <span
                  style={{
                    marginLeft: '10px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    ...getStatusColor(selectedProperty.status),
                  }}
                >
                  {selectedProperty.status || 'draft'}
                </span>
              </div>
              <div>
                <strong>Price:</strong> {selectedProperty.price ? `$${selectedProperty.price.toLocaleString()}` : 'N/A'}
              </div>
              <div>
                <strong>Address:</strong> {selectedProperty.address || 'N/A'}
              </div>
              <div>
                <strong>City:</strong> {selectedProperty.city || 'N/A'}
              </div>
              <div>
                <strong>State:</strong> {selectedProperty.state || 'N/A'}
              </div>
              <div>
                <strong>ZIP Code:</strong> {selectedProperty.zipCode || 'N/A'}
              </div>
              <div>
                <strong>Bedrooms:</strong> {selectedProperty.bedrooms || 'N/A'}
              </div>
              <div>
                <strong>Bathrooms:</strong> {selectedProperty.bathrooms || 'N/A'}
              </div>
              <div>
                <strong>Square Feet:</strong> {selectedProperty.squareFeet ? selectedProperty.squareFeet.toLocaleString() : 'N/A'}
              </div>
              <div>
                <strong>Lot Size:</strong> {selectedProperty.lotSize ? `${selectedProperty.lotSize.toLocaleString()} sq ft` : 'N/A'}
              </div>
              <div>
                <strong>Year Built:</strong> {selectedProperty.yearBuilt || 'N/A'}
              </div>
              <div>
                <strong>Created:</strong> {new Date(selectedProperty.createdAt).toLocaleString()}
              </div>
              {selectedProperty.publishedAt && (
                <div>
                  <strong>Published:</strong> {new Date(selectedProperty.publishedAt).toLocaleString()}
                </div>
              )}
            </div>
            {selectedProperty.description && (
              <div style={{ marginTop: '15px' }}>
                <strong>Description:</strong>
                <p style={{ marginTop: '5px', whiteSpace: 'pre-wrap' }}>{selectedProperty.description}</p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {selectedProperty.type === 'sale' && (
              <button
                onClick={() => navigate(`/map?type=sale&propertyId=${selectedProperty.id}`)}
                className="btn"
                style={{ backgroundColor: '#007bff', borderColor: '#007bff', color: 'white' }}
              >
                View on Map (Buy)
              </button>
            )}
            {selectedProperty.type === 'rent' && (
              <button
                onClick={() => navigate(`/map?type=rent&propertyId=${selectedProperty.id}`)}
                className="btn"
                style={{ backgroundColor: '#28a745', borderColor: '#28a745', color: 'white' }}
              >
                View on Map (Rent)
              </button>
            )}
            {!selectedProperty.type && (
              <>
                <button
                  onClick={() => navigate(`/map?type=sale&propertyId=${selectedProperty.id}`)}
                  className="btn"
                  style={{ backgroundColor: '#007bff', borderColor: '#007bff', color: 'white' }}
                >
                  View on Map (Buy)
                </button>
                <button
                  onClick={() => navigate(`/map?type=rent&propertyId=${selectedProperty.id}`)}
                  className="btn"
                  style={{ backgroundColor: '#28a745', borderColor: '#28a745', color: 'white' }}
                >
                  View on Map (Rent)
                </button>
              </>
            )}
            <button
              onClick={() => handleEdit(selectedProperty)}
              className="btn btn-primary"
            >
              Edit Property
            </button>
            {selectedProperty.status !== 'published' && (
              <button
                onClick={() => handlePublish(selectedProperty.id)}
                className="btn btn-success"
              >
                Publish
              </button>
            )}
            <button
              onClick={() => handleDelete(selectedProperty.id)}
              className="btn btn-danger"
            >
              Delete
            </button>
          </div>

          {/* Media Section */}
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <h4>Media</h4>
            {propertyMedia.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
                {propertyMedia.map((media) => (
                  <div key={media.id} style={{ border: '1px solid #ddd', borderRadius: '5px', padding: '10px', position: 'relative' }}>
                    {media.type === 'image' ? (
                      <img
                        src={media.url}
                        alt="Property media"
                        style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px' }}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/200x150?text=Image+Error';
                        }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
                        <span>{media.type}</span>
                      </div>
                    )}
                    <div style={{ marginTop: '10px', fontSize: '12px' }}>
                      <div><strong>Type:</strong> {media.type}</div>
                      {media.isPrimary && <div style={{ color: '#28a745' }}>Primary</div>}
                    </div>
                    <button
                      onClick={() => handleDeleteMedia(media.id)}
                      className="btn btn-sm btn-danger"
                      style={{ marginTop: '10px', width: '100%', fontSize: '12px', padding: '4px 8px' }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ marginTop: '10px', color: '#666' }}>No media added yet.</p>
            )}

            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '5px' }}>
              <h5>Add Media</h5>
              <form onSubmit={handleAddMedia}>
                <div className="form-group">
                  <label>Media URL</label>
                  <input
                    type="url"
                    value={mediaForm.url}
                    onChange={(e) => setMediaForm({ ...mediaForm, url: e.target.value })}
                    required
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>Media Type</label>
                    <select
                      value={mediaForm.type}
                      onChange={(e) => setMediaForm({ ...mediaForm, type: e.target.value })}
                    >
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                      <option value="document">Document</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={mediaForm.isPrimary}
                        onChange={(e) => setMediaForm({ ...mediaForm, isPrimary: e.target.checked })}
                        style={{ marginRight: '5px' }}
                      />
                      Set as Primary
                    </label>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">
                  Add Media
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Properties List */}
      {!showForm && !editingProperty && !selectedProperty && (
        <>
          {properties.length === 0 ? (
            <div className="card">
              <p>No properties found. Create your first property to get started!</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Address</th>
                    <th>City</th>
                    <th>State</th>
                    <th>Price</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Bedrooms</th>
                    <th>Bathrooms</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((property) => (
                    <tr key={property.id}>
                      <td><strong>{property.title || 'Untitled'}</strong></td>
                      <td>{property.address || '-'}</td>
                      <td>{property.city || '-'}</td>
                      <td>{property.state || '-'}</td>
                      <td>{property.price ? `$${property.price.toLocaleString()}` : '-'}</td>
                      <td>{property.type || '-'}</td>
                      <td>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            ...getStatusColor(property.status),
                          }}
                        >
                          {property.status || 'draft'}
                        </span>
                      </td>
                      <td>{property.bedrooms || '-'}</td>
                      <td>{property.bathrooms || '-'}</td>
                      <td>{new Date(property.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          {property.type === 'sale' && (
                            <button
                              onClick={() => navigate(`/map?type=sale&propertyId=${property.id}`)}
                              className="btn btn-sm"
                              style={{ 
                                fontSize: '12px', 
                                padding: '4px 8px',
                                backgroundColor: '#007bff',
                                borderColor: '#007bff',
                                color: 'white'
                              }}
                            >
                              Buy
                            </button>
                          )}
                          {property.type === 'rent' && (
                            <button
                              onClick={() => navigate(`/map?type=rent&propertyId=${property.id}`)}
                              className="btn btn-sm"
                              style={{ 
                                fontSize: '12px', 
                                padding: '4px 8px',
                                backgroundColor: '#28a745',
                                borderColor: '#28a745',
                                color: 'white'
                              }}
                            >
                              Rent
                            </button>
                          )}
                          {!property.type && (
                            <>
                              <button
                                onClick={() => navigate(`/map?type=sale&propertyId=${property.id}`)}
                                className="btn btn-sm"
                                style={{ 
                                  fontSize: '12px', 
                                  padding: '4px 8px',
                                  backgroundColor: '#007bff',
                                  borderColor: '#007bff',
                                  color: 'white'
                                }}
                              >
                                Buy
                              </button>
                              <button
                                onClick={() => navigate(`/map?type=rent&propertyId=${property.id}`)}
                                className="btn btn-sm"
                                style={{ 
                                  fontSize: '12px', 
                                  padding: '4px 8px',
                                  backgroundColor: '#28a745',
                                  borderColor: '#28a745',
                                  color: 'white'
                                }}
                              >
                                Rent
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleViewDetails(property)}
                            className="btn btn-sm btn-secondary"
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(property)}
                            className="btn btn-sm btn-primary"
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            Edit
                          </button>
                          {property.status !== 'published' && (
                            <button
                              onClick={() => handlePublish(property.id)}
                              className="btn btn-sm btn-success"
                              style={{ fontSize: '12px', padding: '4px 8px' }}
                            >
                              Publish
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(property.id)}
                            className="btn btn-sm btn-danger"
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Properties;
