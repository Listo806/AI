import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import PropertyMap from '../../components/PropertyMap';

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignedAgentId, setAssignedAgentId] = useState(null);
  const [crmStatusUpdating, setCrmStatusUpdating] = useState(false);
  const [assignAgentUpdating, setAssignAgentUpdating] = useState(false);

  useEffect(() => {
    if (isAuthenticated() && user) {
      loadProperty();
    }
  }, [id, isAuthenticated, user]);

  const loadCrmFeedItem = async () => {
    if (!id || !user) return;
    try {
      const feed = await apiClient.request('/crm/properties/feed');
      const list = Array.isArray(feed) ? feed : feed?.data ?? [];
      const item = list.find((p) => p.id === id);
      if (item?.assigned_agent_id) setAssignedAgentId(item.assigned_agent_id);
      else setAssignedAgentId(null);
    } catch {
      setAssignedAgentId(null);
    }
  };

  const loadProperty = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.request(`/properties/${id}`);
      setProperty(data);
      loadCrmFeedItem();
    } catch (err) {
      setError('Failed to load property: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this property?')) {
      return;
    }

    try {
      await apiClient.request(`/properties/${id}`, { method: 'DELETE' });
      navigate('/dashboard/properties');
    } catch (err) {
      alert('Failed to delete property: ' + err.message);
    }
  };

  const handlePublish = async () => {
    try {
      await apiClient.request(`/properties/${id}/publish`, { method: 'POST' });
      loadProperty(); // Reload to get updated status
    } catch (err) {
      alert('Failed to publish property: ' + err.message);
    }
  };

  const mapStatusToCrm = (s) => (s === 'published' ? 'available' : s === 'reserved' ? 'reserved' : s === 'sold' ? 'sold' : 'available');
  const currentCrmStatus = mapStatusToCrm(property?.status);

  const handleCrmStatusChange = async (status) => {
    if (!id || crmStatusUpdating) return;
    setCrmStatusUpdating(true);
    try {
      await apiClient.request(`/crm/properties/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      loadProperty();
    } catch (err) {
      alert('Failed to update CRM status: ' + err.message);
    } finally {
      setCrmStatusUpdating(false);
    }
  };

  const handleAssignAgent = async (agentId) => {
    if (!id || assignAgentUpdating) return;
    setAssignAgentUpdating(true);
    try {
      await apiClient.request(`/crm/properties/${id}/assign-agent`, {
        method: 'POST',
        body: JSON.stringify({ agent_id: agentId || null }),
      });
      setAssignedAgentId(agentId || null);
    } catch (err) {
      alert('Failed to assign agent: ' + err.message);
    } finally {
      setAssignAgentUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadgeClass = (status) => {
    return `crm-item-badge badge-${status || 'draft'}`;
  };

  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated() || !user) {
    return null;
  }

  if (error || !property) {
    return (
      <div>
        <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>Property Details</h1>
        <div className="crm-error">
          {error || 'Property not found'}
        </div>
        <Link to="/dashboard/properties" className="crm-btn crm-btn-secondary" style={{ marginTop: '16px' }}>
          Back to Properties
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 600 }}>{property.title}</h1>
        <span className={getStatusBadgeClass(property.status)}>
          {(property.status || 'draft').charAt(0).toUpperCase() + (property.status || 'draft').slice(1)}
        </span>
      </div>

      <div className="crm-section" style={{ marginBottom: '24px' }}>
        <h3 className="crm-section-title">Basic Information</h3>
        <div className="crm-item-details" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div><strong>Type:</strong> {property.type === 'sale' ? 'For Sale' : 'For Rent'}</div>
          {property.price && <div><strong>Price:</strong> {formatPrice(property.price)}</div>}
          {property.bedrooms && <div><strong>Bedrooms:</strong> {property.bedrooms}</div>}
          {property.bathrooms && <div><strong>Bathrooms:</strong> {property.bathrooms}</div>}
          {property.squareFeet && <div><strong>Square Feet:</strong> {property.squareFeet.toLocaleString()}</div>}
          {property.lotSize && <div><strong>Lot Size:</strong> {property.lotSize}</div>}
          {property.yearBuilt && <div><strong>Year Built:</strong> {property.yearBuilt}</div>}
        </div>
      </div>

      {property.description && (
        <div className="crm-section" style={{ marginBottom: '24px' }}>
          <h3 className="crm-section-title">Description</h3>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{property.description}</p>
        </div>
      )}

      <div className="crm-section" style={{ marginBottom: '24px' }}>
        <h3 className="crm-section-title">Location</h3>
        <div className="crm-item-details">
          {property.address && <div><strong>Address:</strong> {property.address}</div>}
          {(property.city || property.state || property.zipCode) && (
            <div>
              <strong>City, State ZIP:</strong>{' '}
              {[property.city, property.state, property.zipCode].filter(Boolean).join(', ')}
            </div>
          )}
          {(property.latitude && property.longitude) && (
            <div>
              <strong>Coordinates:</strong> {property.latitude}, {property.longitude}
            </div>
          )}
        </div>
      </div>

      {/* Map Section */}
      {property.latitude && property.longitude && (
        <div className="crm-section" style={{ marginBottom: '24px' }}>
          <h3 className="crm-section-title">Map</h3>
          <div style={{ height: '400px', borderRadius: '8px', overflow: 'hidden' }}>
            <PropertyMap 
              properties={[property]} 
              selectedProperty={property}
            />
          </div>
        </div>
      )}

      {/* CRM: Assign agent + status (Available / Reserved / Sold) */}
      <div className="crm-section" style={{ marginBottom: '24px' }}>
        <h3 className="crm-section-title">CRM</h3>
        <div className="crm-item-details" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <strong style={{ display: 'block', marginBottom: '6px' }}>Assign to Agent</strong>
            <select
              value={assignedAgentId || ''}
              onChange={(e) => {
                const v = e.target.value;
                handleAssignAgent(v || null);
              }}
              disabled={assignAgentUpdating}
              style={{
                minWidth: '200px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border, #e5e7eb)',
                background: 'var(--card, #fff)',
                color: 'var(--text, #111)',
              }}
            >
              <option value="">Unassigned</option>
              {user?.id && (
                <option value={user.id}>Me ({user.email || user.name || 'Current user'})</option>
              )}
            </select>
          </div>
          <div>
            <strong style={{ display: 'block', marginBottom: '6px' }}>CRM Status</strong>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['available', 'reserved', 'sold'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleCrmStatusChange(status)}
                  disabled={crmStatusUpdating || currentCrmStatus === status}
                  className={currentCrmStatus === status ? 'crm-btn crm-btn-primary' : 'crm-btn crm-btn-secondary'}
                  style={{ textTransform: 'capitalize' }}
                >
                  {status === 'available' ? 'Available' : status === 'reserved' ? 'Reserved' : 'Sold'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="crm-section" style={{ marginBottom: '24px' }}>
        <h3 className="crm-section-title">Metadata</h3>
        <div className="crm-item-details">
          <div><strong>Created:</strong> {formatDate(property.createdAt)}</div>
          <div><strong>Updated:</strong> {formatDate(property.updatedAt)}</div>
          {property.publishedAt && <div><strong>Published:</strong> {formatDate(property.publishedAt)}</div>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
        <Link to={`/dashboard/properties/${id}/edit`} className="crm-btn crm-btn-primary">
          Edit Property
        </Link>
        {property.status !== 'published' && (
          <button onClick={handlePublish} className="crm-btn crm-btn-primary">
            Publish
          </button>
        )}
        <button onClick={handleDelete} className="crm-btn crm-btn-danger">
          Delete
        </button>
        <Link to="/dashboard/properties" className="crm-btn crm-btn-secondary">
          Back to List
        </Link>
      </div>
    </div>
  );
}
